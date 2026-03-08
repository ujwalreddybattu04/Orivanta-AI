import json
import asyncio
import logging
from typing import AsyncGenerator

from src.services.web_search_service import tavily_search_service
from src.services.llm_service import groq_llm_service
from src.services.query_router import query_router
from src.config.settings import settings

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
            
            # --- PHASE 0: SPECULATIVE LAUNCH ---
            route_task = asyncio.create_task(query_router.route_query(query))
            # Fetch a few extra to ensure we can satisfy the 10-result requirement if some are filtered
            search_task = asyncio.create_task(tavily_search_service.search(query, max_results=settings.MAX_SEARCH_RESULTS + 2))
            plan_task = asyncio.create_task(groq_llm_service.generate_research_plan(query))
            
            yield f"data: {json.dumps({'type': 'status', 'content': 'Analyzing query...'})}\n\n"
            
            # --- PHASE 1: AWAIT ROUTING DECISION ---
            route = await route_task
            intent = "SEARCH"
            if isinstance(route, dict):
                intent = route.get("intent", "SEARCH")
            
            if intent in ["IDENTITY", "DIRECT"]:
                 logger.info(f"Optimization: Intent is {intent}. Switching to direct path.")
                 search_task.cancel()
                 plan_task.cancel()
                 
                 thought_time = time.time() - start_time
                 yield f"data: {json.dumps({'type': 'thought_time', 'time': round(thought_time, 1)})}\n\n"
                 
                 async for chunk in groq_llm_service.stream_answer(query, [], messages):
                     yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                 
                 yield "data: {\"type\":\"done\"}\n\n"
                 return

            # --- PHASE 2: INSTANT FEEDBACK ---
            # Yield the first pill IMMEDIATELY. Zero wait for plan/search.
            yield f"data: {json.dumps({'type': 'query_step', 'content': query})}\n\n"
            yield f"data: {json.dumps({'type': 'status', 'content': 'Searching the web'})}\n\n"

            # --- PHASE 3: SYNC SEARCH RESULTS (PRIORITY) ---
            # Wait for search results first! They are the core of the answer.
            search_data = await search_task
            
            # Defensive check
            if not isinstance(search_data, dict):
                search_results = []
                images = []
            else:
                # Strictly enforce the configured limit
                search_results = search_data.get("results", [])[:settings.MAX_SEARCH_RESULTS]
                images = search_data.get("images", [])
            
            # Format and yield sources immediately
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
            
            yield f"data: {json.dumps({'type': 'sources', 'sources': frontend_sources, 'items': frontend_sources})}\n\n"
            if images:
                yield f"data: {json.dumps({'type': 'images', 'images': images})}\n\n"
            
            # --- PHASE 4: LAYER IN PLAN (If available) ---
            # Await the plan now. If it's done, we show extra pills.
            # If it's slow, we don't hold up the LLM stream any longer.
            try:
                # Give the plan a few more ms to finish if it hasn't, but don't block heavily
                plan = await asyncio.wait_for(plan_task, timeout=0.5)
                refined_intent = plan.get("intent")
                if refined_intent:
                    yield f"data: {json.dumps({'type': 'thought', 'content': refined_intent})}\n\n"
                
                sub_queries = plan.get("queries", [query])
                # Skip the first query if it's the same as our instant pill
                for sq in sub_queries:
                    if sq.lower().strip("?") != query.lower().strip("?"):
                        yield f"data: {json.dumps({'type': 'query_step', 'content': sq})}\n\n"
            except Exception:
                logger.warning("Research plan timed out or failed, proceeding with primary search")
            
            # --- PHASE 5: START LLM STREAM ---
            thought_time = time.time() - start_time
            yield f"data: {json.dumps({'type': 'thought_time', 'time': round(thought_time, 1)})}\n\n"
            yield f"data: {json.dumps({'type': 'status', 'content': 'Thinking'})}\n\n"

            # CONCURRENT TASK: Generate follow-up questions while the main answer streams
            follow_up_task = asyncio.create_task(
                groq_llm_service.generate_follow_up_questions(query, search_results)
            )

            import re
            
            # Robust buffer to catch 'Sources' sections even if split across tokens
            buffer = ""
            # Regex to detect common hallucinated bibliography headers OR clusters of markdown links
            # Catch: ## Sources, **Sources**, [Domain](link), etc.
            cutoff_pattern = re.compile(
                r'(?:\n+|^)\s*(?:(?:\*\*|### |# )?(?:Sources|References|Bibliography)(?:\*\*|:)?|' # Header match
                r'(?:\[[^\]]+\]\(https?://[^\s\)]+\)\s*){2,})', # Link cluster match (2+)
                re.IGNORECASE
            )
            
            async for chunk in groq_llm_service.stream_answer(query, search_results, messages):
                buffer += chunk
                
                # Check for 'Sources' pattern in the last ~150 chars (increased window)
                search_window = buffer[-150:] if len(buffer) > 150 else buffer
                if cutoff_pattern.search(search_window):
                    # We hit the forbidden section. Stop streaming immediately.
                    logger.info("[orchestrator] NUCLEAR CUTOFF: Detect list/cluster. Truncating stream.")
                    break
                    
                yield f"data: {json.dumps({'type': 'token', 'content': chunk})}\n\n"
                
            # Stream is finished. Await the concurrent follow-ups.
            # Because it ran concurrently, this should take ~0 added seconds.
            try:
                related = await follow_up_task
                if related:
                    yield f"data: {json.dumps({'type': 'related', 'questions': related})}\n\n"
            except Exception as e:
                logger.warning(f"Failed to fetch follow-ups: {e}")

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
