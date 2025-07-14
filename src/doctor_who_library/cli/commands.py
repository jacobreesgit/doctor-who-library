"""CLI commands for developers."""

import click
from pathlib import Path
from rich.console import Console
from rich.progress import Progress, SpinnerColumn, TextColumn

from doctor_who_library.database import create_tables, get_db_session
from doctor_who_library.services.excel_converter import ExcelConverter

console = Console()


@click.group()
def cli():
    """Doctor Who Library Developer CLI."""
    pass


@cli.command()
@click.argument("excel_file", type=click.Path(exists=True, path_type=Path))
@click.option("--clear", is_flag=True, help="Clear existing data before import")
def convert(excel_file: Path, clear: bool):
    """
    Convert Excel chronology file to database.
    
    DEVELOPER ONLY - This populates the database with library data.
    End users will access the data through the web interface.
    """
    console.print("🔧 [bold]Developer Excel Conversion Tool[/bold]")
    console.print(f"📁 Input: {excel_file}")
    console.print()
    
    if clear:
        console.print("⚠️  [yellow]Clearing existing database...[/yellow]")
    
    try:
        # Create tables
        create_tables()
        
        # Convert Excel file
        converter = ExcelConverter()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
            transient=True,
        ) as progress:
            task = progress.add_task("Converting Excel to database...", total=None)
            
            with get_db_session() as db:
                results = converter.convert_excel_to_database(
                    excel_file, 
                    db, 
                    clear_existing=clear
                )
            
            progress.update(task, description="✅ Conversion completed!")
        
        console.print("🎉 [green]Excel conversion successful![/green]")
        console.print()
        console.print(f"📊 Imported {results['total_items']} items")
        console.print(f"📁 Created {results['total_sections']} sections")
        console.print(f"📁 Created {results['total_groups']} groups")
        console.print()
        console.print("🚀 Start the API server: [cyan]poetry run dw-serve[/cyan]")
        console.print("🌐 View API docs: [cyan]http://localhost:8000/docs[/cyan]")
        
    except Exception as e:
        console.print(f"❌ [red]Conversion failed: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
def migrate():
    """Initialize database tables."""
    console.print("🔧 [bold]Creating database tables...[/bold]")
    
    try:
        create_tables()
        console.print("✅ [green]Database tables created successfully![/green]")
        
    except Exception as e:
        console.print(f"❌ [red]Migration failed: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
@click.option("--batch-size", default=10, help="Number of items to process at once")
@click.option("--max-items", default=None, type=int, help="Maximum items to enrich (for testing)")
@click.option("--confidence", default=0.7, help="Minimum confidence threshold")
def enrich(batch_size: int, max_items: int, confidence: float):
    """
    Enrich library items with TARDIS Wiki metadata.
    
    DEVELOPER ONLY - This enriches the database with metadata.
    End users will see the enriched data through the web interface.
    """
    console.print("🔧 [bold]Developer Enrichment Tool[/bold]")
    console.print(f"📊 Batch size: {batch_size}")
    console.print(f"🎯 Confidence threshold: {confidence}")
    if max_items:
        console.print(f"📝 Max items: {max_items}")
    console.print()
    
    try:
        from doctor_who_library.services.wiki_enricher import WikiEnricher
        
        enricher = WikiEnricher()
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console,
            transient=True,
        ) as progress:
            task = progress.add_task("Enriching library items...", total=None)
            
            with get_db_session() as db:
                results = enricher.enrich_pending_items(
                    db,
                    batch_size=batch_size,
                    max_items=max_items,
                    confidence_threshold=confidence
                )
            
            progress.update(task, description="✅ Enrichment completed!")
        
        console.print("🎉 [green]Enrichment successful![/green]")
        console.print()
        console.print(f"📊 Processed {results['processed']} items")
        console.print(f"✅ Enriched {results['enriched']} items")
        console.print(f"❌ Failed {results['failed']} items")
        console.print(f"⚖️  Average confidence: {results['avg_confidence']:.2f}")
        console.print()
        console.print("🚀 Start the API server: [cyan]poetry run dw-serve[/cyan]")
        console.print("🌐 View enriched data: [cyan]http://localhost:8000/docs[/cyan]")
        
    except Exception as e:
        console.print(f"❌ [red]Enrichment failed: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
@click.confirmation_option(prompt="Are you sure you want to clear all data?")
def clear():
    """Clear all database data (DESTRUCTIVE)."""
    from doctor_who_library.database import drop_tables
    
    console.print("🗑️  [red]Clearing all database data...[/red]")
    
    try:
        drop_tables()
        create_tables()
        console.print("✅ [green]Database cleared successfully![/green]")
        
    except Exception as e:
        console.print(f"❌ [red]Clear failed: {e}[/red]")
        raise click.ClickException(str(e))


if __name__ == "__main__":
    cli()