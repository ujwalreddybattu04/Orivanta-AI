"""
# Corten AI — FastAPI Application Entry Point
"""

import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config.settings import settings
from src.api.v1.router import api_router
from src.core.events import create_start_app_handler, create_stop_app_handler

logger = logging.getLogger(__name__)

app = FastAPI(
    title=f"{settings.BRAND_NAME} AI API",
    description="AI-Powered Answer Engine — Backend API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS - Allow all for development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
    return {"status": "healthy", "service": f"{settings.BRAND_NAME.lower()}-ai"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
