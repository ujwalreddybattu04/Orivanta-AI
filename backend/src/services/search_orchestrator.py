"""Search orchestrator — main RAG pipeline: query → retrieve → rank → generate → stream."""
# TODO: Implement the full search pipeline
# 1. Parse query intent (QueryRouter)
# 2. Retrieve web results (WebSearchService)
# 3. Retrieve vector results (RAGService)
# 4. Re-rank and select context
# 5. Construct prompt with context
# 6. Stream LLM response (LLMService)
# 7. Extract and verify citations (CitationService)
# 8. Return streamed answer with sources
