"""Wiki content parser with media-type specific rules."""

import re
from typing import Dict, List, Optional, Tuple

from doctor_who_library.core.logging import LoggingMixin
from doctor_who_library.models.metadata import MediaType
from doctor_who_library.utils.text_processing import (
    clean_html_content,
    clean_wiki_text,
    extract_first_paragraph,
    extract_section_content,
)


class WikiContentParser(LoggingMixin):
    """Parser for TARDIS Wiki content with media-type specific extraction rules."""
    
    def __init__(self) -> None:
        super().__init__()
    
    def parse_metadata(
        self,
        content: str,
        page_title: str,
        media_type: Optional[MediaType] = None,
    ) -> Dict[str, Optional[str]]:
        """Parse wiki content and extract metadata based on media type.
        
        Args:
            content: Raw wiki page content
            page_title: Title of the wiki page
            media_type: Media type for content-specific parsing rules
            
        Returns:
            Dictionary with extracted metadata
        """
        self.log_method_call(
            "parse_metadata",
            page_title=page_title,
            media_type=media_type,
            content_length=len(content) if content else 0,
        )
        
        metadata = {
            "title": page_title,
            "description": None,
            "plot": None,
            "doctor": None,
            "companions": None,
            "writer": None,
            "director": None,
            "producer": None,
            "broadcast_date": None,
            "release_date": None,
            "series": None,
            "story_number": None,
            "cast": None,
            "production_notes": None,
            "continuity": None,
        }
        
        if not content:
            self.logger.warning("No content provided for parsing", page_title=page_title)
            return metadata
        
        # Extract description based on media type rules
        metadata["description"] = self._extract_description(content, media_type)
        
        # Extract other standard metadata
        metadata.update(self._extract_standard_metadata(content))
        
        self.logger.debug(
            "Metadata parsing completed",
            page_title=page_title,
            description_found=bool(metadata["description"]),
            doctor_found=bool(metadata["doctor"]),
        )
        
        return metadata
    
    def _extract_description(
        self,
        content: str,
        media_type: Optional[MediaType],
    ) -> Optional[str]:
        """Extract description using media-type specific rules.
        
        Args:
            content: Wiki page content
            media_type: Media type for specific extraction rules
            
        Returns:
            Extracted description text
        """
        if not media_type:
            # Fallback to generic extraction
            return self._extract_generic_description(content)
        
        if media_type == MediaType.AUDIO_STORY:
            return self._extract_audio_description(content)
        elif media_type in (MediaType.NOVEL, MediaType.NOVELLA, MediaType.SHORT_STORY):
            return self._extract_novel_description(content)
        elif media_type in (MediaType.COMIC_STORY, MediaType.GRAPHIC_NOVEL):
            return self._extract_comic_description(content)
        elif media_type == MediaType.WEBCAST:
            return self._extract_webcast_description(content)
        elif media_type == MediaType.VIDEO_GAME:
            return self._extract_game_description(content)
        elif media_type in (MediaType.CON_EPISODE, MediaType.DWE_EPISODE):
            return self._extract_episode_description(content)
        elif media_type == MediaType.HOME_VIDEO:
            return self._extract_home_video_description(content)
        elif media_type == MediaType.TV_STORY:
            return self._extract_tv_description(content)
        else:
            return self._extract_generic_description(content)
    
    def _extract_audio_description(self, content: str) -> Optional[str]:
        """Extract description for audio dramas - prefer Synopsis."""
        # Try Synopsis first
        synopsis = extract_section_content(content, "Synopsis")
        if synopsis:
            return clean_wiki_text(synopsis)
        
        # Fallback to first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_novel_description(self, content: str) -> Optional[str]:
        """Extract description for novels - prefer Publisher's Summary."""
        # Try Publisher's Summary first
        publisher_summary = extract_section_content(content, "Publisher's Summary")
        if publisher_summary:
            return clean_wiki_text(publisher_summary)
        
        # Try alternate spellings
        alt_names = ["Publisher's summary", "Publishers Summary", "Publishers summary"]
        for alt_name in alt_names:
            summary = extract_section_content(content, alt_name)
            if summary:
                return clean_wiki_text(summary)
        
        # Fallback to first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_comic_description(self, content: str) -> Optional[str]:
        """Extract description for comics - use first paragraph or Synopsis."""
        # Try Synopsis first
        synopsis = extract_section_content(content, "Synopsis")
        if synopsis:
            return clean_wiki_text(synopsis)
        
        # Try Publisher's Summary
        publisher_summary = extract_section_content(content, "Publisher's Summary")
        if publisher_summary:
            return clean_wiki_text(publisher_summary)
        
        # Use first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_webcast_description(self, content: str) -> Optional[str]:
        """Extract description for webcasts - always use first paragraph without modification."""
        # For webcasts, always use first paragraph as-is
        first_para = extract_first_paragraph(content)
        if first_para:
            # Minimal cleaning - preserve content even if it's just release info
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_game_description(self, content: str) -> Optional[str]:
        """Extract description for video games - always use first paragraph."""
        # Always use first paragraph for games
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_episode_description(self, content: str) -> Optional[str]:
        """Extract description for CON/DWE episodes - first paragraph unless Synopsis exists."""
        # Try Synopsis first
        synopsis = extract_section_content(content, "Synopsis")
        if synopsis:
            return clean_wiki_text(synopsis)
        
        # Use first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_home_video_description(self, content: str) -> Optional[str]:
        """Extract description for home video - first paragraph if no Synopsis."""
        # Try Synopsis first
        synopsis = extract_section_content(content, "Synopsis")
        if synopsis:
            return clean_wiki_text(synopsis)
        
        # Use first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_tv_description(self, content: str) -> Optional[str]:
        """Extract description for TV stories - prefer Synopsis."""
        # Try Synopsis first
        synopsis = extract_section_content(content, "Synopsis")
        if synopsis:
            return clean_wiki_text(synopsis)
        
        # Try Plot
        plot = extract_section_content(content, "Plot")
        if plot:
            return clean_wiki_text(plot)
        
        # Fallback to first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_generic_description(self, content: str) -> Optional[str]:
        """Generic description extraction - try common sections."""
        # Try common section names in order of preference
        section_names = [
            "Synopsis",
            "Publisher's Summary",
            "Plot",
            "Summary",
            "Description",
        ]
        
        for section_name in section_names:
            section_content = extract_section_content(content, section_name)
            if section_content:
                return clean_wiki_text(section_content)
        
        # Fallback to first paragraph
        first_para = extract_first_paragraph(content)
        if first_para:
            return clean_wiki_text(first_para)
        
        return None
    
    def _extract_standard_metadata(self, content: str) -> Dict[str, Optional[str]]:
        """Extract standard metadata fields from wiki content.
        
        Args:
            content: Wiki page content
            
        Returns:
            Dictionary with extracted metadata fields
        """
        metadata = {}
        
        # Extract from infobox if present
        infobox_data = self._parse_infobox(content)
        if infobox_data:
            metadata.update(infobox_data)
        
        # Extract additional sections
        metadata["plot"] = self._extract_plot_section(content)
        metadata["cast"] = self._extract_cast_section(content)
        metadata["production_notes"] = self._extract_production_notes(content)
        metadata["continuity"] = self._extract_continuity_section(content)
        
        return metadata
    
    def _parse_infobox(self, content: str) -> Dict[str, Optional[str]]:
        """Parse infobox data from wiki content.
        
        Args:
            content: Wiki page content
            
        Returns:
            Dictionary with infobox data
        """
        # Look for infobox templates - handle both regular and Story SMW infoboxes
        infobox_patterns = [
            r'\{\{[Ii]nfobox\s+Story\s+SMW\b[^}]*\}\}',  # Infobox Story SMW
            r'\{\{[Ii]nfobox[^}]*\}\}'  # Generic infobox
        ]
        
        infobox_content = None
        for pattern in infobox_patterns:
            infobox_match = re.search(pattern, content, re.DOTALL)
            if infobox_match:
                infobox_content = infobox_match.group(0)
                break
        
        if not infobox_content:
            return {}
        
        # Extract key-value pairs from infobox
        metadata = {}
        
        # Common infobox field mappings
        field_mappings = {
            "doctor": ["doctor", "featuring", "main character"],
            "companions": ["companions", "companion"],
            "writer": ["writer", "written by", "author"],
            "director": ["director", "directed by"],
            "producer": ["producer", "produced by"],
            "broadcast_date": ["broadcast", "broadcast date", "original broadcast"],
            "release_date": ["release", "release date", "first release"],
            "series": ["series", "season"],
            "story_number": ["story number", "production code", "serial"],
        }
        
        for key, field_names in field_mappings.items():
            for field_name in field_names:
                value = self._extract_infobox_field(infobox_content, field_name)
                if value:
                    metadata[key] = value
                    break
        
        return metadata
    
    def _extract_infobox_field(self, infobox: str, field_name: str) -> Optional[str]:
        """Extract a specific field from infobox content.
        
        Args:
            infobox: Infobox template content
            field_name: Name of the field to extract
            
        Returns:
            Field value if found
        """
        # Try various patterns for field extraction
        patterns = [
            rf'\|\s*{re.escape(field_name)}\s*=\s*([^|}}]+)',
            rf'\|\s*{re.escape(field_name)}\s*=\s*\[\[([^|\]]+)\]\]',
            rf'\|\s*{re.escape(field_name)}\s*=\s*\[\[([^|\]]+)\|[^\]]+\]\]',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, infobox, re.IGNORECASE | re.MULTILINE)
            if match:
                value = match.group(1).strip()
                if value:
                    return clean_wiki_text(value)
        
        return None
    
    def _extract_plot_section(self, content: str) -> Optional[str]:
        """Extract plot section content."""
        plot_names = ["Plot", "Synopsis", "Story"]
        
        for name in plot_names:
            plot_content = extract_section_content(content, name)
            if plot_content:
                return clean_wiki_text(plot_content)
        
        return None
    
    def _extract_cast_section(self, content: str) -> Optional[str]:
        """Extract cast section content."""
        cast_names = ["Cast", "Characters", "Voice cast"]
        
        for name in cast_names:
            cast_content = extract_section_content(content, name)
            if cast_content:
                # Extract actor names from cast listings
                cast_text = clean_wiki_text(cast_content)
                # Simple extraction - could be enhanced with more sophisticated parsing
                return cast_text
        
        return None
    
    def _extract_production_notes(self, content: str) -> Optional[str]:
        """Extract production notes section."""
        note_names = ["Production notes", "Behind the scenes", "Production"]
        
        for name in note_names:
            notes_content = extract_section_content(content, name)
            if notes_content:
                return clean_wiki_text(notes_content)
        
        return None
    
    def _extract_continuity_section(self, content: str) -> Optional[str]:
        """Extract continuity section content."""
        continuity_names = ["Continuity", "Story notes", "References"]
        
        for name in continuity_names:
            continuity_content = extract_section_content(content, name)
            if continuity_content:
                return clean_wiki_text(continuity_content)
        
        return None