#!/usr/bin/env python3
"""Test script to run actual enrichment and see live table updates."""

import asyncio
from rich.console import Console
from rich.table import Table
from datetime import datetime

console = Console()

# Track enriched items in chronological order
enriched_items = []

def enrichment_callback(item, processed, total):
    """Callback function called for each enriched item."""
    # Add to our tracking
    enriched_items.append(item)
    
    # Clear screen and redraw table
    console.clear()
    
    # Show current progress
    console.print(f"🔄 Processing: {processed}/{total} items")
    
    # Create live table
    console.print("\n🔴 LIVE ENRICHMENT TABLE (Chronological Order):")
    console.print("═" * 120)
    
    # Create table
    table = Table(title=f"Live Enrichment Progress ({len(enriched_items)} items)", show_header=True)
    table.add_column("ID", style="cyan", max_width=4)
    table.add_column("Title", style="green", max_width=40)
    table.add_column("Status", style="magenta", max_width=10)
    table.add_column("Confidence", style="yellow", max_width=10)
    table.add_column("Wiki", style="blue", max_width=8)
    table.add_column("Time", style="white", max_width=10)
    
    # Add rows (chronological order)
    for i, enriched_item in enumerate(enriched_items):
        status_icons = {
            "enriched": "✅",
            "failed": "❌",
            "skipped": "⏭️"
        }
        
        status_icon = status_icons.get(enriched_item.enrichment_status.value, "❓")
        confidence = f"{enriched_item.enrichment_confidence:.2f}" if enriched_item.enrichment_confidence else "N/A"
        wiki_status = "🔗" if enriched_item.wiki_url else "❌"
        timestamp = datetime.now().strftime("%H:%M:%S")
        
        table.add_row(
            f"{i+1:03d}",
            enriched_item.title[:37] + "..." if len(enriched_item.title) > 40 else enriched_item.title,
            f"{status_icon} {enriched_item.enrichment_status.value}",
            confidence,
            wiki_status,
            timestamp
        )
    
    console.print(table)
    console.print("═" * 120)
    console.print(f"✅ Items enriched: {len([i for i in enriched_items if i.enrichment_status.value == 'enriched'])}")
    console.print(f"❌ Items failed: {len([i for i in enriched_items if i.enrichment_status.value == 'failed'])}")
    console.print(f"⏭️ Items skipped: {len([i for i in enriched_items if i.enrichment_status.value == 'skipped'])}")
    console.print(f"🔄 Progress: {processed}/{total} ({processed/total*100:.1f}%)")
    

async def main():
    """Run enrichment with live table updates."""
    try:
        # Wire dependency injection
        from doctor_who_library.shared.config.container import wire_container
        wire_container()
        
        # Get enrichment service
        from doctor_who_library.shared.config.container import get_container
        container = get_container()
        enrichment_service = container.enrichment_service()
        
        console.print("🚀 Starting Live Enrichment Test...")
        console.print("📊 This will show items being added to the table in real-time!")
        console.print("⏱️  Processing 10 items in batches of 2...")
        console.print("")
        
        # Run enrichment with callback
        result = await enrichment_service.enrich_pending_items_with_enrichment_callback(
            batch_size=2,
            max_items=10,
            enrichment_callback=enrichment_callback
        )
        
        console.print(f"\n🎉 Enrichment Complete!")
        console.print(f"📊 Results: {result}")
        
    except Exception as e:
        console.print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())