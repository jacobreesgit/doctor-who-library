"""Application service for enrichment operations."""

import asyncio
from typing import List, Dict, Any, Optional
from structlog import get_logger

from doctor_who_library.domain.entities.library_item import LibraryItem
from doctor_who_library.domain.services.wiki_service import WikiService
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.shared.config.settings import EnrichmentSettings
from doctor_who_library.shared.exceptions.application import ServiceException

logger = get_logger()


class EnrichmentService:
    """Application service for enrichment operations."""
    
    def __init__(
        self,
        wiki_service: WikiService,
        config: EnrichmentSettings,
    ):
        self.wiki_service = wiki_service
        self.config = config
        self._enrichment_counter = self._get_current_enriched_count()
    
    def _get_current_enriched_count(self) -> int:
        """Get the current count of enriched items for sequential numbering."""
        try:
            from doctor_who_library.shared.database.connection import execute_query
            
            query = """
                SELECT COUNT(*) FROM library_items 
                WHERE enrichment_status = 'enriched'
                ORDER BY updated_at ASC
            """
            
            result = execute_query(query)
            return int(result[0][0]) if result else 0
            
        except Exception:
            return 0
    
    def _log_monitor_format(self, item: LibraryItem, counter: Optional[int] = None, failed: bool = False) -> None:
        """Log item in MONITOR table format."""
        from datetime import datetime
        
        if failed:
            # For failed items, we don't increment the counter
            id_str = "ERR"
            confidence = "N/A"
            wiki_status = "❌ No"
        else:
            id_str = str(counter).zfill(3)
            confidence_val = item.enrichment_confidence or 0.0
            confidence = f"{int(confidence_val * 100)}%"
            wiki_status = "🔗 Yes" if item.wiki_url else "❌ No"
        
        # Format title (max 40 chars)
        title = item.title[:40] if len(item.title) > 40 else item.title
        title_padded = title.ljust(40)
        
        # Format confidence (8 chars)
        confidence_padded = confidence.ljust(8)
        
        # Format timestamp
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        # Print in exact MONITOR format
        print(f"[MONITOR] {id_str}  | {title_padded} | {confidence_padded} | {wiki_status} | {timestamp}")
    
    async def get_pending_items(self, limit: Optional[int] = None) -> List[LibraryItem]:
        """Get pending library items from database."""
        try:
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.shared.database.connection import execute_query
            
            query = """
                SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, 
                       wiki_url, wiki_summary, episode_title, serial_title, content_type
                FROM library_items 
                WHERE enrichment_status = 'pending'
                ORDER BY ROWID ASC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            rows = execute_query(query)
            
            items = []
            for row in rows:
                hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, \
                wiki_url, wiki_summary, episode_title, serial_title, content_type = row
                
                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)
                
                # Convert content_type string to enum
                from doctor_who_library.domain.value_objects.content_type import ContentType
                content_type_enum = None
                if content_type:
                    try:
                        content_type_enum = ContentType(content_type)
                    except ValueError:
                        content_type_enum = None
                
                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    story_title=story_title,
                    episode_title=episode_title,
                    serial_title=serial_title,
                    section_name=section_name,
                    content_type=content_type_enum,
                    enrichment_status=EnrichmentStatus.PENDING,
                    enrichment_confidence=0.0,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                items.append(item)
            
            return items
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="get_pending_items",
                message="Failed to get pending items",
                cause=e,
            )
    
    async def save_enriched_item(self, item: LibraryItem) -> None:
        """Save enriched item to database."""
        try:
            from doctor_who_library.shared.database.connection import execute_update
            
            # Remove dashes from UUID for database storage
            hex_id = str(item.id).replace('-', '')
            
            execute_update(
                """UPDATE library_items SET 
                   enrichment_status = ?,
                   enrichment_confidence = ?,
                   wiki_url = ?,
                   wiki_summary = ?,
                   wiki_search_term = ?,
                   enrichment_error = ?,
                   updated_at = datetime('now')
                   WHERE id = ?""",
                (
                    item.enrichment_status.value,
                    item.enrichment_confidence,
                    item.wiki_url,
                    item.wiki_summary,
                    item.wiki_search_term,
                    item.enrichment_error,
                    hex_id
                )
            )
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="save_enriched_item",
                message=f"Failed to save enriched item {item.id}",
                cause=e,
            )
    
    async def enrich_pending_items(
        self,
        batch_size: Optional[int] = None,
        max_items: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Enrich pending library items with wiki metadata."""
        try:
            batch_size = batch_size or self.config.batch_size
            
            # Get pending items
            pending_items = await self.get_pending_items(limit=max_items)
            
            if not pending_items:
                logger.info("No pending items to enrich")
                return {
                    "processed": 0,
                    "enriched": 0,
                    "failed": 0,
                    "skipped": 0,
                    "avg_confidence": 0.0,
                }
            
            logger.info(f"Starting enrichment of {len(pending_items)} items")
            
            # Process in batches
            total_processed = 0
            total_enriched = 0
            total_failed = 0
            total_skipped = 0
            confidence_scores = []
            
            for i in range(0, len(pending_items), batch_size):
                batch = pending_items[i:i + batch_size]
                batch_num = i // batch_size + 1
                total_batches = (len(pending_items) + batch_size - 1) // batch_size
                
                logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} items)")
                
                # Enrich each item in the batch using wiki service context
                async with self.wiki_service:
                    for item in batch:
                        try:
                            enriched_item = await self.wiki_service.enrich_item(item)
                            await self.save_enriched_item(enriched_item)
                            
                            # Log individual item completion in MONITOR format
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                self._enrichment_counter += 1
                                self._log_monitor_format(enriched_item, self._enrichment_counter)
                            
                            # Update statistics
                            total_processed += 1
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                total_enriched += 1
                                confidence_scores.append(enriched_item.enrichment_confidence)
                            elif enriched_item.enrichment_status == EnrichmentStatus.FAILED:
                                total_failed += 1
                            elif enriched_item.enrichment_status == EnrichmentStatus.SKIPPED:
                                total_skipped += 1
                                
                        except Exception as e:
                            logger.error(f"Failed to enrich item {item.id}: {e}")
                            # Mark as failed
                            item.mark_enrichment_failed(str(e))
                            await self.save_enriched_item(item)
                            
                            # Log individual item failure in MONITOR format
                            self._log_monitor_format(item, None, failed=True)
                            
                            total_processed += 1
                            total_failed += 1
                
                logger.info(f"Batch {batch_num} complete")
            
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            results = {
                "processed": total_processed,
                "enriched": total_enriched,
                "failed": total_failed,
                "skipped": total_skipped,
                "avg_confidence": avg_confidence,
            }
            
            logger.info(f"Enrichment complete: {results}")
            return results
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="enrich_pending_items",
                message="Failed to enrich pending items",
                cause=e,
            )
    
    async def enrich_single_item(self, item_id: str) -> LibraryItem:
        """Enrich a single library item."""
        try:
            # Get the item from database
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.shared.database.connection import execute_query
            
            # Remove dashes from UUID for database lookup
            hex_id = item_id.replace('-', '')
            
            rows = execute_query(
                "SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, "
                "wiki_url, wiki_summary, episode_title, serial_title, content_type "
                "FROM library_items WHERE id = ?", 
                (hex_id,)
            )
            
            if not rows:
                raise ServiceException(
                    service_name="EnrichmentService",
                    operation="enrich_single_item",
                    message=f"Item not found: {item_id}",
                )
            
            row = rows[0]
            hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, \
            wiki_url, wiki_summary, episode_title, serial_title, content_type = row
            
            # Convert hex ID to UUID
            formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
            uuid_id = UUID(formatted_id)
            
            # Convert content_type string to enum
            from doctor_who_library.domain.value_objects.content_type import ContentType
            content_type_enum = None
            if content_type:
                try:
                    content_type_enum = ContentType(content_type)
                except ValueError:
                    content_type_enum = None
            
            item = LibraryItem(
                id=uuid_id,
                title=title or "Unknown Title",
                story_title=story_title,
                episode_title=episode_title,
                serial_title=serial_title,
                section_name=section_name,
                content_type=content_type_enum,
                enrichment_status=EnrichmentStatus.PENDING,
                enrichment_confidence=0.0,
                wiki_url=wiki_url,
                wiki_summary=wiki_summary,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            
            # Enrich the item using wiki service context
            async with self.wiki_service:
                enriched_item = await self.wiki_service.enrich_item(item)
            
            # Save the result
            await self.save_enriched_item(enriched_item)
            
            return enriched_item
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="enrich_single_item",
                message=f"Failed to enrich item: {item_id}",
                cause=e,
            )
    
    async def reset_enrichment_status(self, status: EnrichmentStatus = EnrichmentStatus.PENDING) -> int:
        """Reset enrichment status for all items."""
        try:
            from doctor_who_library.shared.database.connection import execute_update
            
            # Reset enrichment fields for all items
            affected_rows = execute_update(
                """UPDATE library_items SET 
                   enrichment_status = ?,
                   enrichment_confidence = 0.0,
                   enrichment_error = NULL,
                   wiki_url = NULL,
                   wiki_summary = NULL,
                   wiki_image_url = NULL,
                   wiki_search_term = NULL,
                   updated_at = datetime('now')""",
                (status.value,)
            )
            
            logger.info(f"Reset enrichment status for {affected_rows} items")
            return affected_rows
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="reset_enrichment_status",
                message="Failed to reset enrichment status",
                cause=e,
            )
    
    async def reset_single_item_enrichment(self, item_id: str, status: EnrichmentStatus = EnrichmentStatus.PENDING) -> int:
        """Reset enrichment status for a single item."""
        try:
            from doctor_who_library.shared.database.connection import execute_update
            
            # Reset enrichment fields for specific item
            affected_rows = execute_update(
                """UPDATE library_items SET 
                   enrichment_status = ?,
                   enrichment_confidence = 0.0,
                   enrichment_error = NULL,
                   wiki_url = NULL,
                   wiki_summary = NULL,
                   wiki_image_url = NULL,
                   wiki_search_term = NULL,
                   updated_at = datetime('now')
                   WHERE id = ?""",
                (status.value, item_id.replace('-', ''))  # Remove dashes for database storage
            )
            
            logger.info(f"Reset enrichment status for item {item_id}")
            return affected_rows
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="reset_single_item_enrichment",
                message=f"Failed to reset enrichment status for item {item_id}",
                cause=e,
            )
    
    async def get_processed_items(self, limit: Optional[int] = None) -> List[LibraryItem]:
        """Get already processed library items (enriched, failed, or skipped)."""
        try:
            from uuid import UUID
            from datetime import datetime
            from doctor_who_library.shared.database.connection import execute_query
            
            query = """
                SELECT id, title, story_title, section_name, enrichment_status, enrichment_confidence, 
                       wiki_url, wiki_summary, episode_title, serial_title, content_type, enrichment_error
                FROM library_items 
                WHERE enrichment_status != 'pending'
                ORDER BY ROWID ASC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            rows = execute_query(query)
            
            items = []
            for row in rows:
                hex_id, title, story_title, section_name, enrichment_status, enrichment_confidence, \
                wiki_url, wiki_summary, episode_title, serial_title, content_type, enrichment_error = row
                
                # Convert hex ID to UUID
                formatted_id = f"{hex_id[:8]}-{hex_id[8:12]}-{hex_id[12:16]}-{hex_id[16:20]}-{hex_id[20:]}"
                uuid_id = UUID(formatted_id)
                
                # Convert content_type string to enum
                from doctor_who_library.domain.value_objects.content_type import ContentType
                content_type_enum = None
                if content_type:
                    try:
                        content_type_enum = ContentType(content_type)
                    except ValueError:
                        content_type_enum = None
                
                # Convert enrichment_status string to enum
                enrichment_status_enum = EnrichmentStatus(enrichment_status)
                
                item = LibraryItem(
                    id=uuid_id,
                    title=title or "Unknown Title",
                    story_title=story_title,
                    episode_title=episode_title,
                    serial_title=serial_title,
                    section_name=section_name,
                    content_type=content_type_enum,
                    enrichment_status=enrichment_status_enum,
                    enrichment_confidence=enrichment_confidence or 0.0,
                    enrichment_error=enrichment_error,
                    wiki_url=wiki_url,
                    wiki_summary=wiki_summary,
                    created_at=datetime.utcnow(),
                    updated_at=datetime.utcnow(),
                )
                items.append(item)
            
            return items
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="get_processed_items",
                message="Failed to get processed items",
                cause=e,
            )

    async def enrich_pending_items_with_enrichment_callback(
        self,
        batch_size: Optional[int] = None,
        max_items: Optional[int] = None,
        enrichment_callback: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """Enrich pending library items with detailed enrichment callbacks."""
        try:
            batch_size = batch_size or self.config.batch_size
            
            # Get pending items
            pending_items = await self.get_pending_items(limit=max_items)
            
            if not pending_items:
                logger.info("No pending items to enrich")
                return {
                    "processed": 0,
                    "enriched": 0,
                    "failed": 0,
                    "skipped": 0,
                    "avg_confidence": 0.0,
                }
            
            logger.info(f"Starting enrichment of {len(pending_items)} items")
            
            # Process in batches
            total_processed = 0
            total_enriched = 0
            total_failed = 0
            total_skipped = 0
            confidence_scores = []
            
            for i in range(0, len(pending_items), batch_size):
                batch = pending_items[i:i + batch_size]
                batch_num = i // batch_size + 1
                total_batches = (len(pending_items) + batch_size - 1) // batch_size
                
                logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} items)")
                
                # Enrich each item in the batch using wiki service context
                async with self.wiki_service:
                    for item in batch:
                        try:
                            logger.info(f"🔍 Enriching: {item.title}")
                            enriched_item = await self.wiki_service.enrich_item(item)
                            await self.save_enriched_item(enriched_item)
                            
                            # Log the result with detailed information
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                logger.info(f"✅ Enriched: {enriched_item.title} | Confidence: {enriched_item.enrichment_confidence:.2f} | URL: {enriched_item.wiki_url}")
                            elif enriched_item.enrichment_status == EnrichmentStatus.FAILED:
                                logger.error(f"❌ Failed: {enriched_item.title} | Error: {enriched_item.enrichment_error}")
                            elif enriched_item.enrichment_status == EnrichmentStatus.SKIPPED:
                                logger.warning(f"⏭️ Skipped: {enriched_item.title} | Reason: {enriched_item.enrichment_error}")
                            
                            # Update statistics
                            total_processed += 1
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                total_enriched += 1
                                confidence_scores.append(enriched_item.enrichment_confidence)
                            elif enriched_item.enrichment_status == EnrichmentStatus.FAILED:
                                total_failed += 1
                            elif enriched_item.enrichment_status == EnrichmentStatus.SKIPPED:
                                total_skipped += 1
                            
                            # Call enrichment callback if provided
                            if enrichment_callback:
                                enrichment_callback(enriched_item, total_processed, len(pending_items))
                                
                        except Exception as e:
                            logger.error(f"💥 Exception enriching {item.title}: {e}")
                            # Mark as failed
                            item.mark_enrichment_failed(str(e))
                            await self.save_enriched_item(item)
                            total_processed += 1
                            total_failed += 1
                            
                            # Call enrichment callback if provided
                            if enrichment_callback:
                                enrichment_callback(item, total_processed, len(pending_items))
                
                logger.info(f"Batch {batch_num} complete")
            
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            results = {
                "processed": total_processed,
                "enriched": total_enriched,
                "failed": total_failed,
                "skipped": total_skipped,
                "avg_confidence": avg_confidence,
            }
            
            logger.info(f"Enrichment complete: {results}")
            return results
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="enrich_pending_items_with_enrichment_callback",
                message="Failed to enrich pending items",
                cause=e,
            )

    async def enrich_pending_items_with_progress(
        self,
        batch_size: Optional[int] = None,
        max_items: Optional[int] = None,
        progress_callback: Optional[callable] = None,
    ) -> Dict[str, Any]:
        """Enrich pending library items with wiki metadata and progress callbacks."""
        try:
            batch_size = batch_size or self.config.batch_size
            
            # Get pending items
            pending_items = await self.get_pending_items(limit=max_items)
            
            if not pending_items:
                logger.info("No pending items to enrich")
                return {
                    "processed": 0,
                    "enriched": 0,
                    "failed": 0,
                    "skipped": 0,
                    "avg_confidence": 0.0,
                }
            
            logger.info(f"Starting enrichment of {len(pending_items)} items")
            
            # Process in batches
            total_processed = 0
            total_enriched = 0
            total_failed = 0
            total_skipped = 0
            confidence_scores = []
            
            for i in range(0, len(pending_items), batch_size):
                batch = pending_items[i:i + batch_size]
                batch_num = i // batch_size + 1
                total_batches = (len(pending_items) + batch_size - 1) // batch_size
                
                logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} items)")
                
                # Enrich each item in the batch using wiki service context
                async with self.wiki_service:
                    for item in batch:
                        try:
                            logger.info(f"🔍 Enriching: {item.title}")
                            enriched_item = await self.wiki_service.enrich_item(item)
                            await self.save_enriched_item(enriched_item)
                            
                            # Log the result with detailed information
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                logger.info(f"✅ Enriched: {enriched_item.title} | Confidence: {enriched_item.enrichment_confidence:.2f} | URL: {enriched_item.wiki_url}")
                            elif enriched_item.enrichment_status == EnrichmentStatus.FAILED:
                                logger.error(f"❌ Failed: {enriched_item.title} | Error: {enriched_item.enrichment_error}")
                            elif enriched_item.enrichment_status == EnrichmentStatus.SKIPPED:
                                logger.warning(f"⏭️ Skipped: {enriched_item.title} | Reason: {enriched_item.enrichment_error}")
                            
                            # Update statistics
                            total_processed += 1
                            if enriched_item.enrichment_status == EnrichmentStatus.ENRICHED:
                                total_enriched += 1
                                confidence_scores.append(enriched_item.enrichment_confidence)
                            elif enriched_item.enrichment_status == EnrichmentStatus.FAILED:
                                total_failed += 1
                            elif enriched_item.enrichment_status == EnrichmentStatus.SKIPPED:
                                total_skipped += 1
                            
                            # Call progress callback if provided
                            if progress_callback:
                                progress_callback(total_processed, len(pending_items))
                                
                        except Exception as e:
                            logger.error(f"💥 Exception enriching {item.title}: {e}")
                            # Mark as failed
                            item.mark_enrichment_failed(str(e))
                            await self.save_enriched_item(item)
                            total_processed += 1
                            total_failed += 1
                            
                            # Call progress callback if provided
                            if progress_callback:
                                progress_callback(total_processed, len(pending_items))
                
                logger.info(f"Batch {batch_num} complete")
            
            avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
            
            results = {
                "processed": total_processed,
                "enriched": total_enriched,
                "failed": total_failed,
                "skipped": total_skipped,
                "avg_confidence": avg_confidence,
            }
            
            logger.info(f"Enrichment complete: {results}")
            return results
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="enrich_pending_items_with_progress",
                message="Failed to enrich pending items",
                cause=e,
            )

    async def get_enrichment_stats(self) -> Dict[str, Any]:
        """Get enrichment statistics."""
        try:
            from doctor_who_library.shared.database.connection import execute_query
            
            stats = {}
            
            # Count by status
            for status in EnrichmentStatus:
                count_result = execute_query(
                    "SELECT COUNT(*) FROM library_items WHERE enrichment_status = ?", 
                    (status.value,)
                )
                stats[status.value] = count_result[0][0]
            
            # Calculate average confidence for enriched items
            avg_result = execute_query(
                "SELECT AVG(enrichment_confidence) FROM library_items WHERE enrichment_status = ? AND enrichment_confidence IS NOT NULL", 
                (EnrichmentStatus.ENRICHED.value,)
            )
            stats["avg_confidence"] = avg_result[0][0] if avg_result[0][0] else 0.0
            
            return stats
            
        except Exception as e:
            raise ServiceException(
                service_name="EnrichmentService",
                operation="get_enrichment_stats",
                message="Failed to get enrichment statistics",
                cause=e,
            )
