# Doctor Who Library - Naming Conventions

This document outlines the standardized naming conventions for the Doctor Who Library project to ensure consistency across Excel sheets, database entries, and API responses.

## Table of Contents

- [Section Names](#section-names)
- [Story Titles](#story-titles)
- [Serial Titles](#serial-titles)
- [Excel Sheet Structure](#excel-sheet-structure)
- [Database Field Mapping](#database-field-mapping)
- [Special Cases](#special-cases)

## Section Names

Section names represent the organizational structure of the Doctor Who universe, typically grouped by Doctor, era, or theme.

### Doctor Sections

**Classic Era Doctors:**
- `1st Doctor`
- `2nd Doctor`
- `3rd Doctor`
- `4th Doctor`
- `5th Doctor`
- `6th Doctor`
- `7th Doctor`
- `8th Doctor`

**Modern Era Doctors:**
- `9th Doctor`
- `10th Doctor`
- `11th Doctor`
- `12th Doctor`
- `13th Doctor`
- `14th Doctor`
- `15th Doctor`

**Special Doctors:**
- `War Doctor`
- `Fugitive Doctor`
- `Curator`
- `Unbound Doctor`

### Spin-off Sections

**Companion-focused:**
- `Torchwood and Captain Jack`
- `Sarah Jane Smith`
- `Class`
- `K-9`
- `UNIT`

**Villain-focused:**
- `Dalek Empire & I, Davros`
- `Cybermen`
- `The Master`
- `War Master`
- `Missy`

### Special Collections

**Themed Collections:**
- `Time Lord Victorious Chronology`
- `Tales from New Earth`
- `Documentaries`

## Story Titles

Story titles should follow these conventions:

### Format Rules

1. **Use official titles** from BBC/Big Finish/etc.
2. **Include subtitle** if part of official title (e.g., "The Stolen Earth")
3. **Use quotation marks** for individual episode titles within serials
4. **No abbreviations** unless part of official title

### Examples

**TV Stories:**
- `An Unearthly Child`
- `The Daleks`
- `The War Games`
- `Rose`
- `The Parting of the Ways`

**Audio Stories:**
- `Storm Warning`
- `The Chimes of Midnight`
- `Spare Parts`
- `Jubilee`

**Comic Stories:**
- `The Iron Legion`
- `City of the Damned`
- `The Flood`

## Serial Titles

Serial titles are used for multi-part stories, particularly classic TV serials.

### Format Rules

1. **Use official serial title** (not episode titles)
2. **Include "The" prefix** if part of official title
3. **Use episode numbers** in brackets for individual episodes
4. **Consistent capitalization** following title case

### Examples

**Classic TV Serials:**
- `The Daleks` (not "The Dead Planet")
- `The Keys of Marinus`
- `The Aztecs`
- `The War Games`

**Modern Multi-parters:**
- `The End of Time`
- `The Pandorica Opens / The Big Bang`
- `Dark Water / Death in Heaven`

## Excel Sheet Structure

### Required Columns

The Excel chronology sheet must include these columns with exact header names:

| Column Name | Description | Example |
|-------------|-------------|---------|
| `section_name` | Section categorization | `4th Doctor` |
| `story_title` | Main story title | `Genesis of the Daleks` |
| `episode_title` | Individual episode title | `Part One` |
| `serial_title` | Multi-part story title | `Genesis of the Daleks` |
| `content_type` | Media type | `TV`, `Audio`, `Comic` |
| `format` | Specific format | `TV Serial`, `Big Finish Audio` |
| `doctor` | Doctor actor name | `Tom Baker` |
| `companions` | Companion names | `Sarah Jane Smith, Harry Sullivan` |
| `story_number` | Production code | `4H` |
| `series` | Series/season number | `12` |
| `broadcast_date` | Original air date | `1975-03-08` |
| `duration` | Runtime in minutes | `25` |

### Optional Columns

| Column Name | Description | Example |
|-------------|-------------|---------|
| `writer` | Story writer(s) | `Terry Nation` |
| `director` | Story director | `David Maloney` |
| `producer` | Story producer | `Philip Hinchcliffe` |
| `release_date` | Physical release date | `2006-05-01` |
| `cover_date` | Magazine cover date | `2023-03` |
| `group_name` | Sub-grouping within section | `Season 12` |

## Database Field Mapping

### Core Fields

- `title` → Primary display title (usually `story_title`)
- `story_title` → Main story identifier
- `episode_title` → Individual episode name
- `serial_title` → Multi-part story identifier
- `section_name` → Organizational category
- `content_type` → Media classification
- `format` → Specific format description

### Personnel Fields

- `doctor` → Lead actor name
- `companions` → Supporting character names (comma-separated)
- `writer` → Story writer(s)
- `director` → Story director
- `producer` → Story producer

### Production Fields

- `story_number` → Production code
- `series` → Series/season number
- `broadcast_date` → Original air/release date
- `duration` → Runtime in minutes

### Enrichment Fields

- `wiki_url` → TARDIS Wiki page URL
- `wiki_summary` → Wiki-sourced synopsis
- `wiki_image_url` → Featured image URL
- `enrichment_status` → `pending`, `enriched`, `failed`, `skipped`
- `enrichment_confidence` → Quality score (0-100)

## Special Cases

### Multi-Doctor Stories

Use the primary Doctor's section:
- `The Three Doctors` → `3rd Doctor`
- `The Five Doctors` → `5th Doctor`
- `The Day of the Doctor` → `11th Doctor`

### Crossover Stories

Use the primary character's section:
- `School Reunion` → `10th Doctor` (not Sarah Jane Smith)
- `The Stolen Earth` → `10th Doctor` (not Torchwood)

### Regeneration Stories

Use the outgoing Doctor's section:
- `The Parting of the Ways` → `9th Doctor`
- `The End of Time` → `10th Doctor`

### Anthology Series

Use specific character sections when possible:
- `The Sarah Jane Adventures` → `Sarah Jane Smith`
- `Torchwood` → `Torchwood and Captain Jack`
- `Class` → `Class`

### Unbound/Alternative Universe

Use dedicated sections:
- `Unbound` stories → `Unbound Doctor`
- `Full Fathom Five` → `Unbound Doctor`

### War Doctor Stories

Use dedicated section:
- `Only the Monstrous` → `War Doctor`
- `The Day of the Doctor` → `11th Doctor` (primary Doctor)

## Validation Rules

### Section Names
- Must match predefined list exactly
- No custom sections without approval
- Case-sensitive matching

### Story Titles
- No trailing/leading whitespace
- No special characters except official punctuation
- Maximum 200 characters

### Date Formats
- Use ISO 8601 format: `YYYY-MM-DD`
- Use `YYYY-MM` for month-only dates
- Use `YYYY` for year-only dates

### Duration
- Always in minutes
- Use integers only
- TV episodes typically 25-45 minutes
- Audio dramas typically 60-120 minutes

## Migration Guidelines

When updating existing data:

1. **Backup first** - Always export current data before changes
2. **Test small batches** - Update 10-20 entries first
3. **Verify enrichment** - Check that TARDIS Wiki links still work
4. **Update progressively** - Section by section updates
5. **Monitor performance** - Watch for API slowdowns during updates

## Quality Assurance

### Required Checks

Before importing new data:
- [ ] All section names match predefined list
- [ ] No duplicate story entries within same section
- [ ] Date formats are consistent
- [ ] Duration values are reasonable
- [ ] Required fields are populated

### Automated Validation

The system performs these checks:
- Section name validation against approved list
- Date format validation
- Duration range validation (5-300 minutes)
- Duplicate detection within sections
- Required field validation

## Support

For questions about naming conventions:
- Check existing data for similar cases
- Consult TARDIS Wiki for official titles
- Follow BBC/Big Finish official naming
- Ask for clarification on edge cases

## Changelog

**v1.0.0** (2025-01-17)
- Initial naming conventions documentation
- Established section naming standards
- Defined story title formats
- Created Excel sheet structure
- Added validation rules