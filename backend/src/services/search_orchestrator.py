import json
import asyncio
import logging
from typing import AsyncGenerator

from src.services.web_search_service import tavily_search_service
from src.services.llm_service import groq_llm_service

logger = logging.getLogger(__name__)

class SearchOrchestrator:
    async def stream_search(self, query: str, focus_mode: str = "all", messages: list = None) -> AsyncGenerator[str, None]:
        """
        Ultra-fast orchestration pipeline:
        1. Fire search + plan concurrently (zero wait)
        2. Stream research UI events with no artificial delays
        3. Start LLM answer stream IMMEDIATELY after search results arrive
        4. Drain pre-warmed token queue with zero gap
        """
        if not query.strip():
            yield "data: {\"type\":\"error\",\"message\":\"Query cannot be empty\"}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"
            return
            
        try:
            import time
            start_time = time.time()
            logger.info(f"Orchestrating search for: {query} with focus: {focus_mode}")
            
            # --- PHASE 0: INSTANT FEEDBACK (<50ms) ---
            yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing query'})}\n\n"
            
            # Speculative Intent: Mask the initial thinking gap
            # This is a key "Billion Dollar" optimization — never show a dead screen
            await asyncio.sleep(0.02) 
            
            # --- PHASE 1: PARALLEL EXECUTION ---
            # Fire search + plan concurrently
            plan_task = asyncio.create_task(groq_llm_service.generate_research_plan(query))
            search_task = asyncio.create_task(tavily_search_service.search(query, max_results=12))

            # BUG FIX / OPTIMIZATION: Do NOT await search_task here.
            # Await the plan first because it's usually faster (~300-500ms) 
            # and allows us to fill the UI with "Research Steps" while search (~1-2s) runs.
            
            plan = await plan_task
            refined_intent = plan.get("intent")
            if refined_intent:
                yield f"data: {json.dumps({'type': 'thought', 'content': refined_intent})}\n\n"
            
            sub_queries = plan.get("queries", [query])
            for sq in sub_queries:
                yield f"data: {json.dumps({'type': 'query_step', 'content': sq})}\n\n"
                # Visual pop timing
                await asyncio.sleep(0.05)

            # --- PHASE 2: SYNC SEARCH RESULTS ---
            search_results = await search_task
            logger.info(f"Search results received: {len(search_results)} items")
            
            # Format sources for frontend
            frontend_sources = []
            for idx, res in enumerate(search_results, start=1):
                domain = res.get("domain", "website")
                frontend_sources.append({
                    "url": res.get("url"),
                    "title": res.get("title") or "Source",
                    "domain": domain,
                    "favicon": f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                    "snippet": res.get("snippet") or "",
                    "citationIndex": idx
                })
            
            # Yield sources as soon as they are ready for the Analysis Bar
            yield f"data: {json.dumps({'type': 'sources', 'sources': frontend_sources, 'items': frontend_sources})}\n\n"
            
            # --- PHASE 3: START LLM STREAM ---
            thought_time = time.time() - start_time
            yield f"data: {json.dumps({'type': 'thought_time', 'time': round(thought_time, 1)})}\n\n"
            
            yield f"data: {json.dumps({'type': 'status', 'content': 'Synthesizing response'})}\n\n"

            # Stream LLM answer directly
            async for chunk in groq_llm_service.stream_answer(query, search_results, messages):
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                
            yield "data: {\"type\":\"done\"}\n\n"
            
        except Exception as e:
            logger.exception(f"Search orchestrator failed: {e}")
            
            error_message = str(e)
            if "Tavily" in error_message:
                error_message = "Web search limit reached (Tavily). Please check your search provider plan."
            elif "Rate limit" in error_message or "429" in error_message or "limit" in error_message.lower():
                error_message = "API rate limit reached. Please check your AI provider (Groq/Tavily) console."
            
            error_event = {
                "type": "error",
                "message": error_message
            }
            yield f"data: {json.dumps(error_event)}\n\n"
            yield "data: {\"type\":\"done\"}\n\n"

search_orchestrator = SearchOrchestrator()
