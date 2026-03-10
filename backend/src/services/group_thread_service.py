"""
Group Thread Service — In-memory state management for real-time collaborative threads.
For production scale, replace the in-memory store with Redis pub/sub.
"""

import uuid
import time
from typing import Dict, List, Optional, Any
from fastapi import WebSocket


class GroupThread:
    def __init__(self, token: str, creator_name: str, thread_data: Optional[Dict] = None):
        self.token = token
        self.created_at = time.time()
        self.members: List[Dict] = []
        self.messages: List[Dict] = []
        self.thread_data = thread_data or {}
        self.creator_name = creator_name
        self.connections: Dict[str, WebSocket] = {}


class GroupThreadService:
    def __init__(self):
        self._threads: Dict[str, GroupThread] = {}

    def create_group_thread(
        self,
        creator_name: str,
        thread_data: Optional[Dict] = None
    ):
        token = uuid.uuid4().hex[:16]
        group = GroupThread(
            token=token,
            creator_name=creator_name,
            thread_data=thread_data or {}
        )

        creator_id = uuid.uuid4().hex
        group.members.append({
            "id": creator_id,
            "name": creator_name,
            "joined_at": time.time(),
            "is_creator": True,
        })

        group.messages.append({
            "id": uuid.uuid4().hex,
            "type": "system",
            "text": f"{creator_name} created the group thread",
            "timestamp": time.time(),
            "sender_name": "system",
        })

        self._threads[token] = group
        return group, creator_id

    def get_group_thread(self, token: str) -> Optional[GroupThread]:
        return self._threads.get(token)

    def join_group_thread(self, token: str, member_name: str):
        group = self._threads.get(token)
        if not group:
            return None, None, None

        member_id = uuid.uuid4().hex
        group.members.append({
            "id": member_id,
            "name": member_name,
            "joined_at": time.time(),
            "is_creator": False,
        })

        join_message = {
            "id": uuid.uuid4().hex,
            "type": "system",
            "text": f"{member_name} joined the group thread",
            "timestamp": time.time(),
            "sender_name": "system",
        }
        group.messages.append(join_message)
        return group, member_id, join_message

    async def add_message(self, token: str, member_id: str, text: str) -> Optional[Dict]:
        group = self._threads.get(token)
        if not group:
            return None

        member = next((m for m in group.members if m["id"] == member_id), None)
        if not member:
            return None

        message = {
            "id": uuid.uuid4().hex,
            "type": "message",
            "text": text,
            "timestamp": time.time(),
            "sender_id": member_id,
            "sender_name": member["name"],
        }
        group.messages.append(message)
        return message

    async def broadcast(self, token: str, data: Dict, exclude_id: Optional[str] = None):
        group = self._threads.get(token)
        if not group:
            return

        dead = []
        for mid, ws in group.connections.items():
            if mid == exclude_id:
                continue
            try:
                await ws.send_json(data)
            except Exception:
                dead.append(mid)

        for mid in dead:
            group.connections.pop(mid, None)

    def connect_member(self, token: str, member_id: str, websocket: WebSocket):
        group = self._threads.get(token)
        if group:
            group.connections[member_id] = websocket

    def disconnect_member(self, token: str, member_id: str):
        group = self._threads.get(token)
        if group:
            group.connections.pop(member_id, None)

    def get_member(self, token: str, member_id: str) -> Optional[Dict]:
        group = self._threads.get(token)
        if not group:
            return None
        return next((m for m in group.members if m["id"] == member_id), None)


# Singleton instance
group_thread_service = GroupThreadService()
