/**
 * Section utilities for Doctor Who Library
 * Centralized logic for section validation and emoji mapping
 */

import { ALL_APPROVED_SECTIONS } from '../constants/sections';

/**
 * Check if a section name is in the approved list
 */
export const isValidSection = (section: string): boolean => {
  return (ALL_APPROVED_SECTIONS as readonly string[]).includes(section);
};

/**
 * Get emoji for a section name
 * Centralized mapping following naming conventions
 */
export const getSectionEmoji = (section: string): string => {
  if (!section) return '📚';
  
  // Classic Era Doctors
  if (section.includes('1st')) return '👴';
  if (section.includes('2nd')) return '🎭';
  if (section.includes('3rd')) return '🥋';
  if (section.includes('4th')) return '🧣';
  if (section.includes('5th')) return '🏏';
  if (section.includes('6th')) return '🌈';
  if (section.includes('7th')) return '🎩';
  if (section.includes('8th')) return '💫';
  
  // Modern Era Doctors
  if (section.includes('9th')) return '👂';
  if (section.includes('10th')) return '🕺';
  if (section.includes('11th')) return '🎀';
  if (section.includes('12th')) return '🎸';
  if (section.includes('13th')) return '👥';
  if (section.includes('14th')) return '🔄';
  if (section.includes('15th')) return '✨';
  
  // Special Doctors
  if (section.includes('War Doctor')) return '⚔️';
  if (section.includes('Fugitive Doctor')) return '🏃‍♀️';
  if (section.includes('Curator')) return '🖼️';
  if (section.includes('Unbound')) return '🔗';
  
  // Spin-offs & Companions
  if (section.includes('Torchwood')) return '🚀';
  if (section.includes('Sarah Jane')) return '👩‍🔬';
  if (section.includes('Class')) return '🎓';
  if (section.includes('K-9')) return '🐕';
  if (section.includes('UNIT')) return '🛡️';
  
  // Villains & Monsters
  if (section.includes('Dalek')) return '🔵';
  if (section.includes('Cybermen')) return '🤖';
  if (section.includes('Master')) return '👹';
  if (section.includes('Missy')) return '👸';
  
  // Special Collections
  if (section.includes('Time Lord Victorious')) return '⏰';
  if (section.includes('Tales from New Earth')) return '🌍';
  if (section.includes('Documentaries')) return '📺';
  
  // Default
  return '📚';
};

/**
 * Get URL-safe version of section name
 */
export const getSectionSlug = (section: string): string => {
  return encodeURIComponent(section);
};

/**
 * Get human-readable category name for a section
 */
export const getSectionCategory = (section: string): string => {
  if (['1st Doctor', '2nd Doctor', '3rd Doctor', '4th Doctor', '5th Doctor', '6th Doctor', '7th Doctor', '8th Doctor'].includes(section)) {
    return 'Classic Era Doctors';
  }
  if (['9th Doctor', '10th Doctor', '11th Doctor', '12th Doctor', '13th Doctor', '14th Doctor', '15th Doctor'].includes(section)) {
    return 'Modern Era Doctors';
  }
  if (['War Doctor', 'Fugitive Doctor', 'Curator', 'Unbound Doctor'].includes(section)) {
    return 'Special Doctors';
  }
  if (['Torchwood and Captain Jack', 'Sarah Jane Smith', 'Class', 'K-9', 'UNIT'].includes(section)) {
    return 'Spin-offs & Companions';
  }
  if (['Dalek Empire & I, Davros', 'Cybermen', 'The Master', 'War Master', 'Missy'].includes(section)) {
    return 'Villains & Monsters';
  }
  if (['Time Lord Victorious Chronology', 'Tales from New Earth', 'Documentaries'].includes(section)) {
    return 'Special Collections';
  }
  return 'Other Collections';
};

/**
 * Validate and normalize section name
 */
export const normalizeSectionName = (section: string): string | null => {
  if (!section) return null;
  
  const trimmed = section.trim();
  if (isValidSection(trimmed)) {
    return trimmed;
  }
  
  // Could add fuzzy matching here if needed
  return null;
};