/**
 * Library card component for displaying individual library items with wiki enrichment
 */

import React from 'react';
import type { LibraryItemResponse } from '../types/api';
import WikiSummary from './WikiSummary';
import EnrichmentBadge from './EnrichmentBadge';
import WikiImage from './WikiImage';

interface LibraryCardProps {
  item: LibraryItemResponse;
  onClick?: () => void;
}

const LibraryCard: React.FC<LibraryCardProps> = ({ item, onClick }) => {
  const isEnriched = item.enrichment_status === 'enriched';
  const hasHighConfidence = item.enrichment_confidence >= 0.8;

  const handleWikiClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.wiki_url) {
      window.open(item.wiki_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-md border-2 overflow-hidden card-hover ${
        isEnriched && hasHighConfidence 
          ? 'border-green-200 bg-gradient-to-br from-green-50 to-white high-quality-glow' 
          : isEnriched 
          ? 'border-blue-200 bg-gradient-to-br from-blue-50 to-white enrichment-glow'
          : 'border-gray-200'
      } ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header with image */}
        <div className="flex gap-4 mb-4">
          {/* Wiki Image */}
          {isEnriched && (
            <div className="flex-shrink-0">
              <WikiImage
                src={item.wiki_image_url}
                alt={item.display_title}
                width={120}
                height={120}
                className="rounded-lg"
              />
            </div>
          )}
          
          {/* Title and Content Type */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 flex-1">
                {item.display_title}
              </h3>
              {item.content_type && (
                <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                  {item.content_type}
                </span>
              )}
            </div>
            
            {/* Enrichment Status */}
            <div className="flex items-center justify-between mb-3">
              <EnrichmentBadge 
                status={item.enrichment_status}
                confidence={item.enrichment_confidence}
                showConfidence={isEnriched}
              />
              
              {/* Wiki Link */}
              {item.wiki_url && (
                <button
                  onClick={handleWikiClick}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  title="View on TARDIS Wiki"
                >
                  <span>Wiki</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Wiki Summary */}
        {item.wiki_summary && (
          <div className="mb-4">
            <WikiSummary summary={item.wiki_summary} maxLength={150} />
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-4">
          {item.doctor && (
            <div className="flex">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Doctor:</span>
              <span className="text-gray-600 truncate">{item.doctor}</span>
            </div>
          )}
          
          {item.companions && (
            <div className="flex">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Companions:</span>
              <span className="text-gray-600 truncate">{item.companions}</span>
            </div>
          )}
          
          {item.writer && (
            <div className="flex">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Writer:</span>
              <span className="text-gray-600 truncate">{item.writer}</span>
            </div>
          )}
          
          {item.director && (
            <div className="flex">
              <span className="font-medium text-gray-700 w-20 flex-shrink-0">Director:</span>
              <span className="text-gray-600 truncate">{item.director}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-100">
          <span className="font-mono">{item.id.substring(0, 8)}...</span>
          {isEnriched && hasHighConfidence && (
            <span className="text-green-600 font-medium flex items-center space-x-1">
              <span>⭐</span>
              <span>High Quality</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryCard;