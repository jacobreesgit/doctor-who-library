/**
 * Content card component with visual hierarchy for enriched vs non-enriched content
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  StarIcon, 
  ClockIcon, 
  PhotoIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { LibraryItem } from '../types/api';
import { getSectionEmoji } from '../utils/sections';

interface ContentCardProps {
  item: LibraryItem;
  variant?: 'default' | 'compact' | 'list';
  showEnrichmentStatus?: boolean;
  className?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  item,
  variant = 'default',
  showEnrichmentStatus = false,
  className = ''
}) => {
  const isEnriched = item.enrichment_status === 'enriched';
  const confidencePercentage = Math.round((item.enrichment_confidence || 0) * 100);

  const getEnrichmentStatusColor = () => {
    if (item.enrichment_status === 'enriched') return 'bg-green-100 text-green-800';
    if (item.enrichment_status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (item.enrichment_status === 'failed') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getEnrichmentStatusIcon = () => {
    if (item.enrichment_status === 'enriched') return <StarSolidIcon className="h-4 w-4" />;
    if (item.enrichment_status === 'pending') return <ClockIcon className="h-4 w-4" />;
    return <StarIcon className="h-4 w-4" />;
  };

  const getContentTypeDisplay = () => {
    // Determine the primary content type
    const contentType = item.content_type || 'Unknown';
    
    // Check if this is a section (created in LandingPage for navigation)
    if (contentType === 'Section') {
      return {
        type: 'Section',
        hierarchy: null,
        badge: 'bg-purple-100 text-purple-800'
      };
    }
    
    // Check if this is a serial (has serial_title and it's different from title)
    if (item.serial_title && item.serial_title !== item.title && item.serial_title.trim() !== '') {
      return {
        type: 'Serial',
        hierarchy: `${item.story_title || item.serial_title} • ${item.section_name || 'Unknown Section'}`,
        badge: 'bg-blue-100 text-blue-800'
      };
    }
    
    // This is a regular story - show section it belongs to
    return {
      type: 'Story',
      hierarchy: item.section_name || null,
      badge: 'bg-green-100 text-green-800'
    };
  };

  const contentTypeInfo = getContentTypeDisplay();

  const cardClasses = `
    group relative bg-white rounded-lg shadow-sm border border-gray-200 
    hover:shadow-md transition-all duration-200 overflow-hidden
    ${isEnriched ? 'hover:shadow-lg hover:border-blue-300' : 'hover:border-gray-300'}
    ${className}
  `;

  const imageClasses = `
    w-full ${variant === 'compact' ? 'h-32' : 'h-48'} 
    object-cover transition-transform duration-200 group-hover:scale-105
  `;

  return (
    <Link to={`/item/${item.id}`} className={cardClasses}>
      {/* Image Section */}
      <div className="relative overflow-hidden">
        {item.wiki_image_url ? (
          <img
            src={item.wiki_image_url}
            alt={item.title}
            className={imageClasses}
          />
        ) : (
          <div className={`${imageClasses} bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center`}>
            <div className="text-4xl opacity-50">
              {getSectionEmoji(item.section_name || '')}
            </div>
          </div>
        )}

        {/* Content Type Badge */}
        <div className="absolute top-2 left-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${contentTypeInfo.badge}`}>
            {contentTypeInfo.type}
          </span>
        </div>


        {/* Wiki Link Indicator */}
        {item.wiki_url && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-600 text-white p-1 rounded-full">
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title */}
        <h3 className={`font-semibold mb-2 line-clamp-2 ${isEnriched ? 'text-gray-900' : 'text-gray-700'}`}>
          {item.title}
        </h3>

        {/* Hierarchy Information */}
        {contentTypeInfo.hierarchy && (
          <div className="text-sm text-gray-600 mb-2">
            <span className="font-medium">{contentTypeInfo.hierarchy}</span>
          </div>
        )}

        {/* Additional Metadata */}
        <div className="flex flex-wrap items-center text-xs text-gray-400 mb-2">
          {item.story_number && (
            <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">#{item.story_number}</span>
          )}
          {item.story_number && item.format && (
            <span className="mx-1">•</span>
          )}
          {item.format && (
            <span>{item.format}</span>
          )}
        </div>

        {/* Synopsis Preview (only for enriched items) */}
        {isEnriched && item.wiki_summary && variant !== 'compact' && (
          <p className="text-sm text-gray-600 line-clamp-3 mb-2">
            {item.wiki_summary}
          </p>
        )}

        {/* Enrichment Status for non-enriched items */}
        {!isEnriched && variant !== 'compact' && (
          <div className="flex items-center text-xs text-gray-500">
            <ClockIcon className="h-3 w-3 mr-1" />
            <span>
              {item.enrichment_status === 'pending' ? 'TARDIS Wiki enrichment pending' :
               item.enrichment_status === 'failed' ? 'Enrichment failed' :
               'Basic information only'}
            </span>
          </div>
        )}
      </div>

      {/* Progressive Enhancement Animation */}
      {item.enrichment_status === 'pending' && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 pointer-events-none" />
      )}
    </Link>
  );
};

export default ContentCard;