"""
Application settings loaded from environment variables via Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # --- App ---
    APP_ENV: str = "development"
    APP_DEBUG: bool = True
    BRAND_NAME: str = "Corten"
    COMPANY_NAME: str = "Calvior Labs"
    BRAND_DESCRIPTION: str = "the AI assistant by Calvior Labs"

    # --- Database ---
    DATABASE_URL: str = "postgresql+asyncpg://corten:corten_dev@localhost:5432/corten_ai"

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
    GROQ_API_KEY: str = ""
    
    # Models
    DEFAULT_MODEL: str = "llama-3.1-8b-instant"
    ROUTER_MODEL: str = "llama-3.1-8b-instant"

    # --- Discover / News ---
    NEWSAPI_KEY: str = ""
    GUARDIAN_API_KEY: str = ""
    OPENWEATHER_API_KEY: str = ""

    # --- Web Search ---
    MAX_SEARCH_RESULTS: int = 10
    BRAVE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_API_KEY: str = ""
    GOOGLE_SEARCH_CX: str = ""
    BING_SEARCH_API_KEY: str = ""
    TAVILY_API_KEY: str = ""
    SERPER_API_KEY: str = ""

    # --- Rate Limiting ---
    RATE_LIMIT_PER_MINUTE: int = 30
    RATE_LIMIT_PER_DAY: int = 300

    # --- CORS ---
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
