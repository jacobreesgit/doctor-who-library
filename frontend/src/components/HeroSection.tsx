/**
 * Hero section component for featured content with TARDIS Wiki integration
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  PlayIcon, 
  PlusIcon, 
  StarIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/solid';
import { HeartIcon as HeartOutlineIcon } from '@heroicons/react/24/outline';
import type { LibraryItem } from '../types/api';

interface HeroSectionProps {
  item: LibraryItem;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({ item, className = '' }) => {
  const confidencePercentage = Math.round((item.enrichment_confidence || 0) * 100);
  const hasWikiData = item.wiki_url || item.wiki_summary || item.wiki_image_url;

  return (
    <div className={`relative overflow-hidden rounded-lg ${className}`}>
      {/* Background Image */}
      <div className="absolute inset-0">
        {item.wiki_image_url ? (
          <img
            src={item.wiki_image_url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-blue-800" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-8 py-16 lg:py-24">
        <div className="max-w-2xl">
          {/* TARDIS Wiki Badge */}
          {hasWikiData && (
            <div className="inline-flex items-center space-x-2 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
              <StarIcon className="h-4 w-4" />
              <span>✨ FEATURED STORY</span>
              <span className="bg-blue-500 px-2 py-0.5 rounded text-xs">
                {confidencePercentage}% Enriched
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
            {item.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center space-x-4 text-gray-300 mb-6">
            {item.section_name && (
              <span className="text-lg font-medium">{item.section_name}</span>
            )}
            {item.content_type && (
              <>
                <span>•</span>
                <span>{item.content_type}</span>
              </>
            )}
            {item.story_number && (
              <>
                <span>•</span>
                <span>Story {item.story_number}</span>
              </>
            )}
          </div>

          {/* Synopsis */}
          {item.wiki_summary && (
            <p className="text-gray-100 text-lg leading-relaxed mb-8 max-w-xl">
              {item.wiki_summary.length > 200 
                ? `${item.wiki_summary.substring(0, 200)}...`
                : item.wiki_summary
              }
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center space-x-4">
            <Link
              to={`/item/${item.id}`}
              className="inline-flex items-center space-x-2 bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              <PlayIcon className="h-5 w-5" />
              <span>View Details</span>
            </Link>

            <button className="inline-flex items-center space-x-2 bg-gray-600 bg-opacity-70 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-colors">
              <PlusIcon className="h-5 w-5" />
              <span>My List</span>
            </button>

            <button className="inline-flex items-center space-x-2 bg-gray-600 bg-opacity-70 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-colors">
              <HeartOutlineIcon className="h-5 w-5" />
              <span>Favorite</span>
            </button>

            {item.wiki_url && (
              <a
                href={item.wiki_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 bg-blue-600 bg-opacity-70 text-white px-6 py-3 rounded-lg font-medium hover:bg-opacity-80 transition-colors"
              >
                <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                <span>TARDIS Wiki</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Quality Indicator */}
      {hasWikiData && (
        <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          🔗 Wiki Enhanced
        </div>
      )}
    </div>
  );
};

export default HeroSection;