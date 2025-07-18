/**
 * Approved section names for Doctor Who Library
 * These must match exactly with the backend database section names
 * and the standards defined in NAMING_CONVENTIONS.md
 */

export const APPROVED_SECTIONS = {
  CLASSIC_DOCTORS: [
    '1st Doctor',
    '2nd Doctor', 
    '3rd Doctor',
    '4th Doctor',
    '5th Doctor',
    '6th Doctor',
    '7th Doctor',
    '8th Doctor'
  ],
  MODERN_DOCTORS: [
    '9th Doctor',
    '10th Doctor',
    '11th Doctor', 
    '12th Doctor',
    '13th Doctor',
    '14th Doctor',
    '15th Doctor'
  ],
  SPECIAL_DOCTORS: [
    'War Doctor',
    'Fugitive Doctor',
    'Curator',
    'Unbound Doctor'
  ],
  SPINOFFS: [
    'Torchwood and Captain Jack',
    'Sarah Jane Smith',
    'Class',
    'K-9',
    'UNIT'
  ],
  VILLAINS: [
    'Dalek Empire & I, Davros',
    'Cybermen',
    'The Master',
    'War Master',
    'Missy'
  ],
  SPECIAL_COLLECTIONS: [
    'Time Lord Victorious Chronology',
    'Tales from New Earth',
    'Documentaries'
  ]
} as const;

/**
 * Flattened array of all approved section names
 * Useful for validation and iteration
 */
export const ALL_APPROVED_SECTIONS = Object.values(APPROVED_SECTIONS).flat();

/**
 * Section categories for organizational grouping
 */
export const SECTION_CATEGORIES = {
  'Classic Era Doctors': APPROVED_SECTIONS.CLASSIC_DOCTORS,
  'Modern Era Doctors': APPROVED_SECTIONS.MODERN_DOCTORS,
  'Special Doctors': APPROVED_SECTIONS.SPECIAL_DOCTORS,
  'Spin-offs & Companions': APPROVED_SECTIONS.SPINOFFS,
  'Villains & Monsters': APPROVED_SECTIONS.VILLAINS,
  'Special Collections': APPROVED_SECTIONS.SPECIAL_COLLECTIONS
} as const;