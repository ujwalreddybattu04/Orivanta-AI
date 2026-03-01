"""
Threads endpoints — CRUD for conversation threads.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def list_threads():
    """List all threads for the current user."""
    # TODO: Implement with thread_service
    return []


@router.post("")
async def create_thread(query: str = "", focus_mode: str = "all"):
    """Create a new thread from a search query."""
    # TODO: Implement thread creation
    return {"id": "placeholder", "title": query}


@router.get("/{thread_id}")
async def get_thread(thread_id: str):
    """Get a specific thread with all messages."""
    # TODO: Implement
    return {"id": thread_id, "messages": []}


@router.post("/{thread_id}/messages")
async def send_message(thread_id: str, content: str = ""):
    """Send a follow-up message in a thread."""
    # TODO: Implement
    return {"id": "placeholder", "thread_id": thread_id, "content": content}


@router.delete("/{thread_id}")
async def delete_thread(thread_id: str):
    """Delete a thread."""
    # TODO: Implement
    return {"deleted": True}
