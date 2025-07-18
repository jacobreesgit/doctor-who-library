"""Modern TARDIS Wiki service implementation."""

import asyncio
import re
from typing import Any
from urllib.parse import quote, urljoin

import httpx
from bs4 import BeautifulSoup
from structlog import get_logger

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.services.wiki_service import (
    WikiSearchResult,
    WikiService,
)
from doctor_who_library.shared.config.settings import WikiSettings
from doctor_who_library.shared.exceptions.infrastructure import ExternalServiceException

logger = get_logger()


class TardisWikiService(WikiService):
    """TARDIS Wiki service implementation."""

    def __init__(self, config: WikiSettings):
        self.config = config
        self._session: httpx.AsyncClient | None = None

    async def __aenter__(self):
        """Async context manager entry."""
        self._session = httpx.AsyncClient(
            timeout=httpx.Timeout(self.config.timeout),
            headers={
                "User-Agent": self.config.user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
            follow_redirects=True,  # Follow redirects automatically
        )
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self._session:
            await self._session.aclose()

    async def search_for_item(self, item: LibraryItem) -> WikiSearchResult | None:
        """Search for wiki content for a library item."""
        if not self._session:
            async with self:
                return await self._search_for_item_internal(item)

        return await self._search_for_item_internal(item)

    async def _search_for_item_internal(
        self, item: LibraryItem
    ) -> WikiSearchResult | None:
        """Internal search implementation."""
        search_queries = self._generate_search_queries(item)

        best_result = None
        best_score = 0.0

        for query in search_queries:
            try:
                search_results = await self._search_wiki(query, limit=3)

                for result in search_results:
                    page_content = await self._get_page_content(result["title"])

                    if page_content:
                        confidence = self._calculate_confidence_score(
                            item, page_content
                        )

                        if confidence > best_score:
                            best_score = confidence
                            best_result = WikiSearchResult(
                                title=result["title"],
                                url=result["url"],
                                summary=page_content.get("summary", ""),
                                confidence=confidence,
                                search_term=query,
                                image_url=page_content.get("images", [None])[0],
                            )

                        # Early exit for high confidence
                        if confidence > 0.8:
                            break

                if best_score > 0.8:
                    break

            except Exception as e:
                logger.warning(f"Search failed for query '{query}': {e}")
                continue

        return best_result if best_score >= self.config.confidence_threshold else None

    async def enrich_item(self, item: LibraryItem) -> LibraryItem:
        """Enrich a library item with wiki data."""
        if not item.can_be_enriched():
            return item

        try:
            result = await self.search_for_item(item)

            if result:
                item.mark_enriched(
                    confidence=result.confidence,
                    wiki_url=result.url,
                    summary=result.summary,
                    search_term=result.search_term,
                )

                if result.image_url:
                    item.wiki_image_url = result.image_url
            else:
                item.mark_enrichment_skipped(
                    reason="No suitable wiki page found",
                    search_term=item.get_search_titles()[0]
                    if item.get_search_titles()
                    else None,
                )

        except Exception as e:
            item.mark_enrichment_failed(
                error=str(e),
                search_term=item.get_search_titles()[0]
                if item.get_search_titles()
                else None,
            )

        return item

    async def enrich_items(self, items: list[LibraryItem]) -> list[LibraryItem]:
        """Enrich multiple library items with wiki data."""
        semaphore = asyncio.Semaphore(
            self.config.max_concurrent if hasattr(self.config, "max_concurrent") else 5
        )

        async def enrich_single_item(item: LibraryItem) -> LibraryItem:
            async with semaphore:
                result = await self.enrich_item(item)
                # Rate limiting
                await asyncio.sleep(self.config.request_delay)
                return result

        tasks = [enrich_single_item(item) for item in items if item.can_be_enriched()]

        if not tasks:
            return items

        enriched_items = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        for i, result in enumerate(enriched_items):
            if isinstance(result, Exception):
                items[i].mark_enrichment_failed(
                    error=str(result),
                    search_term=items[i].get_search_titles()[0]
                    if items[i].get_search_titles()
                    else None,
                )

        return items

    async def _search_wiki(self, query: str, limit: int = 5) -> list[dict[str, Any]]:
        """Search the TARDIS Wiki for pages matching the query."""
        try:
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": limit,
                "srprop": "title|snippet|size",
            }

            if self._session is None:
                raise ExternalServiceException("Session not initialized")
            response = await self._session.get(str(self.config.api_url), params=params)
            response.raise_for_status()

            data = response.json()
            results = []

            if "query" in data and "search" in data["query"]:
                for item in data["query"]["search"]:
                    results.append(
                        {
                            "title": item["title"],
                            "url": urljoin(
                                str(self.config.base_url),
                                quote(item["title"].replace(" ", "_")),
                            ),
                            "snippet": item.get("snippet", ""),
                            "size": item.get("size", 0),
                        }
                    )

            return results

        except httpx.HTTPError as e:
            raise ExternalServiceException(
                service_name="TARDIS Wiki",
                operation="search",
                message=f"Search failed for query: {query}",
                status_code=getattr(e, "response", None)
                and getattr(e.response, "status_code", None),
                cause=e,
            ) from e

    async def _get_page_content(self, page_title: str) -> dict[str, Any] | None:
        """Get the content of a wiki page."""
        try:
            url = urljoin(
                str(self.config.base_url), quote(page_title.replace(" ", "_"))
            )
            if self._session is None:
                raise ExternalServiceException("Session not initialized")
            response = await self._session.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, "html.parser")

            content = {
                "title": page_title,
                "url": url,
                "content": "",
                "infobox": {},
                "categories": [],
                "summary": "",
                "images": [],
            }

            # Extract summary - try multiple selectors
            content_div = soup.find("div", {"class": "mw-parser-output"}) or soup.find(
                "div", {"id": "mw-content-text"}
            )
            if content_div and hasattr(content_div, "find_all"):
                paragraphs = content_div.find_all("p")
                for p in paragraphs:
                    text = p.get_text().strip()
                    if (
                        text
                        and len(text) > 50
                        and not text.startswith("{{")
                        and not text.startswith("Fast Times")
                    ):
                        content["summary"] = self._clean_text(text)
                        break

            # Extract infobox
            infobox = soup.find("table", {"class": "infobox"})
            if infobox:
                content["infobox"] = self._extract_infobox_data(soup)

            # Extract categories
            categories = soup.find_all("a", href=re.compile(r"/wiki/Category:"))
            content["categories"] = [
                cat.get_text() for cat in categories if hasattr(cat, "get_text")
            ]

            # Extract images
            images = soup.find_all("img", src=re.compile(r"\.jpg|\.png|\.gif", re.I))
            content["images"] = [
                img.get("src")
                for img in images[:3]
                if hasattr(img, "get") and img.get("src")
            ]

            return content

        except httpx.HTTPError as e:
            raise ExternalServiceException(
                service_name="TARDIS Wiki",
                operation="get_page_content",
                message=f"Failed to get page content: {page_title}",
                status_code=getattr(e, "response", None)
                and getattr(e.response, "status_code", None),
                cause=e,
            ) from e

    def _generate_search_queries(self, item: LibraryItem) -> list[str]:
        """Generate search queries for a library item."""
        queries = []
        search_titles = item.get_search_titles()

        for title in search_titles:
            # If we have content type, prioritize the correct disambiguation first
            if item.content_type:
                wiki_suffix = item.content_type.get_wiki_suffix()
                queries.append(f"{title} ({wiki_suffix})")

            # Add common TARDIS Wiki disambiguation terms as fallbacks
            common_disambiguations = [
                "TV story",
                "audio story",
                "comic story",
                "novel",
                "webcast",
                "home video",
                "short story",
            ]

            # Add other disambiguation terms (excluding the one we already added)
            for dab_term in common_disambiguations:
                search_query = f"{title} ({dab_term})"
                if search_query not in queries:
                    queries.append(search_query)

            # Add the plain title as fallback
            queries.append(title)

        # Add broader searches
        if search_titles:
            queries.append(f'"{search_titles[0]}" Doctor Who')

        return queries[:12]  # Increased limit to handle more disambiguation terms

    def _extract_infobox_data(self, infobox_soup: BeautifulSoup) -> dict[str, str]:
        """Extract structured data from infobox."""
        data = {}

        try:
            infobox = infobox_soup.find("table", {"class": "infobox"})
            if infobox:
                rows = infobox.find_all("tr")
                for row in rows:
                    header = row.find("th")
                    data_cell = row.find("td")

                    if (
                        header
                        and data_cell
                        and hasattr(header, "get_text")
                        and hasattr(data_cell, "get_text")
                    ):
                        key = self._clean_text(header.get_text())
                        value = self._clean_text(data_cell.get_text())

                        if key and value:
                            data[key] = value
        except Exception as e:
            logger.warning(f"Failed to extract infobox data: {e}")

        return data

    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""

        # Remove extra whitespace
        text = re.sub(r"\s+", " ", text)

        # Remove reference numbers [1], [2], etc.
        text = re.sub(r"\[.*?\]", "", text)

        # Remove wiki markup
        text = re.sub(r"\{\{.*?\}\}", "", text)

        return text.strip()

    def _calculate_confidence_score(
        self, item: LibraryItem, page_content: dict[str, Any]
    ) -> float:
        """Calculate confidence score for the match."""
        score = 0.0

        # Title matching - more lenient
        page_title = page_content.get("title", "").lower()
        item_title = item.title.lower()

        if item_title and page_title:
            if item_title in page_title or page_title in item_title:
                score += 0.6  # Higher base score for title match
            elif any(
                word in page_title for word in item_title.split() if len(word) > 2
            ):  # Lowered word length threshold
                score += 0.4

        # Very lenient Doctor Who relation check
        content_lower = (
            page_content.get("content", "") + " " + page_content.get("summary", "")
        ).lower()
        summary_lower = page_content.get("summary", "").lower()

        # If it's on TARDIS wiki, it's probably Doctor Who related
        if "tardis" in page_content.get("url", "").lower():
            score += 0.3

        # Check for any DW-related terms in content or summary
        doctor_who_terms = [
            "doctor",
            "tardis",
            "gallifrey",
            "dalek",
            "cybermen",
            "time lord",
            "bbc",
        ]
        if any(
            term in content_lower or term in summary_lower for term in doctor_who_terms
        ):
            score += 0.3

        # Check categories
        categories = page_content.get("categories", [])
        if categories:  # Any categories suggest it's a real page
            score += 0.2

        # If we have any content at all, give some score
        if page_content.get("summary") or page_content.get("content"):
            score += 0.1

        return min(score, 1.0)
