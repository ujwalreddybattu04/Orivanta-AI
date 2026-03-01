"""
Application settings loaded from environment variables via Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # --- App ---
    APP_ENV: str = "development"
    APP_DEBUG: bool = True

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://orivanta:orivanta_dev@localhost:5432/orivanta_ai"

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- JWT ---
    JWT_SECRET_KEY: str = "change-me-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- OAuth ---
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""

    # --- LLM Providers ---
    OPENAI_API_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    GOOGLE_AI_API_KEY: str = ""

    # --- Web Search ---
    BRAVE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_CX: str = ""
    BING_SEARCH_API_KEY: str = ""

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_PER_DAY: int = 300

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
