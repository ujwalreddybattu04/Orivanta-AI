"""
Thread ORM model — conversation container.
"""

from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.base import Base
import uuid


class Thread(Base):
    __tablename__ = "threads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    space_id = Column(String, ForeignKey("spaces.id"), nullable=True)
    title = Column(String, nullable=False)
    focus_mode = Column(String, default="all")
    model_used = Column(String, default="gpt-4o")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages = relationship("Message", back_populates="thread", cascade="all, delete-orphan")
