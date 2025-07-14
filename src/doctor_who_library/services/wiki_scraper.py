"""TARDIS Wiki scraping service for metadata enrichment."""

import asyncio
import re
from typing import Dict, List, Optional, Tuple
from urllib.parse import quote, urljoin
import time

import httpx
from bs4 import BeautifulSoup
from structlog import get_logger

from doctor_who_library.core.config import get_settings

logger = get_logger()
settings = get_settings()


class WikiScrapingError(Exception):
    """Base exception for wiki scraping errors."""
    pass


class WikiScraper:
    """Service for scraping TARDIS Wiki for metadata enrichment."""
    
    def __init__(self):
        self.settings = settings
        self.base_url = settings.wiki_base_url
        self.api_url = settings.wiki_api_url
        self.session: Optional[httpx.AsyncClient] = None
        
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = httpx.AsyncClient(
            timeout=httpx.Timeout(self.settings.wiki_timeout),
            headers={
                "User-Agent": self.settings.wiki_user_agent,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            },
            limits=httpx.Limits(max_connections=5, max_keepalive_connections=2),
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.aclose()
    
    async def search_wiki(self, query: str, limit: int = 5) -> List[Dict[str, str]]:
        """
        Search the TARDIS Wiki for pages matching the query.
        
        Args:
            query: Search query
            limit: Maximum number of results
            
        Returns:
            List of search results with title and URL
        """
        if not self.session:
            raise RuntimeError("WikiScraper must be used as async context manager")
        
        try:
            # Use MediaWiki API for search
            params = {
                "action": "query",
                "format": "json",
                "list": "search",
                "srsearch": query,
                "srlimit": limit,
                "srprop": "title|snippet|size",
            }
            
            response = await self.session.get(self.api_url, params=params)
            response.raise_for_status()
            
            data = response.json()
            results = []
            
            if "query" in data and "search" in data["query"]:
                for item in data["query"]["search"]:
                    results.append({
                        "title": item["title"],
                        "url": urljoin(self.base_url, quote(item["title"].replace(" ", "_"))),
                        "snippet": item.get("snippet", ""),
                        "size": item.get("size", 0),
                    })
            
            # Rate limiting
            await asyncio.sleep(self.settings.wiki_request_delay)
            return results
            
        except Exception as e:
            logger.error("Wiki search failed", query=query, error=str(e))
            raise WikiScrapingError(f"Search failed: {e}")
    
    async def get_page_content(self, page_title: str) -> Optional[Dict[str, any]]:
        """
        Get the content of a wiki page.
        
        Args:
            page_title: Title of the wiki page
            
        Returns:
            Dictionary with page content and metadata
        """
        if not self.session:
            raise RuntimeError("WikiScraper must be used as async context manager")
        
        try:
            url = urljoin(self.base_url, quote(page_title.replace(" ", "_")))
            response = await self.session.get(url)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Extract basic page info
            content = {
                "title": page_title,
                "url": url,
                "content": "",
                "infobox": {},
                "categories": [],
                "summary": "",
                "images": [],
            }
            
            # Get page summary (first paragraph)
            content_div = soup.find("div", {"id": "mw-content-text"})
            if content_div:
                # Find first substantial paragraph
                paragraphs = content_div.find_all("p", recursive=False)
                for p in paragraphs:
                    text = p.get_text().strip()
                    if text and len(text) > 50 and not text.startswith("{{"):
                        content["summary"] = self._clean_text(text)
                        break
            
            # Extract infobox data
            infobox = soup.find("table", {"class": "infobox"})
            if infobox:
                content["infobox"] = self._extract_infobox_data(infobox)
            
            # Extract categories
            categories = soup.find_all("a", href=re.compile(r"/wiki/Category:"))
            content["categories"] = [cat.get_text() for cat in categories]
            
            # Extract images
            images = soup.find_all("img", src=re.compile(r"\.jpg|\.png|\.gif", re.I))
            content["images"] = [img.get("src") for img in images[:3]]  # First 3 images
            
            # Get full content text
            if content_div:
                content["content"] = self._clean_text(content_div.get_text())
            
            # Rate limiting
            await asyncio.sleep(self.settings.wiki_request_delay)
            return content
            
        except Exception as e:
            logger.error("Failed to get page content", page_title=page_title, error=str(e))
            return None
    
    def _extract_infobox_data(self, infobox_soup: BeautifulSoup) -> Dict[str, str]:
        """Extract structured data from infobox."""
        data = {}
        
        try:
            rows = infobox_soup.find_all("tr")
            for row in rows:
                # Look for header cell and data cell
                header = row.find("th")
                data_cell = row.find("td")
                
                if header and data_cell:
                    key = self._clean_text(header.get_text())
                    value = self._clean_text(data_cell.get_text())
                    
                    if key and value:
                        data[key] = value
                        
        except Exception as e:
            logger.warning("Failed to extract infobox data", error=str(e))
        
        return data
    
    def _clean_text(self, text: str) -> str:
        """Clean and normalize text."""
        if not text:
            return ""
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove reference numbers [1], [2], etc.
        text = re.sub(r'\[.*?\]', '', text)
        
        # Remove wiki markup
        text = re.sub(r'\{\{.*?\}\}', '', text)
        
        return text.strip()
    
    async def enrich_library_item(self, item_data: Dict[str, any]) -> Dict[str, any]:
        """
        Enrich a library item with data from TARDIS Wiki.
        
        Args:
            item_data: Dictionary with item data (title, content_type, etc.)
            
        Returns:
            Dictionary with enrichment data
        """
        enrichment_data = {
            "original_item": item_data,
            "wiki_matches": [],
            "enriched_fields": {},
            "confidence_score": 0.0,
            "status": "pending",
            "error": None,
        }
        
        try:
            # Create search queries based on item data
            search_queries = self._generate_search_queries(item_data)
            
            best_match = None
            best_content = None
            best_score = 0.0
            
            for query in search_queries:
                logger.info("Searching wiki", query=query, item_title=item_data.get("title"))
                
                search_results = await self.search_wiki(query, limit=3)
                
                if search_results:
                    # Evaluate each result
                    for result in search_results:
                        page_content = await self.get_page_content(result["title"])
                        
                        if page_content:
                            # Calculate confidence score
                            confidence = self._calculate_confidence_score(item_data, page_content)
                            
                            if confidence > best_score:
                                best_score = confidence
                                best_match = result
                                best_content = page_content
                            
                            # If we have high confidence, we can stop searching
                            if confidence > 0.8:
                                break
                    
                    if best_score > 0.8:
                        break
            
            if best_match and best_content:
                enrichment_data["wiki_matches"].append(best_match)
                enrichment_data["enriched_fields"] = self._extract_enrichment_fields(
                    best_content, item_data
                )
                enrichment_data["confidence_score"] = best_score
                
                # Set final status
                if best_score > self.settings.enrichment_confidence_threshold:
                    enrichment_data["status"] = "enriched"
                else:
                    enrichment_data["status"] = "low_confidence"
            else:
                enrichment_data["status"] = "no_match"
                
        except Exception as e:
            enrichment_data["status"] = "error"
            enrichment_data["error"] = str(e)
            logger.error("Enrichment failed", item_title=item_data.get("title"), error=str(e))
        
        return enrichment_data
    
    def _generate_search_queries(self, item_data: Dict[str, any]) -> List[str]:
        """Generate search queries for a library item."""
        queries = []
        
        title = item_data.get("title") or item_data.get("display_title")
        story_title = item_data.get("story_title")
        serial_title = item_data.get("serial_title")
        content_type = item_data.get("content_type")
        
        # Use the main title as primary search
        if title:
            queries.append(title)
        
        # Add story title if different
        if story_title and story_title != title:
            queries.append(story_title)
        
        # Add serial title if different
        if serial_title and serial_title != title:
            queries.append(serial_title)
        
        # Add specific searches with context
        if title:
            queries.append(f'"{title}" Doctor Who')
            
            # Add content type specific searches
            if content_type:
                # Map content types to wiki search terms
                content_mapping = {
                    "BBC Television": "TV story",
                    "BBC Audio": "audio story",
                    "Big Finish Productions": "audio story",
                    "Comic": "comic story",
                    "Novel": "novel",
                    "Video Game": "video game",
                    "Webcast": "webcast",
                }
                
                wiki_term = content_mapping.get(content_type, content_type.lower())
                queries.append(f'"{title}" {wiki_term}')
        
        return queries[:4]  # Limit to avoid too many requests
    
    def _extract_enrichment_fields(self, page_content: Dict[str, any], item_data: Dict[str, any]) -> Dict[str, str]:
        """Extract enrichment fields from page content."""
        enriched = {}
        
        # Map infobox fields to our model fields
        infobox_mapping = {
            "Writer": "writer",
            "Director": "director", 
            "Producer": "producer",
            "Broadcast date": "broadcast_date",
            "Release date": "release_date",
            "Series": "series",
            "Doctor": "doctor",
            "Companions": "companions",
            "Main enemy": "main_enemy",
            "Setting": "setting",
            "Cast": "cast_info",
            "Featuring": "featuring",
            "Main character": "main_character",
        }
        
        infobox = page_content.get("infobox", {})
        
        for wiki_field, model_field in infobox_mapping.items():
            if wiki_field in infobox:
                enriched[model_field] = infobox[wiki_field]
        
        # Add summary if available
        if page_content.get("summary"):
            enriched["wiki_summary"] = page_content["summary"]
        
        # Add wiki URL
        enriched["wiki_url"] = page_content.get("url")
        
        # Add image if available
        images = page_content.get("images", [])
        if images:
            enriched["wiki_image_url"] = images[0]
        
        return enriched
    
    def _calculate_confidence_score(self, item_data: Dict[str, any], page_content: Dict[str, any]) -> float:
        """Calculate confidence score for the match."""
        score = 0.0
        
        # Title matching
        page_title = page_content.get("title", "").lower()
        item_title = (item_data.get("title") or "").lower()
        
        if item_title and page_title:
            if item_title in page_title or page_title in item_title:
                score += 0.4
            elif any(word in page_title for word in item_title.split() if len(word) > 3):
                score += 0.2
        
        # Check if it's actually Doctor Who related
        content_lower = page_content.get("content", "").lower()
        doctor_who_terms = ["doctor who", "tardis", "gallifrey", "dalek", "cybermen"]
        if any(term in content_lower for term in doctor_who_terms):
            score += 0.3
        
        # Check categories
        categories = page_content.get("categories", [])
        doctor_who_categories = [cat for cat in categories if "doctor who" in cat.lower()]
        if doctor_who_categories:
            score += 0.2
        
        # Check infobox relevance
        infobox = page_content.get("infobox", {})
        relevant_fields = ["Writer", "Director", "Doctor", "Companions", "Broadcast date"]
        if any(field in infobox for field in relevant_fields):
            score += 0.1
        
        return min(score, 1.0)