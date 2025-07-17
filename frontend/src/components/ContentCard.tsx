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
            {/* Doctor-specific placeholder or generic icon */}
            {item.section_name?.includes('Doctor') ? (
              <div className="text-4xl opacity-50">
                {item.section_name?.includes('1st') ? '👴' :
                 item.section_name?.includes('2nd') ? '🎭' :
                 item.section_name?.includes('3rd') ? '🥋' :
                 item.section_name?.includes('4th') ? '🧣' :
                 item.section_name?.includes('5th') ? '🏏' :
                 item.section_name?.includes('6th') ? '🌈' :
                 item.section_name?.includes('7th') ? '🎩' :
                 item.section_name?.includes('8th') ? '💫' :
                 item.section_name?.includes('9th') ? '👂' :
                 item.section_name?.includes('10th') ? '🕺' :
                 item.section_name?.includes('11th') ? '🎀' :
                 item.section_name?.includes('12th') ? '🎸' :
                 item.section_name?.includes('13th') ? '👥' :
                 item.section_name?.includes('14th') ? '🔄' :
                 item.section_name?.includes('15th') ? '✨' :
                 '🎭'}
              </div>
            ) : (
              <PhotoIcon className="h-12 w-12 text-gray-300" />
            )}
          </div>
        )}

        {/* Enrichment Status Badge */}
        {showEnrichmentStatus && (
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getEnrichmentStatusColor()}`}>
              {getEnrichmentStatusIcon()}
              {isEnriched && (
                <span>{confidencePercentage}%</span>
              )}
              {item.enrichment_status === 'pending' && (
                <span>Enriching...</span>
              )}
            </span>
          </div>
        )}

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

        {/* Metadata */}
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
          {item.section_name && (
            <span className="font-medium">{item.section_name}</span>
          )}
          {item.content_type && item.section_name && (
            <span className="mx-1">•</span>
          )}
          {item.content_type && (
            <span>{item.content_type}</span>
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