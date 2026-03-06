import json
import logging
from typing import AsyncGenerator, Dict, Any, List

from groq import AsyncGroq
from src.config.settings import settings

logger = logging.getLogger(__name__)

class GroqLLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set. LLM generation will fail.")
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)
            
        self.default_model = "llama-3.1-8b-instant"

    def _build_system_prompt(self, context_results: List[Dict[str, Any]]) -> str:
        """Constructs the system prompt with context from search results."""
        prompt = (
            "You are Orivanta AI, a highly intelligent and precise answer engine. "
            "Your goal is to provide comprehensive, accurate, and well-structured answers "
            "based strictly on the provided web search context.\n\n"
            "CRITICAL INSTRUCTIONS:\n"
            "1. You MUST use inline citations in the format [1], [2], [3], etc., immediately after the fact they support.\n"
            "2. Ensure citations correspond EXACTLY to the numbers assigned in the context block below.\n"
            "3. Do NOT make up information. If the context does not contain the answer, state that you don't know based on the search results.\n"
            "4. Format the output using beautiful Markdown: use bold text, bullet points, and headers (## or ###) for a clean structure.\n"
            "5. ABSOLUTE FORBIDDEN: Do NOT output a 'References', 'Sources', or bibliography list at the end. The frontend UI handles the sources independently. ONLY use inline citation numbers like [1]. If you output a list of sources at the end, the user will be unable to see the answer. DO NOT LIST URLs.\n"
            "6. CRITICAL: Start the answer DIRECTLY. No conversational meta-talk or internal monologues.\n\n"
            "CONTEXT block:\n"
        )
        
        for idx, result in enumerate(context_results, start=1):
            prompt += f"Source [{idx}]:\n"
            prompt += f"Title: {result.get('title', 'N/A')}\n"
            prompt += f"Domain: {result.get('domain', 'N/A')}\n"
            prompt += f"Content: {result.get('snippet', '')}\n\n"
            
        return prompt

    async def stream_answer(self, query: str, context_results: List[Dict[str, Any]], history: List[Dict[str, str]] = None) -> AsyncGenerator[str, None]:
        """
        Streams the LLM response chunk by chunk using Groq.
        """
        if not self.client:
            # Assuming error_event is defined elsewhere or this is a placeholder for a structured error.
            # For now, keeping the original string message as error_event is not defined in this context.
            yield "LLM generation failed because Groq API key is missing."
            return

        system_prompt = self._build_system_prompt(context_results)
        
        # Build message history
        messages_payload = [{"role": "system", "content": system_prompt}]
        if history:
            # Take only the last 4 messages (2 complete turns) to save tokens
            recent_history = history[-4:]
            messages_payload.extend(recent_history)
        messages_payload.append({"role": "user", "content": query})

        try:
            stream = await self.client.chat.completions.create(
                messages=messages_payload,
                model=self.default_model,
                temperature=0.2, # Low temperature for factual RAG
                max_tokens=2048,
                stream=True,
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.exception(f"Groq API streaming failed: {e}")
            raise e

    async def generate_research_plan(self, query: str) -> Dict[str, Any]:
        """
        Generates a formal research intent and 3-4 specific search strings.
        Used for the 'Thinking' UI phase.
        """
        if not self.client:
            return {"intent": f"Search for {query}", "queries": [query]}
            
        system_prompt = (
            "You are a Research Architect. Given a user query, refine it into a single professional "
            "research intent statement and 3-4 specific, optimized search queries for a web search engine.\n\n"
            "Output EXACTLY in the following JSON format:\n"
            "{\n"
            "  \"intent\": \"A professional, dynamic research objective (e.g., 'Synthesizing market trends for Nvidia...', 'Analyzing historical etymology...', 'Mapping technical specifications...')\",\n"
            "  \"queries\": [\"sub-query 1\", \"sub-query 2\", \"sub-query 3\"]\n"
            "}"
        )
        
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                model=self.default_model,
                temperature=0.3,
                max_tokens=200,
                response_format={"type": "json_object"}
            )
            return json.loads(chat_completion.choices[0].message.content)
        except Exception as e:
            logger.error(f"Error generating research plan: {str(e)}")
            return {"intent": f"Searching for {query}...", "queries": [query]}

    async def generate_thread_title(self, query: str) -> str:
        """
        Generates a concise 3-5 word title based on the user's initial query.
        """
        if not self.client:
            return "New Thread"
            
        system_prompt = (
            "You are a Title Generator. Based on the user's query, generate a concise, descriptive "
            "title for an AI chat thread. The title MUST be 2 to 5 words long. "
            "Do not use quotes, punctuation, or conversational fillers. Examples: "
            "History of Deep Learning, React Server Components, Python Asyncio Best Practices."
        )
        
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                model=self.default_model,
                temperature=0.3,
                max_tokens=20,
            )
            return chat_completion.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Error generating title: {str(e)}")
            return "New Thread"

groq_llm_service = GroqLLMService()
