"""
Collection ORM model — user-organized groups of threads.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey, Table
from sqlalchemy.sql import func
from src.db.base import Base
import uuid

# Many-to-many: collections <-> threads
collection_threads = Table(
    "collection_threads",
    Base.metadata,
    Column("collection_id", String, ForeignKey("collections.id"), primary_key=True),
    Column("thread_id", String, ForeignKey("threads.id"), primary_key=True),
)


class Collection(Base):
    __tablename__ = "collections"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
