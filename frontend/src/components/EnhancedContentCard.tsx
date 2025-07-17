/**
 * Enhanced Content Card with Real-Time Enrichment Transitions
 * 
 * Features:
 * - Progressive enhancement animations
 * - Real-time state transitions
 * - Confidence-based visual hierarchy
 * - Mobile-optimized enrichment experience
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  StarIcon, 
  ClockIcon, 
  PhotoIcon,
  ArrowTopRightOnSquareIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import type { LibraryItem } from '../types/api';

interface EnhancedContentCardProps {
  item: LibraryItem;
  variant?: 'default' | 'compact' | 'list';
  showEnrichmentStatus?: boolean;
  className?: string;
  onEnrichmentRequest?: (itemId: string) => void;
  realTimeUpdates?: boolean;
}

type EnrichmentPhase = 'basic' | 'searching' | 'enriching' | 'enhanced' | 'failed';

const EnhancedContentCard: React.FC<EnhancedContentCardProps> = ({
  item,
  variant = 'default',
  showEnrichmentStatus = false,
  className = '',
  onEnrichmentRequest,
  realTimeUpdates = true
}) => {
  const [enrichmentPhase, setEnrichmentPhase] = useState<EnrichmentPhase>('basic');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [priorityBoost, setPriorityBoost] = useState(false);

  const confidencePercentage = Math.round((item.enrichment_confidence || 0) * 100);
  const isEnriched = item.enrichment_status === 'enriched';
  const isPending = item.enrichment_status === 'pending';
  const isFailed = item.enrichment_status === 'failed';

  // Determine enrichment phase
  useEffect(() => {
    if (item.enrichment_status === 'enriched') {
      setEnrichmentPhase('enhanced');
    } else if (item.enrichment_status === 'pending') {
      setEnrichmentPhase('enriching');
    } else if (item.enrichment_status === 'failed') {
      setEnrichmentPhase('failed');
    } else {
      setEnrichmentPhase('basic');
    }
  }, [item.enrichment_status]);

  // Handle real-time transitions
  useEffect(() => {
    if (realTimeUpdates && isPending) {
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isPending, realTimeUpdates]);

  // Confidence-based visual hierarchy
  const getEnrichmentTier = () => {
    if (!isEnriched) return 'basic';
    if (confidencePercentage >= 90) return 'premium';
    if (confidencePercentage >= 70) return 'enhanced';
    if (confidencePercentage >= 50) return 'standard';
    return 'basic';
  };

  const enrichmentTier = getEnrichmentTier();

  // Visual styles based on enrichment state
  const getCardStyles = () => {
    const baseStyles = `
      group relative bg-white rounded-lg shadow-sm border overflow-hidden
      transition-all duration-300 ease-in-out cursor-pointer
    `;

    const tierStyles = {
      premium: `
        border-gradient-to-r from-yellow-300 via-purple-300 to-blue-300 
        shadow-lg hover:shadow-xl hover:border-yellow-400
        bg-gradient-to-br from-white to-blue-50
      `,
      enhanced: `
        border-blue-200 shadow-md hover:shadow-lg hover:border-blue-300
        bg-gradient-to-br from-white to-blue-25
      `,
      standard: `
        border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300
      `,
      basic: `
        border-gray-100 hover:border-gray-200
        ${isPending ? 'bg-gradient-to-r from-white to-yellow-50' : ''}
        ${isFailed ? 'bg-gradient-to-r from-white to-red-50' : ''}
      `
    };

    return `${baseStyles} ${tierStyles[enrichmentTier]} ${className}`;
  };

  // Progressive enhancement animation
  const getEnhancementAnimation = () => {
    if (isTransitioning) {
      return 'animate-pulse';
    }
    if (isPending) {
      return 'animate-shimmer';
    }
    return '';
  };

  // Image loading with enhancement
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  // User-initiated enrichment priority boost
  const handlePriorityBoost = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPriorityBoost(true);
    onEnrichmentRequest?.(item.id);
    setTimeout(() => setPriorityBoost(false), 3000);
  };

  // Status indicators
  const getStatusIndicator = () => {
    if (isEnriched) {
      return (
        <div className="flex items-center space-x-1">
          <StarSolidIcon className="h-4 w-4 text-yellow-500" />
          <span className="text-xs font-medium text-green-700">
            {confidencePercentage}% confidence
          </span>
        </div>
      );
    }
    
    if (isPending) {
      return (
        <div className="flex items-center space-x-1">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          <span className="text-xs font-medium text-blue-700">
            Enriching...
          </span>
        </div>
      );
    }
    
    if (isFailed) {
      return (
        <div className="flex items-center space-x-1">
          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
          <span className="text-xs font-medium text-red-700">
            Failed
          </span>
        </div>
      );
    }

    return (
      <button
        onClick={handlePriorityBoost}
        className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
          ${priorityBoost 
            ? 'bg-blue-100 text-blue-700 animate-pulse' 
            : 'bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-700'
          } transition-colors duration-200`}
        title="Request priority enrichment"
      >
        <SparklesIcon className="h-3 w-3" />
        <span>{priorityBoost ? 'Requested!' : 'Enrich'}</span>
      </button>
    );
  };

  return (
    <Link 
      to={`/item/${item.id}`} 
      className={`${getCardStyles()} ${getEnhancementAnimation()}`}
    >
      {/* Image Section with Progressive Enhancement */}
      <div className="relative overflow-hidden">
        {/* Enhanced Image Display */}
        {item.wiki_image_url ? (
          <div className="relative">
            <img
              src={item.wiki_image_url}
              alt={item.title}
              className={`
                w-full ${variant === 'compact' ? 'h-32' : 'h-48'} 
                object-cover transition-all duration-500
                ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
                group-hover:scale-110
                ${enrichmentTier === 'premium' ? 'filter brightness-110' : ''}
              `}
              onLoad={handleImageLoad}
            />
            
            {/* Image Loading Skeleton */}
            {!imageLoaded && (
              <div className={`
                absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 
                animate-pulse flex items-center justify-center
              `}>
                <PhotoIcon className="h-12 w-12 text-gray-300" />
              </div>
            )}
            
            {/* Premium Enhancement Overlay */}
            {enrichmentTier === 'premium' && (
              <div className="absolute inset-0 bg-gradient-to-t from-transparent via-transparent to-yellow-100 opacity-20" />
            )}
          </div>
        ) : (
          <div className={`
            w-full ${variant === 'compact' ? 'h-32' : 'h-48'} 
            bg-gradient-to-br from-blue-100 to-purple-100 
            flex items-center justify-center
            ${isPending ? 'animate-gradient-x' : ''}
          `}>
            {/* Doctor-specific placeholder with enhanced styling */}
            {item.section_name?.includes('Doctor') ? (
              <div className={`
                text-4xl opacity-50 transition-all duration-300
                ${isPending ? 'animate-bounce' : ''}
              `}>
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

        {/* Real-time Status Overlay */}
        {showEnrichmentStatus && (
          <div className="absolute top-2 right-2 z-10">
            {getStatusIndicator()}
          </div>
        )}

        {/* Wiki Link Indicator */}
        {item.wiki_url && (
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="bg-blue-600 text-white p-1 rounded-full shadow-lg">
              <ArrowTopRightOnSquareIcon className="h-3 w-3" />
            </div>
          </div>
        )}

        {/* Enrichment Progress Bar */}
        {isPending && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-progress-bar" />
          </div>
        )}
      </div>

      {/* Content Section with Enhanced Typography */}
      <div className="p-4">
        {/* Title with Enrichment-based Styling */}
        <h3 className={`
          font-semibold mb-2 line-clamp-2 transition-colors duration-300
          ${enrichmentTier === 'premium' ? 'text-gray-900 font-bold' :
            enrichmentTier === 'enhanced' ? 'text-gray-900' :
            enrichmentTier === 'standard' ? 'text-gray-800' :
            'text-gray-700'}
        `}>
          {item.title}
        </h3>

        {/* Enhanced Metadata */}
        <div className="flex flex-wrap items-center text-sm text-gray-500 mb-2">
          {item.section_name && (
            <span className={`font-medium ${enrichmentTier === 'premium' ? 'text-blue-600' : ''}`}>
              {item.section_name}
            </span>
          )}
          {item.content_type && item.section_name && (
            <span className="mx-1">•</span>
          )}
          {item.content_type && (
            <span>{item.content_type}</span>
          )}
          {isEnriched && confidencePercentage >= 90 && (
            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
              ⭐ Premium
            </span>
          )}
        </div>

        {/* Enhanced Synopsis with Confidence Indicators */}
        {isEnriched && item.wiki_summary && variant !== 'compact' && (
          <div className="relative">
            <p className={`
              text-sm text-gray-600 line-clamp-3 mb-2
              ${enrichmentTier === 'premium' ? 'text-gray-700' : ''}
            `}>
              {item.wiki_summary}
            </p>
            
            {/* Confidence Indicator */}
            {confidencePercentage >= 80 && (
              <div className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full" />
            )}
          </div>
        )}

        {/* Enhanced Status for Non-Enriched Items */}
        {!isEnriched && variant !== 'compact' && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <ClockIcon className="h-3 w-3 mr-1" />
              <span>
                {isPending ? 'TARDIS Wiki enrichment in progress' :
                 isFailed ? 'Enrichment failed - basic info only' :
                 'TARDIS Wiki enrichment available'}
              </span>
            </div>
            
            {!isPending && !isFailed && (
              <button
                onClick={handlePriorityBoost}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Request
              </button>
            )}
          </div>
        )}
      </div>

      {/* Live Enhancement Effects */}
      {isPending && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none" />
      )}
      
      {enrichmentTier === 'premium' && (
        <div className="absolute inset-0 bg-gradient-to-r from-yellow-50 to-purple-50 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none" />
      )}
    </Link>
  );
};

export default EnhancedContentCard;