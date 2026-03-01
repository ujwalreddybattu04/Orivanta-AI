"""
Discover endpoints — Trending and curated content feed.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def get_discover_feed(category: str = None):
    """Get trending topics and curated content."""
    # TODO: Implement discover service
    return []
