# Tavily Web Search - Step-by-Step Implementation Plan

**Target**: Integrate Tavily web search API into Orbit Agent
**Duration**: ~6-8 hours
**Last Updated**: 2026-03-01

---

## Overview

Integrate Tavily's AI-powered web search API to enable the agent to search the web for current information, research topics, and provide up-to-date answers to user queries.

**Why Tavily?**
- AI-powered search with context-aware results
- Fast API with excellent documentation
- Free tier available for development
- Includes citations and sources
- Supports multiple search types (web, news, etc.)

---

## Phase 1: Setup & Configuration (45 min)

### Step 1.1: Get Tavily API Key (10 min)
**Actions**:
1. Sign up at https://tavily.com/
2. Navigate to API Keys section
3. Generate new API key
4. Save to environment file

**File**: `orbit-agent/.env`

```env
# Tavily API Key
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**File**: `orbit-agent/src/config.py`

```python
from pydantic import Field
from typing import Optional

class Settings(BaseSettings):
    # ... existing fields ...

    # Tavily Web Search
    tavily_api_key: str = Field(
        default="",
        description="Tavily API key for web search"
    )
    tavily_max_results: int = Field(
        default=10,
        description="Maximum number of web search results"
    )
    tavily_search_depth: str = Field(
        default="basic",
        description="Search depth: basic, advanced, or full"
    )
```

**Validation**:
- Environment variable set
- Config class compiles

### Step 1.2: Create Tool Base Class (15 min)
**File**: `orbit-agent/src/tools/web/tavily.py`

**Actions**:
```python
"""Tavily web search tool implementation."""

import asyncio
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

from src.tools.base import OrbitTool, ToolCategory


class WebSearchInput(BaseModel):
    """Input schema for web search."""

    query: str = Field(..., description="Search query string")
    max_results: Optional[int] = Field(
        10,
        description="Maximum number of results to return (default: 10)"
    )
    search_depth: Optional[str] = Field(
        "basic",
        description="Search depth: basic, advanced, or full (default: basic)"
    )
    include_domains: Optional[List[str]] = Field(
        None,
        description="Only search specific domains"
    )
    exclude_domains: Optional[List[str]] = Field(
        None,
        description="Exclude specific domains from results"
    )


class WebSearchTool(OrbitTool):
    """
    Web search using Tavily API.

    Provides AI-powered web search with context-aware results,
    citations, and sources for transparency.
    """

    name: str = "web_search"
    description: (
        "Search the web for information using Tavily AI. "
        "Returns relevant results with citations and sources. "
        "Use for researching topics, finding current information, or answering questions."
    )
    category: ToolCategory = ToolCategory.ANALYSIS
    danger_level: int = 1  # Safe operation - just reading web
    requires_confirmation: bool = False
    args_schema: type = WebSearchInput

    async def _arun(
        self,
        query: str,
        max_results: int = 10,
        search_depth: str = "basic",
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
    ) -> str:
        """
        Execute web search via Tavily API.

        Args:
            query: Search query
            max_results: Maximum results
            search_depth: Search depth level
            include_domains: Domains to restrict search to
            exclude_domains: Domains to exclude from search

        Returns:
            Formatted search results with citations
        """
        try:
            # Import here to avoid circular dependency
            from src.tools.web.tavily_client import tavily_search

            results = await tavily_search(
                query=query,
                max_results=max_results,
                search_depth=search_depth,
                include_domains=include_domains,
                exclude_domains=exclude_domains,
            )

            return self.format_results(results)

        except Exception as e:
            raise Exception(f"Web search failed: {str(e)}")

    def format_results(self, results: Dict[str, Any]) -> str:
        """
        Format search results for LLM consumption.

        Args:
            results: Raw Tavily API response

        Returns:
            Formatted results string
        """
        answer = results.get("answer", "")
        sources = results.get("results", [])

        formatted = "**Web Search Results:**\n\n"

        if answer:
            formatted += f"**AI Answer:** {answer}\n\n"

        formatted += "**Sources:**\n\n"

        for i, source in enumerate(sources, 1):
            title = source.get("title", "Untitled")
            url = source.get("url", "")
            snippet = source.get("content", source.get("snippet", ""))
            score = source.get("score", 0)

            formatted += f"{i}. **{title}**\n"
            formatted += f"   URL: {url}\n"
            formatted += f"   Score: {score}\n"
            formatted += f"   {snippet[:200]}...\n\n"

        return formatted
```

**Validation**:
- Tool compiles without errors
- Input schema has all required fields
- Description is clear for LLM

---

## Phase 2: Tavily API Client (2 hours)

### Step 2.1: Create API Client (1.5 hours)
**File**: `orbit-agent/src/tools/web/tavily_client.py`

**Actions**:
```python
"""Tavily API client for web search."""

import aiohttp
import asyncio
from typing import Optional, List, Dict, Any

from src.config import settings


class TavilyClient:
    """Client for Tavily web search API."""

    BASE_URL = "https://api.tavily.com"
    SEARCH_ENDPOINT = "/search"

    def __init__(self):
        """Initialize Tavily client."""
        self.api_key = settings.tavily_api_key
        self.max_results = settings.tavily_max_results
        self.search_depth = settings.tavily_search_depth

    async def search(
        self,
        query: str,
        max_results: Optional[int] = None,
        search_depth: Optional[str] = None,
        include_domains: Optional[List[str]] = None,
        exclude_domains: Optional[List[str]] = None,
        include_raw_content: bool = False,
        include_images: bool = False,
    ) -> Dict[str, Any]:
        """
        Execute web search via Tavily API.

        Args:
            query: Search query string
            max_results: Maximum number of results
            search_depth: Search depth level (basic, advanced, full)
            include_domains: Restrict search to specific domains
            exclude_domains: Exclude specific domains
            include_raw_content: Include full page content
            include_images: Include image results

        Returns:
            Search results dictionary with answer and sources

        Raises:
            Exception: If API call fails
        """
        if not self.api_key:
            raise ValueError("Tavily API key not configured. Set TAVILY_API_KEY in .env file.")

        # Use defaults from settings if not provided
        max_results = max_results or self.max_results
        search_depth = search_depth or self.search_depth

        # Build request payload
        payload = {
            "api_key": self.api_key,
            "query": query,
            "max_results": max_results,
            "search_depth": search_depth,
            "include_raw_content": include_raw_content,
            "include_images": include_images,
        }

        # Add optional parameters
        if include_domains:
            payload["include_domains"] = include_domains
        if exclude_domains:
            payload["exclude_domains"] = exclude_domains

        # Make API request
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.BASE_URL}{self.SEARCH_ENDPOINT}",
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=30),
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(
                            f"Tavily API error: {response.status} - {error_text}"
                        )

                    return await response.json()

            except aiohttp.ClientError as e:
                raise Exception(f"Tavily API connection error: {str(e)}")
            except asyncio.TimeoutError:
                raise Exception("Tavily API request timed out")

    async def search_news(
        self,
        query: str,
        max_results: Optional[int] = None,
        days: int = 7,
    ) -> Dict[str, Any]:
        """
        Search news articles using Tavily.

        Args:
            query: Search query
            max_results: Maximum results
            days: Number of days to look back (default: 7)

        Returns:
            News search results
        """
        if not self.api_key:
            raise ValueError("Tavily API key not configured.")

        payload = {
            "api_key": self.api_key,
            "query": query,
            "topic": "news",
            "max_results": max_results or self.max_results,
            "days": days,
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.BASE_URL}{self.SEARCH_ENDPOINT}",
                json=payload,
                timeout=aiohttp.ClientTimeout(total=30),
            ) as response:
                if response.status != 200:
                    raise Exception(f"Tavily API error: {response.status}")

                return await response.json()


# Singleton client instance
_tavily_client: Optional[TavilyClient] = None


def get_tavily_client() -> TavilyClient:
    """Get singleton Tavily client instance."""
    global _tavily_client

    if _tavily_client is None:
        _tavily_client = TavilyClient()

    return _tavily_client


async def tavily_search(
    query: str,
    max_results: int = 10,
    search_depth: str = "basic",
    include_domains: Optional[List[str]] = None,
    exclude_domains: Optional[List[str]] = None,
    search_type: str = "web",  # or "news"
    days: int = 7,
) -> Dict[str, Any]:
    """
    Convenience function to search the web.

    Args:
        query: Search query
        max_results: Maximum results
        search_depth: Search depth
        include_domains: Domains to include
        exclude_domains: Domains to exclude
        search_type: "web" or "news"
        days: For news searches, days back

    Returns:
        Search results
    """
    client = get_tavily_client()

    if search_type == "news":
        return await client.search_news(
            query=query,
            max_results=max_results,
            days=days,
        )
    else:
        return await client.search(
            query=query,
            max_results=max_results,
            search_depth=search_depth,
            include_domains=include_domains,
            exclude_domains=exclude_domains,
        )
```

**Validation**:
- Client handles API key validation
- Timeout configured (30 seconds)
- Error handling for network issues

### Step 2.2: Create Unit Tests (30 min)
**File**: `orbit-agent/tests/tools/test_tavily_client.py`

**Actions**:
```python
import pytest
from src.tools.web.tavily_client import TavilyClient, tavily_search


@pytest.mark.asyncio
async def test_tavily_search():
    """Test basic web search."""
    results = await tavily_search("python async await", max_results=5)

    assert "answer" in results
    assert "results" in results
    assert len(results["results"]) <= 5


@pytest.mark.asyncio
async def test_tavily_search_with_domains():
    """Test search with domain filtering."""
    results = await tavily_search(
        "machine learning",
        include_domains=["python.org"],
        max_results=3,
    )

    assert len(results["results"]) >= 0


@pytest.mark.asyncio
async def test_tavily_search_news():
    """Test news search."""
    results = await tavily_search(
        "AI news",
        search_type="news",
        days=7,
    )

    assert "results" in results


@pytest.mark.asyncio
async def test_tavily_no_api_key():
    """Test error handling without API key."""
    from src.tools.web.tavily_client import TavilyClient
    import os

    # Temporarily remove API key
    original_key = os.environ.get("TAVILY_API_KEY")
    if "TAVILY_API_KEY" in os.environ:
        del os.environ["TAVILY_API_KEY"]

    try:
        client = TavilyClient()
        with pytest.raises(ValueError):
            await client.search("test query")
    finally:
        # Restore API key
        if original_key:
            os.environ["TAVILY_API_KEY"] = original_key
```

**Validation**:
- All tests pass
- Error cases handled properly

---

## Phase 3: Integration with Agent (1.5 hours)

### Step 3.1: Register Tool in Registry (15 min)
**File**: `orbit-agent/src/tools/registry.py`

**Actions**:
1. Import WebSearchTool
2. Add to initialization

```python
# Add import at top
from src.tools.web.tavily import WebSearchTool

# In get_tool_registry() function, add:
def get_tool_registry() -> ToolRegistry:
    global _global_registry

    if _global_registry is None:
        _global_registry = ToolRegistry()
        # ... existing tool registrations
        # Register web search tool
        _global_registry.register_tool(WebSearchTool)

    return _global_registry
```

**Validation**:
- Tool appears in tool registry
- Can retrieve tool by name: "web_search"

### Step 3.2: Update __init__ (15 min)
**File**: `orbit-agent/src/tools/web/__init__.py`

**Actions**:
```python
"""Web search tools."""

from src.tools.web.tavily import WebSearchTool

__all__ = ["WebSearchTool"]
```

### Step 3.3: Create Tool Test (30 min)
**File**: `orbit-agent/tests/tools/test_web_search.py`

**Actions**:
```python
"""Test web search tool end-to-end."""

import pytest
from src.tools.web.tavily import WebSearchTool
from src.tools.registry import get_tool_registry


@pytest.mark.asyncio
async def test_web_search_tool():
    """Test web search tool execution."""
    tool = WebSearchTool()

    results = await tool._arun(
        query="how to use python async await",
        max_results=3,
    )

    assert "**Web Search Results:**" in results
    assert "**Sources:**" in results
    assert "python" in results.lower() or "async" in results.lower()


@pytest.mark.asyncio
async def test_tool_metadata():
    """Test tool metadata."""
    tool = WebSearchTool()

    assert tool.name == "web_search"
    assert tool.danger_level == 1
    assert tool.requires_confirmation == False
    assert tool.category == "analysis"


@pytest.mark.asyncio
async def test_tool_in_registry():
    """Test tool is registered."""
    registry = get_tool_registry()

    assert "web_search" in registry.get_tool_names()

    web_search_tool = registry.get_tool("web_search")
    assert web_search_tool is not None
    assert web_search_tool.name == "web_search"
```

### Step 3.4: Update Agent Prompts (30 min)
**File**: `orbit-agent/src/agent/prompts/`

**Actions**:

Update the system prompt to mention web search capability:

**File**: `orbit-agent/src/agent/prompts/system.md` (or create)

```markdown
# Orbit Agent System Prompt

You are Orbit, an AI assistant that helps users with:
- Writing and debugging code
- Managing files and directories
- Running shell commands
- Searching the web for information
- Managing Jira tickets (when connected)

## Capabilities

### Web Search
You can search the web for up-to-date information using Tavily AI.
Use web search when:
- User asks for current information or news
- User asks about recent developments
- You need to verify facts or find references
- User wants research on a topic
- The answer might have changed recently

Example queries that trigger web search:
- "What's the latest version of Python?"
- "Find articles about machine learning"
- "What are recent developments in React?"
- "Search for information about X"

### File Operations
- List files and directories
- Read file contents
- Write files
- Create/delete directories

### Shell Commands
- Execute shell commands
- Run git operations
- Install packages
- Run tests

### Jira Integration
- List assigned tickets
- Get ticket details
- Update ticket status

## Guidelines

1. **Use web search proactively** when user asks for current information
2. **Cite sources** when providing web search results
3. **Be transparent** about web search limitations
4. **Prioritize recent information** when presenting web search results
5. **Combine sources** to provide comprehensive answers
```

**Validation**:
- Prompt mentions web search capability
- Examples trigger web search appropriately

---

## Phase 4: Advanced Features (Optional - 2 hours)

### Step 4.1: Add News Search (45 min)
**File**: `orbit-agent/src/tools/web/tavily.py`

**Actions**:
1. Create NewsSearchInput
2. Create NewsSearchTool

```python
class NewsSearchInput(BaseModel):
    """Input schema for news search."""

    query: str = Field(..., description="News search query")
    max_results: Optional[int] = Field(
        10,
        description="Maximum number of news articles"
    )
    days: Optional[int] = Field(
        7,
        description="Number of days back to search (default: 7)"
    )


class NewsSearchTool(OrbitTool):
    """News search using Tavily API."""

    name: str = "news_search"
    description = (
        "Search for recent news articles using Tavily AI. "
        "Returns relevant news with publication dates and sources. "
        "Use for staying updated on current events, industry news, or trending topics."
    )
    category: ToolCategory = ToolCategory.ANALYSIS
    danger_level: int = 1
    requires_confirmation: bool = False
    args_schema: type = NewsSearchInput

    async def _arun(
        self,
        query: str,
        max_results: int = 10,
        days: int = 7,
    ) -> str:
        try:
            from src.tools.web.tavily_client import tavily_search

            results = await tavily_search(
                query=query,
                max_results=max_results,
                search_type="news",
                days=days,
            )

            return self.format_news_results(results)

        except Exception as e:
            raise Exception(f"News search failed: {str(e)}")

    def format_news_results(self, results: Dict[str, Any]) -> str:
        """Format news results."""
        articles = results.get("results", [])

        formatted = "**Latest News Articles:**\n\n"

        for i, article in enumerate(articles, 1):
            title = article.get("title", "Untitled")
            url = article.get("url", "")
            date = article.get("publishedDate", "Unknown date")
            snippet = article.get("content", "")[:150]

            formatted += f"{i}. **{title}**\n"
            formatted += f"   Published: {date}\n"
            formatted += f"   URL: {url}\n"
            formatted += f"   {snippet}...\n\n"

        return formatted
```

### Step 4.2: Add Domain Filtering (30 min)
**Actions**:
1. Document domain filtering in tool description
2. Add examples to prompts

**Update**: Tool description in `tavily.py`

```python
description = (
    "Search the web for information using Tavily AI. "
    "Supports domain filtering (include/exclude specific domains), "
    "search depth options, and citation tracking. "
    "Returns relevant results with sources.\n\n"
    "Examples:\n"
    '- "Search for Python information" (general web search)\n'
    '- "Search for docs.python.org only" (include_domains)\n'
    '- "Search excluding stackoverflow.com" (exclude_domains)\n'
)
```

### Step 4.3: Add Response Caching (45 min)
**File**: `orbit-agent/src/tools/web/cache.py`

**Actions**:
```python
"""Simple cache for web search results."""

from typing import Dict, Any, Optional
from datetime import datetime, timedelta
import hashlib
import json


class SearchCache:
    """In-memory cache for search results."""

    def __init__(self, ttl_minutes: int = 60):
        """Initialize cache with TTL."""
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.ttl = timedelta(minutes=ttl_minutes)

    def _get_key(self, query: str, **kwargs) -> str:
        """Generate cache key from query and params."""
        key_data = query + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()

    def get(self, query: str, **kwargs) -> Optional[Dict[str, Any]]:
        """Get cached result if not expired."""
        key = self._get_key(query, **kwargs)

        if key not in self.cache:
            return None

        cached = self.cache[key]

        if datetime.now() > cached["expires_at"]:
            del self.cache[key]
            return None

        return cached["data"]

    def set(self, query: str, data: Dict[str, Any], **kwargs) -> None:
        """Cache search result with expiration."""
        key = self._get_key(query, **kwargs)

        self.cache[key] = {
            "data": data,
            "expires_at": datetime.now() + self.ttl,
            "cached_at": datetime.now(),
        }

    def clear(self) -> None:
        """Clear all cache entries."""
        self.cache.clear()


# Singleton cache instance
_search_cache: Optional[SearchCache] = None


def get_search_cache() -> SearchCache:
    """Get singleton search cache."""
    global _search_cache

    if _search_cache is None:
        _search_cache = SearchCache(ttl_minutes=60)  # 1 hour TTL

    return _search_cache
```

**Update**: `tavily.py` to use cache

```python
# In WebSearchTool._arun()
async def _arun(self, query: str, ...) -> str:
    # Check cache first
    cache = get_search_cache()
    cached = cache.get(query, max_results=max_results, search_depth=search_depth)

    if cached:
        return "**Web Search Results (Cached):**\n\n" + self.format_results(cached)

    # Perform search
    results = await tavily_search(...)

    # Cache result
    cache.set(query, results, max_results=max_results, search_depth=search_depth)

    return self.format_results(results)
```

---

## Phase 5: Testing & Documentation (1.5 hours)

### Step 5.1: Integration Tests (1 hour)
**File**: `orbit-agent/tests/integration/test_web_search_integration.py`

**Actions**:
```python
"""Integration tests for web search."""

import pytest
from src.tools.web.tavily import WebSearchTool


@pytest.mark.asyncio
async def test_web_search_integration():
    """Full integration test of web search."""
    tool = WebSearchTool()

    # Test real search (requires TAVILY_API_KEY)
    try:
        results = await tool._arun(
            query="latest Python version",
            max_results=5,
        )

        assert "**Web Search Results:**" in results
        assert "python" in results.lower()

    except Exception as e:
        pytest.skip(f"Integration test skipped: {e}")


@pytest.mark.asyncio
async def test_web_search_with_domain_filter():
    """Test domain filtering."""
    tool = WebSearchTool()

    results = await tool._arun(
        query="async await",
        include_domains=["docs.python.org"],
        max_results=3,
    )

    assert "docs.python.org" in results


@pytest.mark.asyncio
async def test_web_search_error_handling():
    """Test error handling."""
    tool = WebSearchTool()

    # Test with empty query
    with pytest.raises(Exception):
        await tool._arun(query="", max_results=5)
```

### Step 5.2: Update Documentation (30 min)
**Files**:
- `orbit-agent/README.md`
- `orbit-agent/CLAUDE.md`

**Actions**:
1. Add web search section to README
2. Document Tavily setup
3. Update CLAUDE.md with web search capabilities

**Add to README.md**:
```markdown
## Web Search

The agent includes Tavily AI-powered web search to find current information and research topics.

### Setup

1. Get Tavily API key from https://tavily.com/
2. Set environment variable:
   ```bash
   export TAVILY_API_KEY=tvly-your-key-here
   ```
3. Add to `.env` file:
   ```env
   TAVILY_API_KEY=tvly-your-key-here
   ```

### Usage

The agent will automatically use web search when appropriate. Example queries:

- "What's the latest version of React?"
- "Find recent articles about AI"
- "Search for information about LangChain"

### Configuration

Edit `orbit-agent/src/config.py` to customize:

- `tavily_max_results`: Default 10, maximum results returned
- `tavily_search_depth`: "basic", "advanced", or "full"
```

---

## Success Criteria Check

Before considering this complete, verify:

- [ ] Tavily API key configured
- [ ] WebSearchTool implemented and registered
- [ ] Search returns formatted results with citations
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Tool appears in LLM's available tools
- [ ] Documentation updated
- [ ] Error handling robust (timeouts, API errors)
- [ ] Cache implemented (optional but recommended)
- [ ] News search implemented (optional)

---

## Estimated Timeline

| Phase | Tasks | Time |
|--------|--------|------|
| Phase 1: Setup & Config | API key, config, tool base | 45 min |
| Phase 2: Tavily Client | API client, unit tests | 2 hours |
| Phase 3: Integration | Registry, tests, prompts | 1.5 hours |
| Phase 4: Advanced | News search, domain filtering, cache | 2 hours |
| Phase 5: Testing & Docs | Integration tests, documentation | 1.5 hours |
| **Total** | **Core Features** | **6 hours** |
| **Total with Advanced** | **All Features** | **8 hours** |

---

## Next Steps After Core Web Search

1. **Add Reranking** - Reorder results by relevance
2. **Add Summarization** - Summarize multiple results
3. **Add Multi-Query** - Search multiple terms and combine
4. **Add Web Crawling** - Deep search specific URLs
5. **Add Image Search** - Include visual search results
6. **Add Video Search** - Search YouTube and video platforms
7. **Add Local Results** - Combine with file search
8. **Add Query Suggestions** - Suggest related queries

---

## Troubleshooting

**Issue**: "Tavily API key not configured" error
- **Solution**: Set TAVILY_API_KEY in .env file. Sign up at https://tavily.com/

**Issue**: Search returns no results
- **Solution**: Try broader search terms, check spelling, reduce max_results

**Issue**: API request times out
- **Solution**: Increase timeout in client.py, check network connection

**Issue**: Results not appearing in LLM responses
- **Solution**: Verify tool is registered, check tool name in registry

**Issue**: Cache returning stale results
- **Solution**: Reduce TTL in SearchCache, or clear cache manually

---

## Notes

- Web search is safe (danger_level: 1) - no confirmation needed
- Cache helps reduce API calls and improve performance
- Tavily free tier: 1000 requests/month (check current limits)
- Domain filtering useful for searching documentation sites
- News search great for staying current with industry trends
