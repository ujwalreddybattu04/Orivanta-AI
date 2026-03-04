import json
import logging
from typing import AsyncGenerator

from src.services.web_search_service import tavily_search_service
from src.services.llm_service import groq_llm_service

logger = logging.getLogger(__name__)

class SearchOrchestrator:
    async def stream_search(self, query: str, focus_mode: str = "all", messages: list = None) -> AsyncGenerator[str, None]:
        """
        Orchestrates the search:
        1. Fetch search results
        2. Stream sources to client
        3. Stream LLM generated answer
        """
        if not query.strip():
            yield "data: {\"type\":\"error\",\"message\":\"Query cannot be empty\"}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"
            return
            
        try:
            logger.info(f"Orchestrating search for: {query} with focus: {focus_mode}")
            
            # 1. Fetch search results
            search_results = await tavily_search_service.search(query, max_results=12)
            
            # Format sources for frontend: must be {url, title, domain, snippet, citationIndex}
            frontend_sources = []
            for idx, res in enumerate(search_results, start=1):
                frontend_sources.append({
                    "url": res.get("url"),
                    "title": res.get("title"),
                    "domain": res.get("domain"),
                    "snippet": res.get("snippet"),
                    "citationIndex": idx
                })
            
            # 2. Yield Sources Event
            sources_event = {
                "type": "sources",
                "sources": frontend_sources
            }
            yield f"data: {json.dumps(sources_event)}\n\n"
            
            # 3. Stream LLM Answer
            # Instead of a single "token" event with the whole text, we stream it chunk by chunk.
            # We slice search_results to top 5 to avoid aggressively hitting Groq's 6000 TPM limit.
            async for chunk in groq_llm_service.stream_answer(query, search_results[:5], messages):
                token_event = {
                    "type": "token",
                    "content": chunk
                }
                yield f"data: {json.dumps(token_event)}\n\n"
                
            # 4. End Stream
            yield "data: {\"type\":\"done\"}\n\n"
            
        except Exception as e:
            logger.exception(f"Search orchestrator failed: {e}")
            
            error_message = str(e)
            if "Rate limit" in error_message or "429" in error_message:
                error_message = "Rate limit reached. Please check your Groq console."
            
            error_event = {
                "type": "error",
                "message": error_message
            }
            yield f"data: {json.dumps(error_event)}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"

search_orchestrator = SearchOrchestrator()
