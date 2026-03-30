''' testing script of tavily search '''
import asyncio
from tavily import AsyncTavilyClient

async def test_tavily():
    api_key = "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"
    client = AsyncTavilyClient(api_key=api_key)
    
    print(f"Testing Tavily with key: {api_key[:10]}...")
    try:
        response = await client.search(
            query="deep learning basics",
            search_depth="advanced"
        )
        print("Tavily Response keys:", response.keys())
        results = response.get("results", [])
        print(f"Found {len(results)} results")
        if results:
            print("Sample result title:", results[0].get("title"))
    except Exception as e:
        print(f"Tavily Test FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_tavily())
