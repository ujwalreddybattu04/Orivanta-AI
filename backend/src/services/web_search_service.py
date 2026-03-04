import logging
from typing import List, Dict, Any, Optional
from tavily import AsyncTavilyClient

from src.config.settings import settings

logger = logging.getLogger(__name__)

class TavilySearchService:
    def __init__(self):
        self.api_key = settings.TAVILY_API_KEY
        if not self.api_key:
            logger.warning("TAVILY_API_KEY is not set. Web search will fail.")
            self.client = None
        else:
            self.client = AsyncTavilyClient(api_key=self.api_key)

    async def search(self, query: str, max_results: int = 12) -> List[Dict[str, Any]]:
        """
        Perform a web search using the Tavily API.
        Returns a list of dictionaries with 'title', 'url', 'content', 'snippet', etc.
        """
        if not self.client:
            logger.error("Attempted to search without Tavily API key.")
            return []

        try:
            logger.info(f"Searching Tavily for: {query}")
            response = await self.client.search(
                query=query,
                max_results=max_results,
                search_depth="advanced",
                include_answer=False,
                include_images=False,
                include_raw_content=False,
            )
            
            results = []
            for item in response.get("results", []):
                domain = item.get("url", "").split("/")[2] if "://" in item.get("url", "") else ""
                if domain.startswith("www."):
                    domain = domain[4:]
                    
                results.append({
                    "title": item.get("title", "Unknown Title"),
                    "url": item.get("url", ""),
                    "snippet": item.get("content", ""),
                    "domain": domain
                })
                
            return results
        except Exception as e:
            logger.exception(f"Tavily search failed: {e}")
            return []

tavily_search_service = TavilySearchService()
