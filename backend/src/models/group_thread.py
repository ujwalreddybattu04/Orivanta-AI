"""
GroupThread ORM models — persistent storage for real-time collaborative threads.
Replaces the in-memory dict with a proper DB-backed store.
"""

import uuid
from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.base import Base


class GroupThread(Base):
    __tablename__ = "group_threads"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    token = Column(String(64), unique=True, nullable=False, index=True)     # invite URL token
    creator_name = Column(String(100), nullable=False)
    thread_data = Column(JSONB, nullable=False, default=dict, server_default="{}")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=True)             # optional expiry

    members = relationship("GroupMember", back_populates="group_thread", cascade="all, delete-orphan")
    messages = relationship("GroupMessage", back_populates="group_thread", cascade="all, delete-orphan",
                            order_by="GroupMessage.created_at")

    __table_args__ = (
        Index("ix_group_threads_token", "token"),
        Index("ix_group_threads_created", "created_at"),
    )


class GroupMember(Base):
    __tablename__ = "group_members"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_thread_id = Column(PG_UUID(as_uuid=True), ForeignKey("group_threads.id", ondelete="CASCADE"), nullable=False)
    member_token = Column(String(64), unique=True, nullable=False, index=True)  # their personal join token
    display_name = Column(String(100), nullable=False)
    is_creator = Column(Boolean, nullable=False, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    group_thread = relationship("GroupThread", back_populates="members")

    __table_args__ = (
        Index("ix_group_members_group", "group_thread_id"),
    )


class GroupMessage(Base):
    __tablename__ = "group_messages"

    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_thread_id = Column(PG_UUID(as_uuid=True), ForeignKey("group_threads.id", ondelete="CASCADE"), nullable=False)
    member_id = Column(PG_UUID(as_uuid=True), ForeignKey("group_members.id", ondelete="SET NULL"), nullable=True)
    message_type = Column(String(20), nullable=False, default="message")    # message | system
    content = Column(Text, nullable=False)
    sender_name = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    group_thread = relationship("GroupThread", back_populates="messages")

    __table_args__ = (
        Index("ix_group_messages_thread_created", "group_thread_id", "created_at"),
    )
