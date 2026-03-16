"""Import all models here so Alembic autogenerate can detect them."""
from src.models.user import User
from src.models.space import Space, SpaceMember
from src.models.thread import Thread
from src.models.message import Message
from src.models.source import Source
from src.models.collection import Collection, collection_threads
from src.models.group_thread import GroupThread, GroupMember, GroupMessage

__all__ = [
    "User",
    "Space", "SpaceMember",
    "Thread",
    "Message",
    "Source",
    "Collection", "collection_threads",
    "GroupThread", "GroupMember", "GroupMessage",
]
