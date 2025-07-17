/**
 * Enrichment Engagement Component
 * 
 * Provides user mechanisms to influence enrichment priority and experience
 * Features:
 * - Priority request system
 * - Interactive enrichment progress
 * - Gamification elements
 * - User preference learning
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  SparklesIcon, 
  HeartIcon, 
  FireIcon, 
  EyeIcon,
  ClockIcon,
  StarIcon,
  TrophyIcon,
  BoltIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import useRealTimeEnrichment from '../hooks/useRealTimeEnrichment';
import type { LibraryItem } from '../types/api';

interface EnrichmentEngagementProps {
  item: LibraryItem;
  variant?: 'card' | 'detail' | 'compact';
  onPriorityRequest?: (itemId: string) => void;
  className?: string;
}

interface UserEngagementData {
  priorityRequests: number;
  favoriteItems: string[];
  recentViews: string[];
  engagementScore: number;
  preferredContentTypes: string[];
}

const EnrichmentEngagement: React.FC<EnrichmentEngagementProps> = ({
  item,
  variant = 'card',
  onPriorityRequest,
  className = ''
}) => {
  const [isEngaged, setIsEngaged] = useState(false);
  const [priorityRequested, setPriorityRequested] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [engagementLevel, setEngagementLevel] = useState<'low' | 'medium' | 'high'>('low');
  const [userEngagement, setUserEngagement] = useState<UserEngagementData>({
    priorityRequests: 0,
    favoriteItems: [],
    recentViews: [],
    engagementScore: 0,
    preferredContentTypes: []
  });

  const { requestPriorityEnrichment, isConnected } = useRealTimeEnrichment({
    itemIds: [item.id],
    onUpdate: (items) => {
      const updatedItem = items.find(i => i.id === item.id);
      if (updatedItem?.enrichment_status === 'enriched') {
        setIsEngaged(true);
        showEnrichmentSuccess();
      }
    }
  });

  const isEnriched = item.enrichment_status === 'enriched';
  const isPending = item.enrichment_status === 'pending';
  const confidencePercentage = Math.round((item.enrichment_confidence || 0) * 100);

  // Load user engagement data
  useEffect(() => {
    const stored = localStorage.getItem('enrichment-engagement');
    if (stored) {
      setUserEngagement(JSON.parse(stored));
    }
    
    // Check if item is favorited
    const favorites = JSON.parse(localStorage.getItem('favorite-items') || '[]');
    setIsFavorite(favorites.includes(item.id));
    
    // Track view
    trackView();
  }, [item.id]);

  // Track item view for engagement scoring
  const trackView = useCallback(() => {
    const views = JSON.parse(localStorage.getItem('item-views') || '{}');
    const itemViews = views[item.id] || 0;
    setViewCount(itemViews + 1);
    
    views[item.id] = itemViews + 1;
    localStorage.setItem('item-views', JSON.stringify(views));
    
    // Update engagement level based on views
    if (itemViews >= 5) setEngagementLevel('high');
    else if (itemViews >= 2) setEngagementLevel('medium');
  }, [item.id]);

  // Request priority enrichment
  const handlePriorityRequest = useCallback(async () => {
    if (priorityRequested || isPending || isEnriched) return;

    try {
      setPriorityRequested(true);
      await requestPriorityEnrichment(item.id);
      
      // Update user engagement
      const newEngagement = {
        ...userEngagement,
        priorityRequests: userEngagement.priorityRequests + 1,
        engagementScore: userEngagement.engagementScore + 10
      };
      
      setUserEngagement(newEngagement);
      localStorage.setItem('enrichment-engagement', JSON.stringify(newEngagement));
      
      onPriorityRequest?.(item.id);
      
      // Show success feedback
      showPriorityRequestSuccess();
      
    } catch (error) {
      setPriorityRequested(false);
      showPriorityRequestError();
    }
  }, [item.id, priorityRequested, isPending, isEnriched, requestPriorityEnrichment, onPriorityRequest, userEngagement]);

  // Toggle favorite status
  const handleFavorite = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    const favorites = JSON.parse(localStorage.getItem('favorite-items') || '[]');
    let newFavorites;
    
    if (isFavorite) {
      newFavorites = favorites.filter((id: string) => id !== item.id);
    } else {
      newFavorites = [...favorites, item.id];
    }
    
    setIsFavorite(!isFavorite);
    localStorage.setItem('favorite-items', JSON.stringify(newFavorites));
    
    // Favorites get higher priority for enrichment
    if (!isFavorite && !isEnriched && !isPending) {
      setTimeout(() => handlePriorityRequest(), 500);
    }
  }, [isFavorite, item.id, isEnriched, isPending, handlePriorityRequest]);

  // Show engagement feedback
  const showEnrichmentSuccess = () => {
    // Could trigger toast notification or celebration animation
    console.log('🎉 Enrichment completed!');
  };

  const showPriorityRequestSuccess = () => {
    console.log('✨ Priority enrichment requested!');
  };

  const showPriorityRequestError = () => {
    console.log('❌ Priority request failed');
  };

  // Calculate engagement boost multiplier
  const getEngagementBoost = () => {
    let boost = 1;
    if (isFavorite) boost += 0.5;
    if (viewCount >= 3) boost += 0.3;
    if (engagementLevel === 'high') boost += 0.2;
    return boost;
  };

  // Get priority level indicator
  const getPriorityLevel = () => {
    const boost = getEngagementBoost();
    if (boost >= 2) return 'high';
    if (boost >= 1.5) return 'medium';
    return 'normal';
  };

  // Render engagement actions based on variant
  const renderEngagementActions = () => {
    if (variant === 'compact') {
      return (
        <div className="flex items-center space-x-1">
          <button
            onClick={handleFavorite}
            className={`p-1 rounded-full transition-colors ${
              isFavorite 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-400 hover:text-red-500'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
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
              disabled={priorityRequested || isPending}
              className={`p-1 rounded-full transition-colors ${
                priorityRequested || isPending
                  ? 'text-blue-400 cursor-not-allowed'
                  : 'text-gray-400 hover:text-blue-500'
              }`}
              title="Request priority enrichment"
            >
              <SparklesIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Favorite Button */}
          <button
            onClick={handleFavorite}
            className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm transition-colors ${
              isFavorite 
                ? 'bg-red-50 text-red-700 hover:bg-red-100' 
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {isFavorite ? (
              <HeartSolidIcon className="h-4 w-4" />
            ) : (
              <HeartIcon className="h-4 w-4" />
            )}
            <span>{isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>

          {/* View Count */}
          {viewCount > 1 && (
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <EyeIcon className="h-3 w-3" />
              <span>{viewCount} views</span>
            </div>
          )}

          {/* Priority Level Indicator */}
          {getPriorityLevel() !== 'normal' && (
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
              getPriorityLevel() === 'high' 
                ? 'bg-orange-100 text-orange-700' 
                : 'bg-blue-100 text-blue-700'
            }`}>
              <FireIcon className="h-3 w-3" />
              <span>{getPriorityLevel()} priority</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* Enrichment Action */}
          {!isEnriched && (
            <button
              onClick={handlePriorityRequest}
              disabled={priorityRequested || isPending || !isConnected}
              className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                priorityRequested || isPending
                  ? 'bg-blue-100 text-blue-700 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {priorityRequested || isPending ? (
                <>
                  <ClockIcon className="h-4 w-4 animate-spin" />
                  <span>Enriching...</span>
                </>
              ) : (
                <>
                  <SparklesIcon className="h-4 w-4" />
                  <span>Enrich Now</span>
                </>
              )}
            </button>
          )}

          {/* Enrichment Status */}
          {isEnriched && (
            <div className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
              <StarIcon className="h-4 w-4" />
              <span>{confidencePercentage}% enriched</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render engagement stats (for detail variant)
  const renderEngagementStats = () => {
    if (variant !== 'detail') return null;

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Engagement Insights</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <TrophyIcon className="h-4 w-4 text-yellow-500" />
            <span>Score: {userEngagement.engagementScore}</span>
          </div>
          <div className="flex items-center space-x-2">
            <BoltIcon className="h-4 w-4 text-blue-500" />
            <span>Priority: {getPriorityLevel()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-4 w-4 text-gray-500" />
            <span>Views: {viewCount}</span>
          </div>
          <div className="flex items-center space-x-2">
            <HeartIcon className="h-4 w-4 text-red-500" />
            <span>{isFavorite ? 'Favorited' : 'Not favorited'}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {renderEngagementActions()}
      {renderEngagementStats()}
    </div>
  );
};

export default EnrichmentEngagement;