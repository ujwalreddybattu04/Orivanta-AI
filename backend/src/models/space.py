"""
Space ORM model — collaborative workspace.
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func
from src.db.base import Base
import uuid


class Space(Base):
    __tablename__ = "spaces"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    owner_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    custom_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
