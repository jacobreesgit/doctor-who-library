"""
Section validation service for Doctor Who Library.

Provides validation and normalization of section names according to
the naming conventions defined in NAMING_CONVENTIONS.md.
"""


from ..value_objects.section_name import (
    APPROVED_SECTION_NAMES,
    SectionCategory,
    get_all_section_names,
    get_section_category,
    is_valid_section_name,
)


class SectionValidationService:
    """Service for validating and normalizing section names."""

    def __init__(self) -> None:
        self._approved_names: set[str] = APPROVED_SECTION_NAMES

    def validate_section_name(self, section_name: str) -> str:
        """
        Validate a section name against the approved list.

        Args:
            section_name: The section name to validate

        Returns:
            The validated section name

        Raises:
            ValueError: If the section name is not approved
        """
        if not section_name:
            raise ValueError("Section name cannot be empty")

        # Normalize whitespace
        normalized = section_name.strip()

        if not is_valid_section_name(normalized):
            raise ValueError(
                f"Invalid section name: '{normalized}'. "
                f"Must be one of the approved section names. "
                f"See NAMING_CONVENTIONS.md for the complete list."
            )

        return normalized

    def validate_section_names(self, section_names: list[str]) -> list[str]:
        """
        Validate a list of section names.

        Args:
            section_names: List of section names to validate

        Returns:
            List of validated section names

        Raises:
            ValueError: If any section name is not approved
        """
        validated_names = []
        for section_name in section_names:
            validated_names.append(self.validate_section_name(section_name))
        return validated_names

    def is_valid_section_name(self, section_name: str) -> bool:
        """
        Check if a section name is valid without raising an exception.

        Args:
            section_name: The section name to check

        Returns:
            True if the section name is approved, False otherwise
        """
        if not section_name:
            return False
        return is_valid_section_name(section_name.strip())

    def get_all_approved_section_names(self) -> list[str]:
        """Get all approved section names."""
        return get_all_section_names()

    def get_section_category(self, section_name: str) -> SectionCategory | None:
        """
        Get the category for a section name.

        Args:
            section_name: The section name to categorize

        Returns:
            The section category or None if not found
        """
        if not self.is_valid_section_name(section_name):
            return None
        return get_section_category(section_name.strip())

    def normalize_section_name(self, section_name: str) -> str | None:
        """
        Normalize a section name (trim whitespace) and validate.

        Args:
            section_name: The section name to normalize

        Returns:
            The normalized section name or None if invalid
        """
        if not section_name:
            return None

        normalized = section_name.strip()
        if self.is_valid_section_name(normalized):
            return normalized
        return None

    def find_similar_section_names(
        self, section_name: str, max_results: int = 5
    ) -> list[str]:
        """
        Find similar section names for suggestion purposes.

        Args:
            section_name: The section name to find similar names for
            max_results: Maximum number of suggestions to return

        Returns:
            List of similar section names
        """
        if not section_name:
            return []

        section_name_lower = section_name.lower()
        suggestions = []

        for approved_name in self._approved_names:
            # Simple string matching - could be enhanced with fuzzy matching
            if (
                section_name_lower in approved_name.lower()
                or approved_name.lower().startswith(section_name_lower)
            ):
                suggestions.append(approved_name)

        return suggestions[:max_results]

    def get_validation_error_message(self, section_name: str) -> str:
        """
        Get a detailed error message for an invalid section name.

        Args:
            section_name: The invalid section name

        Returns:
            Detailed error message with suggestions
        """
        if not section_name:
            return "Section name cannot be empty"

        similar_names = self.find_similar_section_names(section_name)

        message = f"Invalid section name: '{section_name}'"

        if similar_names:
            message += f". Did you mean: {', '.join(similar_names)}?"
        else:
            message += ". Must be one of the approved section names."

        message += " See NAMING_CONVENTIONS.md for the complete list."

        return message
