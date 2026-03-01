"""
Source ORM model — cited sources for each message.
"""

from sqlalchemy import Column, String, Text, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from src.db.base import Base
import uuid


class Source(Base):
    __tablename__ = "sources"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String, ForeignKey("messages.id"), nullable=False, index=True)
    url = Column(String, nullable=False)
    title = Column(String, nullable=False)
    domain = Column(String, nullable=False)
    favicon_url = Column(String, nullable=True)
    snippet = Column(Text, nullable=True)
    citation_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="sources")
