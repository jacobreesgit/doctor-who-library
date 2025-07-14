"""Service for enriching library items with TARDIS Wiki metadata."""

import asyncio
from typing import Dict, List, Optional
from datetime import datetime

from sqlalchemy.orm import Session
from structlog import get_logger

from doctor_who_library.core.config import get_settings
from doctor_who_library.database.models import LibraryItem
from doctor_who_library.services.wiki_scraper import WikiScraper

logger = get_logger()
settings = get_settings()


class WikiEnricher:
    """Service for enriching library items with TARDIS Wiki metadata."""
    
    def __init__(self):
        self.settings = settings
    
    def enrich_pending_items(
        self, 
        db: Session, 
        batch_size: int = 10,
        max_items: Optional[int] = None,
        confidence_threshold: float = 0.7
    ) -> Dict[str, any]:
        """
        Enrich pending library items with TARDIS Wiki metadata.
        
        Args:
            db: Database session
            batch_size: Number of items to process in each batch
            max_items: Maximum total items to process (for testing)
            confidence_threshold: Minimum confidence score to accept enrichment
            
        Returns:
            Dictionary with enrichment statistics
        """
        # Get pending items
        query = db.query(LibraryItem).filter(
            LibraryItem.enrichment_status == "pending"
        )
        
        if max_items:
            query = query.limit(max_items)
        
        pending_items = query.all()
        
        if not pending_items:
            logger.info("No pending items to enrich")
            return {
                "processed": 0,
                "enriched": 0,
                "failed": 0,
                "skipped": 0,
                "avg_confidence": 0.0
            }
        
        logger.info(f"Starting enrichment of {len(pending_items)} items")
        
        # Process items in batches
        total_processed = 0
        total_enriched = 0
        total_failed = 0
        total_skipped = 0
        confidence_scores = []
        
        for i in range(0, len(pending_items), batch_size):
            batch = pending_items[i:i + batch_size]
            
            logger.info(f"Processing batch {i//batch_size + 1}/{(len(pending_items) + batch_size - 1)//batch_size}")
            
            # Process batch asynchronously
            batch_results = asyncio.run(self._process_batch(batch, confidence_threshold))
            
            # Update database with results
            for item, result in zip(batch, batch_results):
                total_processed += 1
                
                if result["status"] == "enriched":
                    self._apply_enrichment(item, result)
                    total_enriched += 1
                    confidence_scores.append(result["confidence_score"])
                    
                elif result["status"] == "error":
                    item.enrichment_status = "failed"
                    item.enrichment_error = result.get("error", "Unknown error")
                    total_failed += 1
                    
                elif result["status"] == "no_match":
                    item.enrichment_status = "skipped"
                    item.enrichment_error = "No suitable wiki page found"
                    total_skipped += 1
                    
                elif result["status"] == "low_confidence":
                    item.enrichment_status = "skipped"
                    item.enrichment_confidence = result["confidence_score"]
                    item.enrichment_error = f"Low confidence: {result['confidence_score']:.2f}"
                    total_skipped += 1
            
            # Commit batch
            db.commit()
            
            logger.info(f"Batch completed: {len(batch)} items processed")
        
        # Calculate average confidence
        avg_confidence = sum(confidence_scores) / len(confidence_scores) if confidence_scores else 0.0
        
        results = {
            "processed": total_processed,
            "enriched": total_enriched,
            "failed": total_failed,
            "skipped": total_skipped,
            "avg_confidence": avg_confidence
        }
        
        logger.info("Enrichment completed", **results)
        return results
    
    async def _process_batch(self, items: List[LibraryItem], confidence_threshold: float) -> List[Dict[str, any]]:
        """Process a batch of items asynchronously."""
        results = []
        
        async with WikiScraper() as scraper:
            for item in items:
                try:
                    # Convert item to dict for scraper
                    item_data = {
                        "title": item.title,
                        "display_title": item.display_title,
                        "story_title": item.story_title,
                        "serial_title": item.serial_title,
                        "content_type": item.content_type,
                        "doctor": item.doctor,
                    }
                    
                    # Enrich item
                    result = await scraper.enrich_library_item(item_data)
                    
                    # Apply confidence threshold
                    if result["status"] == "enriched" and result["confidence_score"] < confidence_threshold:
                        result["status"] = "low_confidence"
                    
                    results.append(result)
                    
                except Exception as e:
                    logger.error(f"Error processing item {item.title}", error=str(e))
                    results.append({
                        "status": "error",
                        "error": str(e),
                        "confidence_score": 0.0,
                        "enriched_fields": {}
                    })
        
        return results
    
    def _apply_enrichment(self, item: LibraryItem, enrichment_result: Dict[str, any]):
        """Apply enrichment data to a library item."""
        enriched_fields = enrichment_result.get("enriched_fields", {})
        
        # Update item fields
        for field, value in enriched_fields.items():
            if hasattr(item, field) and value:
                # Only update if current field is empty or None
                current_value = getattr(item, field)
                if not current_value:
                    setattr(item, field, value)
        
        # Update enrichment status
        item.enrichment_status = "enriched"
        item.enrichment_confidence = enrichment_result.get("confidence_score", 0.0)
        item.enrichment_error = None
        
        # Update timestamp
        item.updated_at = datetime.utcnow()
        
        logger.info(f"Enriched item: {item.title}", confidence=item.enrichment_confidence)
    
    def reset_enrichment_status(self, db: Session, status: str = "pending"):
        """Reset enrichment status for all items."""
        db.query(LibraryItem).update({
            "enrichment_status": status,
            "enrichment_confidence": 0.0,
            "enrichment_error": None,
            "wiki_url": None,
            "wiki_summary": None,
            "wiki_image_url": None,
        })
        db.commit()
        
        logger.info(f"Reset enrichment status to '{status}' for all items")
    
    def get_enrichment_stats(self, db: Session) -> Dict[str, any]:
        """Get enrichment statistics."""
        stats = {}
        
        # Count by status
        for status in ["pending", "enriched", "failed", "skipped"]:
            count = db.query(LibraryItem).filter(
                LibraryItem.enrichment_status == status
            ).count()
            stats[status] = count
        
        # Get average confidence for enriched items
        enriched_items = db.query(LibraryItem).filter(
            LibraryItem.enrichment_status == "enriched"
        ).all()
        
        if enriched_items:
            avg_confidence = sum(item.enrichment_confidence for item in enriched_items) / len(enriched_items)
            stats["avg_confidence"] = avg_confidence
        else:
            stats["avg_confidence"] = 0.0
        
        return stats