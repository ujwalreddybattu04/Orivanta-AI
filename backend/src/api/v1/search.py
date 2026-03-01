"""
Search endpoints — POST /search (streaming SSE)
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse

router = APIRouter()


@router.post("")
async def search(query: str = "", focus_mode: str = "all", model: str = "gpt-4o"):
    """Submit a search query and receive a streaming AI-generated answer with citations."""
    # TODO: Implement search orchestrator pipeline
    async def event_stream():
        yield f'data: {{"type":"token","content":"Search endpoint ready. Query: {query}"}}\n\n'
        yield 'data: {"type":"sources","items":[]}\n\n'
        yield 'data: {"type":"done"}\n\n'

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/suggestions")
async def search_suggestions(query: str = ""):
    """Get auto-complete search suggestions."""
    # TODO: Implement suggestion engine
    return []
