"""Excel to database conversion service."""

import pandas as pd
from pathlib import Path
from typing import Dict, Any, List
from sqlalchemy.orm import Session

from doctor_who_library.database.models import LibraryItem, LibrarySection, LibraryGroup


class ExcelConverter:
    """Service for converting Excel chronology files to database."""
    
    def convert_excel_to_database(
        self, 
        excel_file: Path, 
        db: Session, 
        clear_existing: bool = False
    ) -> Dict[str, Any]:
        """
        Convert Excel file to database entries.
        
        Args:
            excel_file: Path to Excel chronology file
            db: Database session
            clear_existing: Whether to clear existing data
            
        Returns:
            Dictionary with conversion statistics
        """
        if clear_existing:
            self._clear_existing_data(db)
        
        # Read Excel file
        excel_data = pd.read_excel(excel_file, sheet_name=None)
        
        total_items = 0
        total_sections = 0
        total_groups = 0
        
        # Process each sheet as a section
        for sheet_name, df in excel_data.items():
            if df.empty:
                continue
            
            # Skip running tally sheet
            if sheet_name.lower() == "running tally":
                continue
                
            # Create or get section
            section = self._get_or_create_section(db, sheet_name)
            total_sections += 1
            
            # Set proper column headers from first row
            if not df.empty and 'Serial Title' not in df.columns:
                df.columns = df.iloc[0]
                df = df.drop(df.index[0])
            
            # Process groups and items
            current_group = None
            
            for _, row in df.iterrows():
                # Check if this is a group header
                if self._is_group_header(row):
                    group_name = self._extract_group_name(row)
                    if group_name:
                        current_group = self._get_or_create_group(db, group_name, sheet_name)
                        total_groups += 1
                    continue
                
                # Process individual item
                item = self._create_library_item(row, sheet_name, current_group)
                if item:
                    db.add(item)
                    total_items += 1
            
            db.commit()
        
        return {
            "total_items": total_items,
            "total_sections": total_sections,
            "total_groups": total_groups
        }
    
    def _clear_existing_data(self, db: Session):
        """Clear existing library data."""
        db.query(LibraryItem).delete()
        db.query(LibraryGroup).delete()
        db.query(LibrarySection).delete()
        db.commit()
    
    def _get_or_create_section(self, db: Session, name: str) -> LibrarySection:
        """Get or create library section."""
        section = db.query(LibrarySection).filter(LibrarySection.name == name).first()
        
        if not section:
            section = LibrarySection(
                name=name,
                display_name=name,
                visible=True
            )
            db.add(section)
            db.commit()
        
        return section
    
    def _get_or_create_group(self, db: Session, name: str, section_name: str) -> LibraryGroup:
        """Get or create library group."""
        group = db.query(LibraryGroup).filter(
            LibraryGroup.name == name,
            LibraryGroup.section_name == section_name
        ).first()
        
        if not group:
            group = LibraryGroup(
                name=name,
                section_name=section_name
            )
            db.add(group)
            db.commit()
        
        return group
    
    def _is_group_header(self, row: pd.Series) -> bool:
        """Check if row is a group header."""
        # Look for rows that are likely group headers
        # This is heuristic-based - may need adjustment based on Excel structure
        first_col = str(row.iloc[0]).strip() if not pd.isna(row.iloc[0]) else ""
        
        # Group headers are often in ALL CAPS or have specific patterns
        if first_col and first_col.isupper() and len(first_col) > 3:
            return True
        
        # Check if most cells are empty (typical of header rows)
        non_empty_cells = sum(1 for cell in row if not pd.isna(cell) and str(cell).strip())
        return non_empty_cells <= 2
    
    def _extract_group_name(self, row: pd.Series) -> str:
        """Extract group name from header row."""
        for cell in row:
            if not pd.isna(cell):
                name = str(cell).strip()
                if name and len(name) > 1:
                    return name
        return ""
    
    def _create_library_item(
        self, 
        row: pd.Series, 
        section_name: str, 
        group: LibraryGroup = None
    ) -> LibraryItem:
        """Create library item from Excel row."""
        # Extract basic info - adjust column mapping based on Excel structure
        title = self._safe_str(row.get("Serial Title") or row.get("Title"))
        
        if not title:
            return None
        
        item = LibraryItem(
            title=title,
            serial_title=self._safe_str(row.get("Serial Title")),
            episode_title=self._safe_str(row.get("Episode Title")),
            story_title=self._safe_str(row.get("Story Title")),
            content_type=self._safe_str(row.get("Type")),
            section_name=section_name,
            group_name=group.name if group else None,
            
            # Personnel
            doctor=self._safe_str(row.get("Doctor")),
            companions=self._safe_str(row.get("Companions")),
            writer=self._safe_str(row.get("Writer")),
            director=self._safe_str(row.get("Director")),
            producer=self._safe_str(row.get("Producer")),
            
            # Production details
            story_number=self._safe_str(row.get("Story Number")),
            series=self._safe_str(row.get("Series")),
            format=self._safe_str(row.get("Format")),
            duration=self._safe_str(row.get("Duration")),
            
            # Dates - would need parsing logic
            # broadcast_date=self._parse_date(row.get("Broadcast Date")),
            # release_date=self._parse_date(row.get("Release Date")),
            
            # Content details
            setting=self._safe_str(row.get("Setting")),
            featuring=self._safe_str(row.get("Featuring")),
            main_character=self._safe_str(row.get("Main character(s)")),
            main_enemy=self._safe_str(row.get("Main enemy")),
            
            # Installment info
            number_of_instalments=self._safe_int(row.get("Number of Instalments")),
            installment_number=self._safe_int(row.get("Installment Number")),
            
            # Initial enrichment status
            enrichment_status="pending"
        )
        
        return item
    
    def _safe_str(self, value) -> str:
        """Safely convert value to string."""
        if pd.isna(value) or value is None:
            return None
        return str(value).strip() or None
    
    def _safe_int(self, value) -> int:
        """Safely convert value to integer."""
        if pd.isna(value) or value is None:
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None