/**
 * Mobile-Optimized Enrichment Experience
 * 
 * Provides mobile-first enrichment experience with:
 * - Touch-friendly interactions
 * - Swipe gestures for enrichment actions
 * - Optimized data usage
 * - Reduced battery drain
 * - Responsive enrichment indicators
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  SparklesIcon, 
  HeartIcon, 
  EyeIcon,
  WifiIcon,
  BoltIcon,
  DevicePhoneMobileIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import type { LibraryItem } from '../types/api';

interface MobileEnrichmentExperienceProps {
  item: LibraryItem;
  onPriorityRequest?: (itemId: string) => void;
  onFavorite?: (itemId: string, isFavorite: boolean) => void;
  isVisible?: boolean;
  className?: string;
}

interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  distance: number;
}

interface MobileOptimizations {
  reducedMotion: boolean;
  lowPowerMode: boolean;
  slowConnection: boolean;
  touchSupport: boolean;
  screenSize: 'small' | 'medium' | 'large';
}

const MobileEnrichmentExperience: React.FC<MobileEnrichmentExperienceProps> = ({
  item,
  onPriorityRequest,
  onFavorite,
  isVisible = true,
  className = ''
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [optimizations, setOptimizations] = useState<MobileOptimizations>({
    reducedMotion: false,
    lowPowerMode: false,
    slowConnection: false,
    touchSupport: false,
    screenSize: 'medium'
  });
  const [swipeAction, setSwipeAction] = useState<'favorite' | 'enrich' | null>(null);

  const cardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const isEnriched = item.enrichment_status === 'enriched';
  const isPending = item.enrichment_status === 'pending';
  const confidencePercentage = Math.round((item.enrichment_confidence || 0) * 100);

  // Detect mobile optimizations
  useEffect(() => {
    const detectOptimizations = () => {
      const newOptimizations: MobileOptimizations = {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        lowPowerMode: (navigator as any).getBattery ? 
          (navigator as any).getBattery().then((battery: any) => !battery.charging && battery.level < 0.2) : false,
        slowConnection: (navigator as any).connection ? 
          (navigator as any).connection.effectiveType === 'slow-2g' || 
          (navigator as any).connection.effectiveType === '2g' : false,
        touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        screenSize: window.innerWidth < 480 ? 'small' : 
                   window.innerWidth < 768 ? 'medium' : 'large'
      };

      setOptimizations(newOptimizations);
    };

    detectOptimizations();
    
    // Listen for connection changes
    if ((navigator as any).connection) {
      (navigator as any).connection.addEventListener('change', detectOptimizations);
    }

    // Listen for battery changes
    if ((navigator as any).getBattery) {
      (navigator as any).getBattery().then((battery: any) => {
        battery.addEventListener('chargingchange', detectOptimizations);
        battery.addEventListener('levelchange', detectOptimizations);
      });
    }

    return () => {
      if ((navigator as any).connection) {
        (navigator as any).connection.removeEventListener('change', detectOptimizations);
      }
    };
  }, []);

  // Load favorite status
  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorite-items') || '[]');
    setIsFavorite(favorites.includes(item.id));
  }, [item.id]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!optimizations.touchSupport) return;

    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    setGesture({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction: null,
      distance: 0
    });
  }, [optimizations.touchSupport]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!gesture || !touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine swipe direction
    let direction: TouchGesture['direction'] = null;
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    setGesture(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction,
      distance
    } : null);

    // Show swipe action preview
    if (distance > 50) {
      if (direction === 'right' && !isFavorite) {
        setSwipeAction('favorite');
      } else if (direction === 'left' && !isEnriched && !isPending) {
        setSwipeAction('enrich');
      }
    } else {
      setSwipeAction(null);
    }

    // Prevent scrolling during swipe
    if (distance > 20) {
      e.preventDefault();
    }
  }, [gesture, isFavorite, isEnriched, isPending]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!gesture || !touchStartRef.current) return;

    const touchDuration = Date.now() - touchStartRef.current.time;
    const isSwipe = gesture.distance > 100 && touchDuration < 300;

    if (isSwipe) {
      // Execute swipe action
      if (swipeAction === 'favorite') {
        handleFavorite();
      } else if (swipeAction === 'enrich') {
        handlePriorityRequest();
      }
    } else if (gesture.distance < 10 && touchDuration < 200) {
      // Tap to show actions
      setShowActions(!showActions);
    }

    // Reset gesture state
    setGesture(null);
    setSwipeAction(null);
    touchStartRef.current = null;
  }, [gesture, swipeAction, showActions]);

  // Handle favorite toggle
  const handleFavorite = useCallback(() => {
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    const favorites = JSON.parse(localStorage.getItem('favorite-items') || '[]');
    const newFavorites = newFavoriteState 
      ? [...favorites, item.id]
      : favorites.filter((id: string) => id !== item.id);
    
    localStorage.setItem('favorite-items', JSON.stringify(newFavorites));
    onFavorite?.(item.id, newFavoriteState);
  }, [isFavorite, item.id, onFavorite]);

  // Handle priority request
  const handlePriorityRequest = useCallback(() => {
    if (isPending || isEnriched) return;
    onPriorityRequest?.(item.id);
  }, [isPending, isEnriched, item.id, onPriorityRequest]);

  // Get mobile-optimized styles
  const getMobileStyles = () => {
    const baseStyles = `
      relative bg-white rounded-lg shadow-sm border border-gray-200 
      overflow-hidden transition-all duration-200
      ${optimizations.reducedMotion ? '' : 'hover:shadow-md'}
    `;

    // Swipe indication styles
    const swipeStyles = swipeAction ? `
      ${swipeAction === 'favorite' ? 'bg-gradient-to-r from-red-50 to-white' : ''}
      ${swipeAction === 'enrich' ? 'bg-gradient-to-l from-blue-50 to-white' : ''}
    ` : '';

    return `${baseStyles} ${swipeStyles}`;
  };

  // Get connection-aware image loading
  const getImageProps = () => {
    if (optimizations.slowConnection || optimizations.lowPowerMode) {
      return {
        loading: 'lazy' as const,
        decoding: 'async' as const,
        sizes: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 33vw'
      };
    }

    return {
      loading: isVisible ? 'eager' as const : 'lazy' as const,
      decoding: 'async' as const
    };
  };

  return (
    <div 
      ref={cardRef}
      className={`${getMobileStyles()} ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: gesture ? `translateX(${gesture.currentX - gesture.startX}px)` : 'none'
      }}
    >
      {/* Mobile-optimized image */}
      <div className="relative">
        {item.wiki_image_url && !optimizations.lowPowerMode ? (
          <img
            src={item.wiki_image_url}
            alt={item.title}
            className="w-full h-48 object-cover"
            {...getImageProps()}
          />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <DevicePhoneMobileIcon className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Mobile status indicators */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          {/* Connection indicator */}
          {optimizations.slowConnection && (
            <div className="bg-orange-100 p-1 rounded-full">
              <WifiIcon className="h-3 w-3 text-orange-600" />
            </div>
          )}

          {/* Battery indicator */}
          {optimizations.lowPowerMode && (
            <div className="bg-red-100 p-1 rounded-full">
              <BoltIcon className="h-3 w-3 text-red-600" />
            </div>
          )}

          {/* Enrichment status */}
          {isEnriched && (
            <div className="bg-green-100 px-2 py-1 rounded-full">
              <span className="text-xs font-medium text-green-700">
                {confidencePercentage}%
              </span>
            </div>
          )}
        </div>

        {/* Swipe action preview */}
        {swipeAction && (
          <div className={`
            absolute inset-0 flex items-center justify-center
            ${swipeAction === 'favorite' ? 'bg-red-500' : 'bg-blue-500'}
            bg-opacity-80 text-white
          `}>
            <div className="text-center">
              {swipeAction === 'favorite' ? (
                <>
                  <HeartSolidIcon className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">Add to Favorites</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-8 w-8 mx-auto mb-2" />
                  <span className="text-sm font-medium">Priority Enrichment</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Enrichment progress (mobile-optimized) */}
        {isPending && (
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200">
            <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse" />
          </div>
        )}
      </div>

      {/* Mobile-optimized content */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate text-sm">
              {item.title}
            </h3>
            
            {/* Mobile metadata */}
            <div className="flex items-center text-xs text-gray-500 mt-1">
              {item.section_name && (
                <span className="truncate">{item.section_name}</span>
              )}
              {item.content_type && item.section_name && (
                <span className="mx-1">•</span>
              )}
              {item.content_type && (
                <span className="truncate">{item.content_type}</span>
              )}
            </div>

            {/* Mobile-optimized synopsis */}
            {isEnriched && item.wiki_summary && (
              <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                {item.wiki_summary}
              </p>
            )}
          </div>

          {/* Mobile action buttons */}
          <div className="flex items-center space-x-2 ml-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full ${
                isFavorite 
                  ? 'text-red-500 bg-red-50' 
                  : 'text-gray-400 bg-gray-50'
              }`}
              aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {isFavorite ? (
                <HeartSolidIcon className="h-4 w-4" />
              ) : (
                <HeartIcon className="h-4 w-4" />
              )}
            </button>

            {!isEnriched && (
              <button
                onClick={handlePriorityRequest}
                disabled={isPending}
                className={`p-2 rounded-full ${
                  isPending 
                    ? 'text-blue-400 bg-blue-50 cursor-not-allowed' 
                    : 'text-blue-500 bg-blue-50'
                }`}
                aria-label="Request priority enrichment"
              >
                <SparklesIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile swipe hints */}
        {optimizations.touchSupport && !showActions && (
          <div className="mt-2 text-xs text-gray-400 text-center">
            Swipe right to favorite • Swipe left to enrich
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEnrichmentExperience;