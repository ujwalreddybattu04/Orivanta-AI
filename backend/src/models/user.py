"""
User ORM model.
"""

from sqlalchemy import Column, String, DateTime, Enum
from sqlalchemy.sql import func
from src.db.base import Base
import uuid


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=True)  # Nullable for OAuth users
    avatar_url = Column(String, nullable=True)
    subscription_tier = Column(Enum("free", "pro", name="subscription_tier"), default="free")
    preferences = Column(String, default="{}")  # JSON string
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
