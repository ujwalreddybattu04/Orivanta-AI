"""
Group Thread API — Real-time collaborative AI threads.
Endpoints:
  POST   /group-threads/create       — create new group thread
  GET    /group-threads/{token}      — get thread info
  POST   /group-threads/{token}/join — join a thread
  WS     /group-threads/{token}/ws/{member_id}  — real-time WebSocket
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any

from src.services.group_thread_service import group_thread_service

router = APIRouter()


class CreateGroupThreadRequest(BaseModel):
    creator_name: str
    thread_data: Optional[Dict[str, Any]] = None


class JoinGroupThreadRequest(BaseModel):
    member_name: str


@router.post("/create")
async def create_group_thread(request: CreateGroupThreadRequest):
    group, creator_id = group_thread_service.create_group_thread(
        creator_name=request.creator_name,
        thread_data=request.thread_data,
    )
    return {
        "token": group.token,
        "creator_id": creator_id,
        "members": group.members,
        "messages": group.messages,
        "thread_data": group.thread_data,
    }


@router.get("/{token}")
async def get_group_thread(token: str):
    group = group_thread_service.get_group_thread(token)
    if not group:
        raise HTTPException(status_code=404, detail="Group thread not found")
    return {
        "token": group.token,
        "creator_name": group.creator_name,
        "members": group.members,
        "messages": group.messages,
        "thread_data": group.thread_data,
    }


@router.post("/{token}/join")
async def join_group_thread(token: str, request: JoinGroupThreadRequest):
    group, member_id, join_message = group_thread_service.join_group_thread(
        token, request.member_name
    )
    if not group:
        raise HTTPException(status_code=404, detail="Group thread not found")

    # Broadcast join event to all existing connected members
    await group_thread_service.broadcast(token, {
        "event": "system",
        "message": join_message,
    })

    return {
        "token": group.token,
        "member_id": member_id,
        "members": group.members,
        "messages": group.messages,
        "thread_data": group.thread_data,
    }


@router.websocket("/{token}/ws/{member_id}")
async def group_thread_websocket(websocket: WebSocket, token: str, member_id: str):
    group = group_thread_service.get_group_thread(token)
    if not group:
        await websocket.close(code=4004)
        return

    member = group_thread_service.get_member(token, member_id)
    if not member:
        await websocket.close(code=4003)
        return

    await websocket.accept()
    group_thread_service.connect_member(token, member_id, websocket)

    # Notify others that this member connected
    await group_thread_service.broadcast(token, {
        "event": "member_online",
        "member_id": member_id,
        "member_name": member["name"],
    }, exclude_id=member_id)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "message":
                text = str(data.get("text", "")).strip()
                if text:
                    message = await group_thread_service.add_message(token, member_id, text)
                    if message:
                        await group_thread_service.broadcast(token, {
                            "event": "message",
                            "message": message,
                        })

            elif data.get("type") == "ping":
                await websocket.send_json({"event": "pong"})

    except WebSocketDisconnect:
        group_thread_service.disconnect_member(token, member_id)
        await group_thread_service.broadcast(token, {
            "event": "member_offline",
            "member_id": member_id,
            "member_name": member["name"],
        })
    except Exception:
        group_thread_service.disconnect_member(token, member_id)
