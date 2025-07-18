/**
 * API Documentation Page Component
 * 
 * Comprehensive documentation for the Doctor Who Library API
 * Features:
 * - Complete API endpoint documentation
 * - Section naming conventions reference
 * - Interactive examples
 * - Data model specifications
 * - Authentication and usage guidelines
 * - Error handling documentation
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  CodeBracketIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { APPROVED_SECTIONS } from '../constants/sections';

const ApiDocumentationPage: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const CodeBlock: React.FC<{ code: string; language?: string }> = ({ code, language = 'javascript' }) => (
    <div className="relative">
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <button
        onClick={() => copyToClipboard(code)}
        className="absolute top-2 right-2 p-2 text-gray-400 hover:text-white transition-colors"
        title="Copy to clipboard"
      >
        <ClipboardDocumentIcon className="h-4 w-4" />
      </button>
    </div>
  );

  const SectionHeader: React.FC<{ id: string; title: string; icon: React.ComponentType<any> }> = ({ id, title, icon: Icon }) => (
    <div
      className="flex items-center space-x-3 cursor-pointer py-2 hover:bg-gray-50 rounded-lg px-2"
      onClick={() => toggleSection(id)}
    >
      {expandedSections.has(id) ? (
        <ChevronDownIcon className="h-4 w-4 text-gray-500" />
      ) : (
        <ChevronRightIcon className="h-4 w-4 text-gray-500" />
      )}
      <Icon className="h-5 w-5 text-blue-600" />
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
  );

  const EndpointCard: React.FC<{ method: string; endpoint: string; description: string; example?: string; response?: string }> = ({ method, endpoint, description, example, response }) => (
    <div className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex items-center space-x-3 mb-3">
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          method === 'GET' ? 'bg-green-100 text-green-800' :
          method === 'POST' ? 'bg-blue-100 text-blue-800' :
          method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {method}
        </span>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{endpoint}</code>
      </div>
      <p className="text-gray-700 mb-3">{description}</p>
      {example && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Example Request:</h4>
          <CodeBlock code={example} />
        </div>
      )}
      {response && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Example Response:</h4>
          <CodeBlock code={response} language="json" />
        </div>
      )}
    </div>
  );

  const allSections = Object.values(APPROVED_SECTIONS).flat();

  return (
    <div className="api-documentation-page max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center py-8">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <CodeBracketIcon className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">API Documentation</h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Complete documentation for the Doctor Who Library API, including endpoints, data models, and naming conventions.
        </p>
      </div>

      {/* Quick Links */}
      <div className="bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="#endpoints" className="flex items-center space-x-2 text-blue-700 hover:text-blue-800">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>API Endpoints</span>
          </a>
          <a href="#naming" className="flex items-center space-x-2 text-blue-700 hover:text-blue-800">
            <ArrowTopRightOnSquareIcon className="h-4 w-4" />
            <span>Naming Conventions</span>
          </a>
        </div>
      </div>

      {/* API Overview */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <SectionHeader id="overview" title="API Overview" icon={InformationCircleIcon} />
          {expandedSections.has('overview') && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Base URL</h3>
                  <code className="text-sm bg-white px-2 py-1 rounded border">http://localhost:8000/api</code>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Content Type</h3>
                  <code className="text-sm bg-white px-2 py-1 rounded border">application/json</code>
                </div>
              </div>
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-center space-x-2">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">Authentication</h3>
                </div>
                <p className="text-yellow-700 mt-2">
                  Currently, the API does not require authentication. All endpoints are publicly accessible.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* API Endpoints */}
      <div className="bg-white rounded-lg border" id="endpoints">
        <div className="p-6">
          <SectionHeader id="endpoints" title="API Endpoints" icon={CodeBracketIcon} />
          {expandedSections.has('endpoints') && (
            <div className="mt-6 space-y-6">
              {/* Library Items */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Library Items</h3>
                <div className="space-y-4">
                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/items"
                    description="Get paginated library items with optional filtering by section, group, or enrichment status."
                    example={`// Get first 20 items
fetch('/api/library/items?limit=20&offset=0')

// Filter by section
fetch('/api/library/items?section=1st Doctor')

// Filter by enrichment status
fetch('/api/library/items?enrichment_status=enriched')`}
                    response={`{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "An Unearthly Child",
      "section_name": "1st Doctor",
      "enrichment_status": "enriched",
      "enrichment_confidence": 0.95,
      "wiki_url": "https://tardis.fandom.com/wiki/An_Unearthly_Child",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 1842,
  "page": 1,
  "size": 20,
  "pages": 93
}`}
                  />

                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/items/{item_id}"
                    description="Get a specific library item by its UUID."
                    example={`fetch('/api/library/items/123e4567-e89b-12d3-a456-426614174000')`}
                    response={`{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "title": "An Unearthly Child",
  "story_title": "An Unearthly Child",
  "episode_title": "An Unearthly Child (1)",
  "section_name": "1st Doctor",
  "doctor": "First Doctor",
  "companions": "Susan, Ian, Barbara",
  "writer": "Anthony Coburn",
  "director": "Waris Hussein",
  "enrichment_status": "enriched",
  "enrichment_confidence": 0.95,
  "wiki_url": "https://tardis.fandom.com/wiki/An_Unearthly_Child",
  "wiki_summary": "The very first Doctor Who story...",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}`}
                  />

                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/search"
                    description="Search library items by query string."
                    example={`fetch('/api/library/search?q=dalek&limit=10')`}
                    response={`[
  {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "title": "The Daleks",
    "section_name": "1st Doctor",
    "enrichment_status": "enriched"
  }
]`}
                  />
                </div>
              </div>

              {/* Sections */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sections</h3>
                <div className="space-y-4">
                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/sections"
                    description="Get all approved section names. Returns only the canonical section names defined in naming conventions."
                    example={`fetch('/api/library/sections')`}
                    response={`[
  "1st Doctor",
  "2nd Doctor",
  "3rd Doctor",
  "4th Doctor",
  "5th Doctor",
  "6th Doctor",
  "7th Doctor",
  "8th Doctor",
  "9th Doctor",
  "10th Doctor",
  "11th Doctor",
  "12th Doctor",
  "13th Doctor",
  "14th Doctor",
  "15th Doctor",
  "War Doctor",
  "Fugitive Doctor",
  "Curator",
  "Unbound Doctor",
  "Torchwood and Captain Jack",
  "Sarah Jane Smith",
  "Class",
  "K-9",
  "UNIT",
  "Dalek Empire & I, Davros",
  "Cybermen",
  "The Master",
  "War Master",
  "Missy",
  "Time Lord Victorious Chronology",
  "Tales from New Earth",
  "Documentaries"
]`}
                  />

                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/sections/validate/{section_name}"
                    description="Validate a section name against the approved list."
                    example={`fetch('/api/library/sections/validate/1st Doctor')

// Invalid section example
fetch('/api/library/sections/validate/First Doctor')`}
                    response={`// Valid section
{
  "valid": true,
  "section_name": "1st Doctor",
  "message": "Section name is valid"
}

// Invalid section
{
  "valid": false,
  "section_name": "First Doctor",
  "message": "Invalid section name: 'First Doctor'. Must be one of the approved section names."
}`}
                  />
                </div>
              </div>

              {/* Statistics */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
                <div className="space-y-4">
                  <EndpointCard
                    method="GET"
                    endpoint="/api/library/stats"
                    description="Get library statistics including total items, sections, and enrichment status breakdown."
                    example={`fetch('/api/library/stats')`}
                    response={`{
  "total_items": 1842,
  "total_sections": 33,
  "total_groups": 156,
  "enrichment_stats": {
    "pending": 234,
    "enriched": 1456,
    "failed": 89,
    "skipped": 63
  },
  "note": "Doctor Who Library contains 1842 items"
}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Naming Conventions */}
      <div className="bg-white rounded-lg border" id="naming">
        <div className="p-6">
          <SectionHeader id="naming" title="Naming Conventions" icon={BookOpenIcon} />
          {expandedSections.has('naming') && (
            <div className="mt-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-800">Comprehensive Naming Standards</h3>
                </div>
                <p className="text-blue-700 mt-2">
                  Complete documentation for all naming conventions including sections, stories, serials, Excel structure, and database mapping.
                </p>
              </div>

              {/* Table of Contents */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Documentation Sections</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <a href="#section-names" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Section Names</span>
                  </a>
                  <a href="#story-titles" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Story Titles</span>
                  </a>
                  <a href="#serial-titles" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Serial Titles</span>
                  </a>
                  <a href="#excel-structure" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Excel Sheet Structure</span>
                  </a>
                  <a href="#database-mapping" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Database Field Mapping</span>
                  </a>
                  <a href="#special-cases" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 py-1">
                    <span>→</span>
                    <span>Special Cases</span>
                  </a>
                </div>
              </div>

              {/* Section Names */}
              <div id="section-names">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Section Names</h3>
                <p className="text-gray-600 mb-4">
                  Section names represent the organizational structure of the Doctor Who universe, typically grouped by Doctor, era, or theme.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Classic Era Doctors</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.CLASSIC_DOCTORS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Modern Era Doctors</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.MODERN_DOCTORS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Special Doctors</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.SPECIAL_DOCTORS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Spin-offs & Companions</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.SPINOFFS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Villains & Monsters</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.VILLAINS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Special Collections</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {APPROVED_SECTIONS.SPECIAL_COLLECTIONS.map(section => (
                        <code key={section} className="text-sm bg-gray-100 px-2 py-1 rounded">{section}</code>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Story Titles */}
              <div id="story-titles">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Story Titles</h3>
                <p className="text-gray-600 mb-4">
                  Story titles should follow official naming conventions from BBC, Big Finish, and other licensed sources.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Format Rules</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Use official titles from BBC/Big Finish/etc.</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Include subtitle if part of official title</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Use quotation marks for individual episode titles within serials</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">No abbreviations unless part of official title</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">TV Stories</h5>
                        <div className="space-y-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">An Unearthly Child</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Daleks</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">Rose</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Parting of the Ways</code>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">Audio Stories</h5>
                        <div className="space-y-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">Storm Warning</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Chimes of Midnight</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">Spare Parts</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Serial Titles */}
              <div id="serial-titles">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Serial Titles</h3>
                <p className="text-gray-600 mb-4">
                  Serial titles are used for multi-part stories, particularly classic TV serials.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Format Rules</h4>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Use official serial title (not episode titles)</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Include "The" prefix if part of official title</span>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5" />
                        <span className="text-sm text-gray-700">Use episode numbers in brackets for individual episodes</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Examples</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">Classic TV Serials</h5>
                        <div className="space-y-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Daleks</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Keys of Marinus</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The War Games</code>
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-800 mb-1">Modern Multi-parters</h5>
                        <div className="space-y-1">
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The End of Time</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">The Pandorica Opens / The Big Bang</code>
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded block">Dark Water / Death in Heaven</code>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Excel Sheet Structure */}
              <div id="excel-structure">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Excel Sheet Structure</h3>
                <p className="text-gray-600 mb-4">
                  The Excel chronology sheet must include specific columns with exact header names for proper data import.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Required Columns</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Column Name</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Description</th>
                            <th className="border border-gray-300 px-3 py-2 text-left text-sm font-medium">Example</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2"><code className="text-sm bg-gray-100 px-1 rounded">section_name</code></td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Section categorization</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">4th Doctor</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2"><code className="text-sm bg-gray-100 px-1 rounded">story_title</code></td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Main story title</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Genesis of the Daleks</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2"><code className="text-sm bg-gray-100 px-1 rounded">content_type</code></td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Media type</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">TV, Audio, Comic</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2"><code className="text-sm bg-gray-100 px-1 rounded">doctor</code></td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Doctor actor name</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Tom Baker</td>
                          </tr>
                          <tr>
                            <td className="border border-gray-300 px-3 py-2"><code className="text-sm bg-gray-100 px-1 rounded">broadcast_date</code></td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">Original air date</td>
                            <td className="border border-gray-300 px-3 py-2 text-sm">1975-03-08</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Field Mapping */}
              <div id="database-mapping">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Field Mapping</h3>
                <p className="text-gray-600 mb-4">
                  How Excel columns map to database fields and API responses.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Core Fields</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-blue-100 px-2 py-1 rounded">title</code>
                        <span className="text-sm text-gray-600">→ Primary display title (usually story_title)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-blue-100 px-2 py-1 rounded">section_name</code>
                        <span className="text-sm text-gray-600">→ Organizational category</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-blue-100 px-2 py-1 rounded">content_type</code>
                        <span className="text-sm text-gray-600">→ Media classification</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Enrichment Fields</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-green-100 px-2 py-1 rounded">wiki_url</code>
                        <span className="text-sm text-gray-600">→ TARDIS Wiki page URL</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-green-100 px-2 py-1 rounded">enrichment_status</code>
                        <span className="text-sm text-gray-600">→ pending, enriched, failed, skipped</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-green-100 px-2 py-1 rounded">enrichment_confidence</code>
                        <span className="text-sm text-gray-600">→ Quality score (0-1)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Cases */}
              <div id="special-cases">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Cases</h3>
                <p className="text-gray-600 mb-4">
                  Handling edge cases and complex scenarios in the Doctor Who universe.
                </p>
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Multi-Doctor Stories</h4>
                    <p className="text-sm text-gray-600 mb-2">Use the primary Doctor's section:</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">The Three Doctors</code>
                        <span className="text-sm text-gray-600">→ 3rd Doctor</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">The Day of the Doctor</code>
                        <span className="text-sm text-gray-600">→ 11th Doctor</span>
                      </div>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Regeneration Stories</h4>
                    <p className="text-sm text-gray-600 mb-2">Use the outgoing Doctor's section:</p>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">The Parting of the Ways</code>
                        <span className="text-sm text-gray-600">→ 9th Doctor</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">The End of Time</code>
                        <span className="text-sm text-gray-600">→ 10th Doctor</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation Rules */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Validation Rules</h3>
                <div className="space-y-2">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-gray-900 font-medium">Section names must match approved list exactly</p>
                      <p className="text-gray-600 text-sm">Case-sensitive matching, no custom sections without approval</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-gray-900 font-medium">Use ISO 8601 date format</p>
                      <p className="text-gray-600 text-sm">YYYY-MM-DD for full dates, YYYY-MM for month-only</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                    <div>
                      <p className="text-gray-900 font-medium">Duration must be in minutes</p>
                      <p className="text-gray-600 text-sm">Integer values only, typically 25-45 for TV, 60-120 for audio</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>


      {/* Error Handling */}
      <div className="bg-white rounded-lg border">
        <div className="p-6">
          <SectionHeader id="errors" title="Error Handling" icon={ExclamationTriangleIcon} />
          {expandedSections.has('errors') && (
            <div className="mt-6 space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status Code</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Error Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">400</td>
                      <td className="px-4 py-2 text-sm text-gray-900">Bad Request</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Invalid section name or malformed request</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">404</td>
                      <td className="px-4 py-2 text-sm text-gray-900">Not Found</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Item ID not found</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 text-sm text-gray-900">500</td>
                      <td className="px-4 py-2 text-sm text-gray-900">Internal Server Error</td>
                      <td className="px-4 py-2 text-sm text-gray-600">Server error or database issue</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8">
        <p className="text-gray-600">
          For more information, see the{' '}
          <Link to="/collections" className="text-blue-600 hover:text-blue-700">
            NAMING_CONVENTIONS.md
          </Link>{' '}
          file or explore the{' '}
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700"
          >
            Interactive API Documentation
          </a>
        </p>
      </div>
    </div>
  );
};

export default ApiDocumentationPage;