"""Modern CLI commands with dependency injection."""

import asyncio
from pathlib import Path
from typing import Optional
import click
from dependency_injector.wiring import inject, Provide
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn, BarColumn, TaskProgressColumn, TimeElapsedColumn
from rich.panel import Panel

from doctor_who_library.application.services.library_service import LibraryService
from doctor_who_library.application.services.enrichment_service import EnrichmentService
from doctor_who_library.domain.value_objects.enrichment_status import EnrichmentStatus
from doctor_who_library.presentation.cli.enrichment_display import enrich as enrich_ext
from doctor_who_library.shared.config.container import Container, wire_container
from doctor_who_library.shared.exceptions.base import DoctorWhoLibraryException

console = Console()


@click.group()
def cli():
    """Doctor Who Library CLI - Modern media management."""
    # Wire dependency injection
    wire_container()


# Use the original enrich command (fallback)
@cli.command()
@click.option(
    "--batch-size",
    default=10,
    help="Number of items to process in each batch",
)
@click.option(
    "--max-items",
    default=None,
    type=int,
    help="Maximum number of items to process",
)
@click.option(
    "--show-all/--no-show-all",
    default=False,
    help="Show all enrichment data",
)
@inject
async def enrich(
    batch_size: int,
    max_items: Optional[int],
    show_all: bool,
    service: LibraryService = Provide[Container.library_service],
    enrichment_service: EnrichmentService = Provide[Container.enrichment_service],
):
    """Enhanced enrichment command with unified display."""
    try:
        console.print(
            Panel.fit(
                "🚀 Doctor Who Library - Unified Enrichment Display",
                style="bold blue",
            )
        )
        
        # Show current stats
        stats = await service.get_library_stats()
        enrichment_stats = stats.get('enrichment_stats', {})
        
        console.print(f"📊 Current stats: {enrichment_stats.get('pending', 0)} pending, "
                     f"{enrichment_stats.get('enriched', 0)} enriched, "
                     f"{enrichment_stats.get('failed', 0)} failed, "
                     f"{enrichment_stats.get('skipped', 0)} skipped")
        
        # Show all items if requested
        if show_all:
            console.print("\n📊 [bold cyan]Loading all enrichment data...[/bold cyan]")
            
            # Get all processed items (no artificial limits)
            enriched_items = await service.get_items_by_status(EnrichmentStatus.ENRICHED)
            failed_items = await service.get_items_by_status(EnrichmentStatus.FAILED)
            skipped_items = await service.get_items_by_status(EnrichmentStatus.SKIPPED)
            
            processed_items = enriched_items + failed_items + skipped_items
            
            if processed_items:
                console.print(f"📋 [bold cyan]Complete Enrichment Status - All {len(processed_items)} Processed Items[/bold cyan]")
                
                # Create a unified table
                table = Table(title=f"Complete Enrichment Status ({len(processed_items)} items)", show_header=True)
                table.add_column("Title", style="cyan", max_width=40)
                table.add_column("Section", style="green", max_width=20)
                table.add_column("Status", style="magenta", max_width=15)
                table.add_column("Confidence", style="yellow", max_width=10)
                table.add_column("Wiki", style="blue", max_width=8)
                table.add_column("Error/Notes", style="red", max_width=25)
                
                for item in processed_items:
                    status_icons = {
                        "enriched": "✅",
                        "failed": "❌",
                        "skipped": "⏭️",
                        "pending": "⏳",
                    }
                    
                    status_icon = status_icons.get(item.enrichment_status.value, "❓")
                    status_text = f"{status_icon} {item.enrichment_status.value}"
                    
                    confidence = f"{item.enrichment_confidence:.2f}" if item.enrichment_confidence else "N/A"
                    wiki_status = "✅" if item.wiki_url or item.wiki_summary else "❌"
                    error_note = (item.enrichment_error or "")[:25] if item.enrichment_error else ""
                    
                    table.add_row(
                        item.title,
                        item.section_name or "N/A",
                        status_text,
                        confidence,
                        wiki_status,
                        error_note
                    )
                
                console.print(table)
            else:
                console.print("No processed items found.")
        
        # Check if there are pending items
        pending_count = enrichment_stats.get("pending", 0)
        if pending_count == 0:
            console.print("\n✅ [green]No pending items to enrich[/green]")
            return
        
        console.print(f"\n🔄 [bold]Starting enrichment of {pending_count} pending items![/bold]")
        console.print(f"⚙️ [bold]Batch size:[/bold] {batch_size}")
        if max_items:
            console.print(f"📊 [bold]Max items:[/bold] {max_items}")
        
        # Actually process the items using enrichment service
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TaskProgressColumn(),
            TimeElapsedColumn(),
            console=console,
        ) as progress:
            task = progress.add_task("Enriching items...", total=min(pending_count, max_items) if max_items else pending_count)
            
            # Process items
            results = await enrichment_service.enrich_pending_items(
                batch_size=batch_size,
                max_items=max_items
            )
            
            progress.update(task, completed=results["processed"])
        
        # Show final results
        console.print(f"\n📈 [bold green]Enrichment Complete![/bold green]")
        console.print(f"✅ [bold]Processed:[/bold] {results['processed']}")
        console.print(f"🎯 [bold]Enriched:[/bold] {results['enriched']}")
        console.print(f"❌ [bold]Failed:[/bold] {results['failed']}")
        console.print(f"⏭️ [bold]Skipped:[/bold] {results['skipped']}")
        if results['enriched'] > 0:
            console.print(f"📊 [bold]Avg Confidence:[/bold] {results['avg_confidence']:.2f}")
        
        # Show updated stats
        updated_stats = await service.get_library_stats()
        updated_enrichment_stats = updated_stats.get('enrichment_stats', {})
        console.print(f"\n📈 [bold]Updated library stats:[/bold] {updated_enrichment_stats.get('enriched', 0)} enriched, "
                     f"{updated_enrichment_stats.get('pending', 0)} pending, "
                     f"{updated_enrichment_stats.get('failed', 0)} failed, "
                     f"{updated_enrichment_stats.get('skipped', 0)} skipped")
        
    except DoctorWhoLibraryException as e:
        console.print(f"❌ [red]Error: {e.message}[/red]")
        raise click.ClickException(str(e))
    except Exception as e:
        console.print(f"❌ [red]Unexpected error: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
@inject
async def stats(
    service: LibraryService = Provide[Container.library_service],
):
    """Show library statistics."""
    try:
        console.print(
            Panel.fit(
                "📊 Library Statistics",
                style="bold green",
            )
        )
        
        stats = await service.get_library_stats()
        
        table = Table(title="Library Overview")
        table.add_column("Metric", style="cyan")
        table.add_column("Count", style="magenta")
        
        table.add_row("Total Items", str(stats['total_items']))
        
        for status, count in stats['enrichment_stats'].items():
            table.add_row(f"Status: {status.title()}", str(count))
        
        console.print(table)
        
    except DoctorWhoLibraryException as e:
        console.print(f"❌ [red]Error: {e.message}[/red]")
        raise click.ClickException(str(e))
    except Exception as e:
        console.print(f"❌ [red]Unexpected error: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
@click.argument("query")
@click.option(
    "--limit",
    default=10,
    help="Maximum number of results to show",
)
@inject
async def search(
    query: str,
    limit: int,
    service: LibraryService = Provide[Container.library_service],
):
    """Search library items."""
    try:
        console.print(f"🔍 Searching for: [bold]{query}[/bold]")
        
        items = await service.search_items(query, limit=limit)
        
        if not items:
            console.print("No items found")
            return
        
        table = Table(title=f"Search Results ({len(items)} items)")
        table.add_column("Title", style="cyan")
        table.add_column("Story", style="yellow")
        table.add_column("Type", style="green")
        table.add_column("Status", style="magenta")
        
        for item in items:
            table.add_row(
                item.title,
                item.story_title or "-",
                item.content_type.value if item.content_type else "-",
                item.enrichment_status.value,
            )
        
        console.print(table)
        
    except DoctorWhoLibraryException as e:
        console.print(f"❌ [red]Error: {e.message}[/red]")
        raise click.ClickException(str(e))
    except Exception as e:
        console.print(f"❌ [red]Unexpected error: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
@click.confirmation_option(
    prompt="Are you sure you want to reset enrichment status for all items?"
)
@inject
async def reset_enrichment(
    service: EnrichmentService = Provide[Container.enrichment_service],
):
    """Reset enrichment status for all items."""
    try:
        console.print("🔄 Resetting enrichment status...")
        
        items_reset = await service.reset_enrichment_status()
        
        console.print(f"✅ Reset enrichment status for {items_reset} items")
        
    except DoctorWhoLibraryException as e:
        console.print(f"❌ [red]Error: {e.message}[/red]")
        raise click.ClickException(str(e))
    except Exception as e:
        console.print(f"❌ [red]Unexpected error: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
def serve():
    """Start the API server."""
    try:
        import uvicorn
        from doctor_who_library.presentation.api.app import app
        from doctor_who_library.shared.config.settings import get_settings
        
        # Wire container before starting server
        wire_container()
        
        settings = get_settings()
        
        console.print(
            Panel.fit(
                f"🚀 Starting Doctor Who Library API\n"
                f"📡 Host: {settings.api.host}:{settings.api.port}\n"
                f"📖 Docs: http://{settings.api.host}:{settings.api.port}/docs",
                style="bold green",
            )
        )
        
        # Use uvicorn.run directly without async handling
        uvicorn.run(
            app,
            host=settings.api.host,
            port=settings.api.port,
            log_level="info",
            reload=settings.api.debug,
        )
        
    except ImportError:
        console.print("❌ [red]uvicorn not installed. Install with: pip install uvicorn[/red]")
        raise click.ClickException("uvicorn not installed")
    except Exception as e:
        console.print(f"❌ [red]Failed to start server: {e}[/red]")
        raise click.ClickException(str(e))


@cli.command()
def dev():
    """Start backend, frontend, and enrichment monitoring in development mode."""
    import subprocess
    import sys
    import os
    import signal
    from pathlib import Path
    
    # Kill any existing servers first
    console.print("🔄 Killing any existing servers...")
    try:
        # Kill uvicorn processes (backend)
        subprocess.run(["pkill", "-f", "uvicorn"], capture_output=True)
        # Kill npm/vite processes (frontend)
        subprocess.run(["pkill", "-f", "npm run dev"], capture_output=True)
        subprocess.run(["pkill", "-f", "vite"], capture_output=True)
        # Kill any dw-cli processes
        subprocess.run(["pkill", "-f", "dw-cli"], capture_output=True)
        
        # Give processes time to terminate
        import time
        time.sleep(1)
        console.print("✅ [green]Cleared existing servers[/green]")
    except Exception as e:
        console.print(f"⚠️  [yellow]Note: {e}[/yellow]")
    
    # Check if we're in the correct directory
    current_dir = Path.cwd()
    frontend_dir = current_dir / "frontend"
    
    if not frontend_dir.exists():
        console.print("❌ [red]Frontend directory not found. Make sure you're in the project root.[/red]")
        raise click.ClickException("Frontend directory not found")
    
    # Check if package.json exists
    package_json = frontend_dir / "package.json"
    if not package_json.exists():
        console.print("❌ [red]package.json not found in frontend directory.[/red]")
        raise click.ClickException("package.json not found")
    
    console.print(
        Panel.fit(
            "🚀 Starting Doctor Who Library in Development Mode\n"
            "📡 Backend: http://localhost:8000\n"
            "🎨 Frontend: http://localhost:5173\n"
            "📖 API Docs: http://localhost:8000/docs\n"
            "📊 Enrichment Monitor: Optimized real-time display\n"
            "\n"
            "Press Ctrl+C to stop all servers",
            style="bold green",
        )
    )
    
    processes = []
    
    try:
        # Start backend using dw-cli serve
        console.print("🔧 Starting backend server...")
        backend_process = subprocess.Popen(
            ["poetry", "run", "dw-cli", "serve"],
            cwd=current_dir,
        )
        processes.append(("Backend", backend_process))
        
        # Give backend time to start
        import time
        time.sleep(2)
        
        # Start frontend with enrichment monitoring
        console.print("🎨 Starting frontend with enrichment monitoring...")
        frontend_process = subprocess.Popen(
            ["npm", "run", "start:dev"],
            cwd=frontend_dir,
        )
        processes.append(("Frontend + Monitor", frontend_process))
        
        console.print("✅ [green]All servers started successfully![/green]")
        console.print("🌐 [blue]Frontend: http://localhost:5173[/blue]")
        console.print("🔧 [blue]Backend: http://localhost:8000[/blue]")
        console.print("📚 [blue]API Docs: http://localhost:8000/docs[/blue]")
        console.print("📊 [blue]Enrichment Monitor: Running with optimized display[/blue]")
        console.print("\n⏹️  Press Ctrl+C to stop all servers")
        
        # Wait for processes
        while True:
            # Check if processes are still running
            for name, process in processes:
                if process.poll() is not None:
                    console.print(f"❌ [red]{name} server stopped unexpectedly[/red]")
                    
                    # Kill other processes
                    for other_name, other_process in processes:
                        if other_process.poll() is None:
                            other_process.terminate()
                    raise click.ClickException(f"{name} server failed")
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        console.print("\n🛑 Stopping servers...")
        
        # Terminate all processes
        for name, process in processes:
            if process.poll() is None:
                console.print(f"⏹️  Stopping {name} server...")
                process.terminate()
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    console.print(f"🔨 Force killing {name} server...")
                    process.kill()
                    process.wait()
        
        console.print("✅ [green]All servers stopped successfully![/green]")
        
    except Exception as e:
        console.print(f"❌ [red]Error starting development servers: {e}[/red]")
        
        # Clean up processes
        for name, process in processes:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=3)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
        
        raise click.ClickException(str(e))


@cli.command()
def doctor():
    """Start backend, frontend, and enrichment monitoring in development mode (alias for dev)."""
    console.print("🩺 [bold blue]Doctor Who Library - Doctor Command[/bold blue]")
    console.print("🚀 [cyan]Starting development mode with all optimizations...[/cyan]")
    
    # Simply call the dev function directly
    dev()


def main():
    """Main entry point for the CLI."""
    # Convert async commands to sync
    def make_sync(async_func):
        def wrapper(*args, **kwargs):
            return asyncio.run(async_func(*args, **kwargs))
        return wrapper
    
    # Convert async commands
    for command in [enrich, stats, search, reset_enrichment]:
        if asyncio.iscoroutinefunction(command.callback):
            command.callback = make_sync(command.callback)
    
    cli()


if __name__ == "__main__":
    main()