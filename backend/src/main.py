"""
Orivanta AI — FastAPI Application Entry Point
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.api.v1.router import api_router
from src.core.events import create_start_app_handler, create_stop_app_handler

app = FastAPI(
    title="Orivanta AI API",
    description="AI-Powered Answer Engine — Backend API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes
app.include_router(api_router, prefix="/api/v1")

# Startup / Shutdown
app.add_event_handler("startup", create_start_app_handler(app))
app.add_event_handler("shutdown", create_stop_app_handler(app))


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy", "service": "orivanta-ai"}
