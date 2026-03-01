"""
Application lifecycle event handlers.
"""

from fastapi import FastAPI
from src.config.logging import setup_logging, logger


def create_start_app_handler(app: FastAPI):
    async def start_app() -> None:
        setup_logging()
        logger.info("🚀 Orivanta AI API starting up...")
        # TODO: Initialize DB connection pool
        # TODO: Initialize Redis connection
        # TODO: Warm up LLM providers
        logger.info("✅ Startup complete")

    return start_app


def create_stop_app_handler(app: FastAPI):
    async def stop_app() -> None:
        logger.info("🛑 Orivanta AI API shutting down...")
        # TODO: Close DB connections
        # TODO: Close Redis connections
        logger.info("👋 Shutdown complete")

    return stop_app
