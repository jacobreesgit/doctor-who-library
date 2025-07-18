"""
Section name value objects for Doctor Who Library.

Enforces naming conventions as defined in NAMING_CONVENTIONS.md.
All section names must match the approved list exactly.
"""

from enum import Enum


class SectionName(Enum):
    """Enumeration of all approved section names."""

    # Classic Era Doctors
    FIRST_DOCTOR = "1st Doctor"
    SECOND_DOCTOR = "2nd Doctor"
    THIRD_DOCTOR = "3rd Doctor"
    FOURTH_DOCTOR = "4th Doctor"
    FIFTH_DOCTOR = "5th Doctor"
    SIXTH_DOCTOR = "6th Doctor"
    SEVENTH_DOCTOR = "7th Doctor"
    EIGHTH_DOCTOR = "8th Doctor"

    # Modern Era Doctors
    NINTH_DOCTOR = "9th Doctor"
    TENTH_DOCTOR = "10th Doctor"
    ELEVENTH_DOCTOR = "11th Doctor"
    TWELFTH_DOCTOR = "12th Doctor"
    THIRTEENTH_DOCTOR = "13th Doctor"
    FOURTEENTH_DOCTOR = "14th Doctor"
    FIFTEENTH_DOCTOR = "15th Doctor"

    # Special Doctors
    WAR_DOCTOR = "War Doctor"
    FUGITIVE_DOCTOR = "Fugitive Doctor"
    CURATOR = "Curator"
    UNBOUND_DOCTOR = "Unbound Doctor"

    # Spin-offs & Companions
    TORCHWOOD = "Torchwood and Captain Jack"
    SARAH_JANE_SMITH = "Sarah Jane Smith"
    CLASS = "Class"
    K9 = "K-9"
    UNIT = "UNIT"

    # Villains & Monsters
    DALEK_EMPIRE = "Dalek Empire & I, Davros"
    CYBERMEN = "Cybermen"
    THE_MASTER = "The Master"
    WAR_MASTER = "War Master"
    MISSY = "Missy"

    # Special Collections
    TIME_LORD_VICTORIOUS = "Time Lord Victorious Chronology"
    TALES_FROM_NEW_EARTH = "Tales from New Earth"
    DOCUMENTARIES = "Documentaries"


class SectionCategory(Enum):
    """Section categories for organizational grouping."""

    CLASSIC_ERA_DOCTORS = "Classic Era Doctors"
    MODERN_ERA_DOCTORS = "Modern Era Doctors"
    SPECIAL_DOCTORS = "Special Doctors"
    SPINOFFS_COMPANIONS = "Spin-offs & Companions"
    VILLAINS_MONSTERS = "Villains & Monsters"
    SPECIAL_COLLECTIONS = "Special Collections"


# Section categorization mapping
SECTION_CATEGORIES = {
    SectionCategory.CLASSIC_ERA_DOCTORS: [
        SectionName.FIRST_DOCTOR,
        SectionName.SECOND_DOCTOR,
        SectionName.THIRD_DOCTOR,
        SectionName.FOURTH_DOCTOR,
        SectionName.FIFTH_DOCTOR,
        SectionName.SIXTH_DOCTOR,
        SectionName.SEVENTH_DOCTOR,
        SectionName.EIGHTH_DOCTOR,
    ],
    SectionCategory.MODERN_ERA_DOCTORS: [
        SectionName.NINTH_DOCTOR,
        SectionName.TENTH_DOCTOR,
        SectionName.ELEVENTH_DOCTOR,
        SectionName.TWELFTH_DOCTOR,
        SectionName.THIRTEENTH_DOCTOR,
        SectionName.FOURTEENTH_DOCTOR,
        SectionName.FIFTEENTH_DOCTOR,
    ],
    SectionCategory.SPECIAL_DOCTORS: [
        SectionName.WAR_DOCTOR,
        SectionName.FUGITIVE_DOCTOR,
        SectionName.CURATOR,
        SectionName.UNBOUND_DOCTOR,
    ],
    SectionCategory.SPINOFFS_COMPANIONS: [
        SectionName.TORCHWOOD,
        SectionName.SARAH_JANE_SMITH,
        SectionName.CLASS,
        SectionName.K9,
        SectionName.UNIT,
    ],
    SectionCategory.VILLAINS_MONSTERS: [
        SectionName.DALEK_EMPIRE,
        SectionName.CYBERMEN,
        SectionName.THE_MASTER,
        SectionName.WAR_MASTER,
        SectionName.MISSY,
    ],
    SectionCategory.SPECIAL_COLLECTIONS: [
        SectionName.TIME_LORD_VICTORIOUS,
        SectionName.TALES_FROM_NEW_EARTH,
        SectionName.DOCUMENTARIES,
    ],
}


def get_all_section_names() -> list[str]:
    """Get all approved section names as strings."""
    return [section.value for section in SectionName]


def get_section_names_by_category(category: SectionCategory) -> list[str]:
    """Get section names for a specific category."""
    return [section.value for section in SECTION_CATEGORIES[category]]


def is_valid_section_name(section_name: str) -> bool:
    """Check if a section name is in the approved list."""
    return section_name in get_all_section_names()


def get_section_category(section_name: str) -> SectionCategory | None:
    """Get the category for a given section name."""
    for category, sections in SECTION_CATEGORIES.items():
        if any(section.value == section_name for section in sections):
            return category
    return None


def validate_section_name(section_name: str) -> str:
    """
    Validate and return a section name.

    Raises:
        ValueError: If the section name is not in the approved list.
    """
    if not is_valid_section_name(section_name):
        approved_names = get_all_section_names()
        raise ValueError(
            f"Invalid section name: '{section_name}'. "
            f"Must be one of: {', '.join(approved_names)}"
        )
    return section_name


# For backward compatibility with string-based validation
APPROVED_SECTION_NAMES: set[str] = set(get_all_section_names())
