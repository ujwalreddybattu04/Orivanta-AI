import json
import logging
from datetime import datetime
from typing import AsyncGenerator, Dict, Any, List

from groq import AsyncGroq
from src.config.settings import settings
from src.config.prompts import RAG_SYSTEM_PROMPT, DIRECT_SYSTEM_PROMPT, PLANNING_SYSTEM_PROMPT, TITLE_SYSTEM_PROMPT, FOLLOW_UP_SYSTEM_PROMPT, ARTICLE_SUMMARY_SYSTEM_PROMPT

logger = logging.getLogger(__name__)

class GroqLLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        if not self.api_key:
            logger.warning("GROQ_API_KEY is not set. LLM generation will fail.")
            self.client = None
        else:
            self.client = AsyncGroq(api_key=self.api_key)
            
        self.default_model = settings.DEFAULT_MODEL

    def _build_system_prompt(self, context_results: List[Dict[str, Any]]) -> str:
        """Constructs a dynamic system prompt without hardcoded brand strings."""
        current_date = datetime.now().strftime("%B %d, %Y")

        if not context_results:
            return DIRECT_SYSTEM_PROMPT.format(
                brand_name=settings.BRAND_NAME,
                company_name=settings.COMPANY_NAME,
                current_date=current_date
            )

        prompt = RAG_SYSTEM_PROMPT.format(
            brand_name=settings.BRAND_NAME,
            company_name=settings.COMPANY_NAME,
            current_date=current_date
        )
        
        for idx, result in enumerate(context_results[:6], start=1):
            snippet = result.get('snippet', '')[:1000]
            prompt += f"Source [{idx}]:\n"
            prompt += f"Title: {result.get('title', 'N/A')}\n"
            prompt += f"Content: {snippet}\n\n"
            
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
                max_tokens=8192,
                stream=True,
                stop=[
                    "\n\n**Sources", "\n\nSources", "\n[", "\n- ["
                ]
            )
            
            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content
                    
        except Exception as e:
            logger.exception(f"Groq API streaming failed: {e}")
            raise e

    async def stream_article_summary(self, title: str, article_text: str, search_results: List[Dict[str, Any]], description: str = "") -> AsyncGenerator[str, None]:
        """
        Streams a narrative-style article summary using a dedicated journalist prompt.
        """
        if not self.client:
            yield "LLM generation failed because Groq API key is missing."
            return

        # Build the article-specific system prompt with source context
        system_prompt = ARTICLE_SUMMARY_SYSTEM_PROMPT
        for idx, result in enumerate(search_results[:6], start=1):
            snippet = result.get('snippet', '')[:1000]
            system_prompt += f"Source [{idx}]:\n"
            system_prompt += f"Title: {result.get('title', 'N/A')}\n"
            system_prompt += f"Content: {snippet}\n\n"

        # Build the user message with article content
        user_content = f"Write an in-depth summary of this story: \"{title}\"\n\n"
        if article_text:
            user_content += f"FULL ARTICLE TEXT:\n{article_text[:5000]}\n\n"
        if description:
            user_content += f"ARTICLE EXCERPT: {description}\n\n"
        user_content += "Write a compelling, flowing narrative summary. Tell the story. Keep it focused and conclude cleanly — do not let the piece trail off."

        messages_payload = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]

        try:
            stream = await self.client.chat.completions.create(
                messages=messages_payload,
                model=self.default_model,
                temperature=0.4,
                max_tokens=8192,
                stream=True,
                stop=["\n\n**Sources", "\n\nSources", "\n\nReferences"],
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.exception(f"Groq API article summary streaming failed: {e}")
            raise e

    async def stream_article_followup(self, title: str, followup: str, previous_summary: str, search_results: List[Dict[str, Any]]) -> AsyncGenerator[str, None]:
        """
        Streams a follow-up answer about a specific article.
        The LLM knows the article title, the previous summary, and the user's question.
        """
        if not self.client:
            yield "LLM generation failed because Groq API key is missing."
            return

        system_prompt = (
            "You are a knowledgeable journalist assistant. The user is reading an article and asking follow-up questions about it.\n\n"
            f"ARTICLE: \"{title}\"\n\n"
        )
        if previous_summary:
            system_prompt += f"YOUR PREVIOUS SUMMARY OF THIS ARTICLE:\n{previous_summary[:3000]}\n\n"

        system_prompt += (
            "RULES:\n"
            "- Answer the user's question specifically about THIS article. They are referring to THIS story.\n"
            "- Use the article context and search results to give a thorough, accurate answer.\n"
            "- Write in clear, flowing prose. Be conversational but informative.\n"
            "- Use inline citations [1], [2] when referencing sources.\n"
            "- NEVER add a Sources/References section at the end.\n"
            "- If the user asks to 'explain' or 'simplify', rewrite the content in plain language.\n\n"
            "CONTEXT DATA:\n"
        )
        for idx, result in enumerate(search_results[:6], start=1):
            snippet = result.get('snippet', '')[:1000]
            system_prompt += f"Source [{idx}]:\nTitle: {result.get('title', 'N/A')}\nContent: {snippet}\n\n"

        messages_payload = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": followup},
        ]

        try:
            stream = await self.client.chat.completions.create(
                messages=messages_payload,
                model=self.default_model,
                temperature=0.4,
                max_tokens=8192,
                stream=True,
                stop=["\n\n**Sources", "\n\nSources", "\n\nReferences"],
            )

            async for chunk in stream:
                if chunk.choices and chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        except Exception as e:
            logger.exception(f"Groq API article follow-up streaming failed: {e}")
            raise e

    async def generate_research_plan(self, query: str) -> Dict[str, Any]:
        """
        Generates a formal research intent and 3-4 specific search strings.
        Used for the 'Thinking' UI phase.
        """
        if not self.client:
            return {"intent": f"Search for {query}", "queries": [query]}
            
        system_prompt = PLANNING_SYSTEM_PROMPT
        
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
            
        system_prompt = TITLE_SYSTEM_PROMPT
        
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

    async def generate_follow_up_questions(self, query: str, context: list) -> list[str]:
        """
        Generates exactly 3 follow-up questions based on the query and context.
        Designed to be run concurrently with the main answer stream.
        """
        if not self.client:
            return []
            
        system_prompt = FOLLOW_UP_SYSTEM_PROMPT
        
        # Create a lightweight context summary to save tokens
        context_str = " ".join([f"{item.get('title', '')}: {item.get('content', '')}" for item in context])[:3000]
        user_prompt = f"Original Query: {query}\n\nContext: {context_str}"
        
        try:
            chat_completion = await self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                model=self.default_model,
                temperature=0.4,
                response_format={"type": "json_object"}
            )
            response_text = chat_completion.choices[0].message.content
            parsed = json.loads(response_text)
            questions = parsed.get("questions", [])
            return questions[:5]
        except Exception as e:
            logger.error(f"Error generating follow-ups: {str(e)}")
            return []

groq_llm_service = GroqLLMService()
