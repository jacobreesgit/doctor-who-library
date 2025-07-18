#!/usr/bin/env python3
"""
Test script for section validation functionality.
Tests the backend section validation infrastructure.
"""

import asyncio
import sys
import os

# Add the src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from doctor_who_library.domain.value_objects.section_name import (
    SectionName,
    get_all_section_names,
    is_valid_section_name,
    validate_section_name,
)
from doctor_who_library.domain.services.section_validation_service import SectionValidationService
from doctor_who_library.application.services.library_service import LibraryService


async def test_section_validation():
    """Test section validation functionality."""
    print("=== Testing Section Validation ===\n")
    
    # Test 1: Basic enum functionality
    print("1. Testing SectionName enum:")
    section_names = get_all_section_names()
    print(f"   Total approved sections: {len(section_names)}")
    print(f"   First 5 sections: {section_names[:5]}")
    print(f"   Last 5 sections: {section_names[-5:]}")
    print()
    
    # Test 2: Valid section name validation
    print("2. Testing valid section names:")
    valid_sections = ["1st Doctor", "9th Doctor", "Torchwood and Captain Jack", "Dalek Empire & I, Davros"]
    for section in valid_sections:
        is_valid = is_valid_section_name(section)
        print(f"   '{section}': {'✓' if is_valid else '✗'}")
    print()
    
    # Test 3: Invalid section name validation
    print("3. Testing invalid section names:")
    invalid_sections = ["First Doctor", "9th Doctor Who", "Torchwood", "Random Section"]
    for section in invalid_sections:
        is_valid = is_valid_section_name(section)
        print(f"   '{section}': {'✓' if is_valid else '✗'}")
    print()
    
    # Test 4: Section validation service
    print("4. Testing SectionValidationService:")
    validator = SectionValidationService()
    
    # Test valid section
    try:
        validated = validator.validate_section_name("1st Doctor")
        print(f"   Valid section '1st Doctor': ✓ -> '{validated}'")
    except ValueError as e:
        print(f"   Valid section '1st Doctor': ✗ -> {e}")
    
    # Test invalid section
    try:
        validated = validator.validate_section_name("First Doctor")
        print(f"   Invalid section 'First Doctor': ✗ -> '{validated}'")
    except ValueError as e:
        print(f"   Invalid section 'First Doctor': ✓ -> {e}")
    
    # Test suggestions
    suggestions = validator.find_similar_section_names("Doctor")
    print(f"   Suggestions for 'Doctor': {suggestions[:3]}")
    print()
    
    # Test 5: Library service integration
    print("5. Testing LibraryService section validation:")
    library_service = LibraryService()
    
    # Test valid section
    try:
        validated = await library_service.validate_section_name("1st Doctor")
        print(f"   Valid section '1st Doctor': ✓ -> '{validated}'")
    except Exception as e:
        print(f"   Valid section '1st Doctor': ✗ -> {e}")
    
    # Test invalid section
    try:
        validated = await library_service.validate_section_name("First Doctor")
        print(f"   Invalid section 'First Doctor': ✗ -> '{validated}'")
    except Exception as e:
        print(f"   Invalid section 'First Doctor': ✓ -> {e}")
    
    # Test get approved sections
    try:
        approved = await library_service.get_approved_section_names()
        print(f"   Approved sections count: {len(approved)}")
        print(f"   First 3 approved: {approved[:3]}")
    except Exception as e:
        print(f"   Error getting approved sections: {e}")
    
    print("\n=== Section Validation Tests Complete ===")


if __name__ == "__main__":
    asyncio.run(test_section_validation())