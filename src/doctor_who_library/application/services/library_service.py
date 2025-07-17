"""Application service for library operations."""

from typing import List, Optional, Dict, Any
from uuid import UUID

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.shared.exceptions.application import ServiceException
from doctor_who_library.shared.exceptions.domain import EntityNotFoundException


class LibraryService:
    """Application service for library operations."""
    
    def __init__(self):
        pass  # No repository dependency needed
    
    async def get_item_by_id(self, item_id: UUID) -> LibraryItem:
        """Get a library item by ID."""
        try:
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.shared.database.connection import execute_query
            
            # Remove dashes from UUID for database lookup
            hex_id = str(item_id).replace('-', '')
            
            rows = execute_query(
                "SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary "
                "FROM library_items WHERE id = ?", 
                (hex_id,)
            )
            
            if not rows:
                raise EntityNotFoundException("LibraryItem", item_id)
            
            row = rows[0]
            hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary = row
            
            # Safe enrichment status conversion
            try:
                status = EnrichmentStatus(enrichment_status) if enrichment_status else EnrichmentStatus.PENDING
            except ValueError:
                status = EnrichmentStatus.PENDING
            
            item = LibraryItem(
                id=item_id,
                title=title or "Unknown Title",
                story_title=story_title,
                section_name=section_name,
                enrichment_status=status,
                enrichment_confidence=enrichment_confidence or 0.0,
                wiki_url=wiki_url,
                wiki_summary=wiki_summary,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            
            return item
        except EntityNotFoundException:
            raise
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_item_by_id",
                message=f"Failed to get item by ID: {item_id}",
                cause=e,
            )
    
    async def get_all_items(self, limit: Optional[int] = None, offset: int = 0) -> List[LibraryItem]:
        """Get all library items with optional pagination."""
        try:
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
            from doctor_who_library.shared.database.connection import execute_query
            
            # Get basic data with simple query
            rows = execute_query(
                "SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary "
                "FROM library_items LIMIT ? OFFSET ?", 
                (limit if limit is not None else 50, offset)
            )
            
            items = []
            for row in rows:
                hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary = row
                
                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)
                
                # Safe enrichment status conversion
                try:
                    status = EnrichmentStatus(enrichment_status) if enrichment_status else EnrichmentStatus.PENDING
                except ValueError:
                    status = EnrichmentStatus.PENDING
                
                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    story_title=story_title,
                    section_name=section_name,
                    enrichment_status=status,
                    enrichment_confidence=enrichment_confidence or 0.0,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                items.append(item)
            
            return items
                
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_all_items",
                message="Failed to get all library items",
                cause=e,
            )
    
    async def search_items(self, query: str, limit: Optional[int] = None) -> List[LibraryItem]:
        """Search library items by query."""
        try:
            # TODO: Implement search functionality with direct database queries
            # For now, return empty list
            return []
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="search_items",
                message=f"Failed to search items: {query}",
                cause=e,
            )
    
    async def get_items_by_section(self, section_name: str) -> List[LibraryItem]:
        """Get items by section name."""
        try:
            # TODO: Implement section filtering with direct database queries
            # For now, return empty list
            return []
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_section",
                message=f"Failed to get items by section: {section_name}",
                cause=e,
            )
    
    async def get_items_by_group(self, group_name: str) -> List[LibraryItem]:
        """Get items by group name."""
        try:
            # TODO: Implement group filtering with direct database queries  
            # For now, return empty list
            return []
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_group",
                message=f"Failed to get items by group: {group_name}",
                cause=e,
            )
    
    async def get_items_by_status(self, status: EnrichmentStatus) -> List[LibraryItem]:
        """Get items by enrichment status."""
        try:
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.shared.database.connection import execute_query
            
            # Get data filtered by status
            rows = execute_query(
                "SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary "
                "FROM library_items WHERE enrichment_status = ?", 
                (status.value,)
            )
            
            items = []
            for row in rows:
                hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, wiki_url, wiki_summary = row
                
                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)
                
                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    story_title=story_title,
                    section_name=section_name,
                    enrichment_status=status,  # Use the input status directly
                    enrichment_confidence=enrichment_confidence or 0.0,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                items.append(item)
            
            return items
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_items_by_status",
                message=f"Failed to get items by status: {status}",
                cause=e,
            )
    
    async def get_total_count(self) -> int:
        """Get total count of library items."""
        try:
            from doctor_who_library.shared.database.connection import execute_query
            
            total_result = execute_query("SELECT COUNT(*) FROM library_items")
            return total_result[0][0]
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_total_count",
                message="Failed to get total count",
                cause=e,
            )
    
    # CRUD operations removed - not needed for current functionality
    
    async def get_library_stats(self) -> Dict[str, Any]:
        """Get library statistics."""
        try:
            from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
            from doctor_who_library.shared.database.connection import execute_query
            
            # Get total count
            total_result = execute_query("SELECT COUNT(*) FROM library_items")
            total_count = total_result[0][0]
            
            # Get enrichment stats
            enrichment_stats = {}
            for status in EnrichmentStatus:
                count_result = execute_query(
                    "SELECT COUNT(*) FROM library_items WHERE enrichment_status = ?", 
                    (status.value,)
                )
                enrichment_stats[status.value] = count_result[0][0]
            
            stats = {
                "total_items": total_count,
                "total_sections": 0,  # Placeholder
                "total_groups": 0,    # Placeholder
                "enrichment_stats": enrichment_stats,
                "note": f"Doctor Who Library contains {total_count} items",
            }
            
            return stats
        except Exception as e:
            raise ServiceException(
                service_name="LibraryService",
                operation="get_library_stats",
                message="Failed to get library statistics",
                cause=e,
            )