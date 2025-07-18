/**
 * Watch History Page
 * 
 * Displays user's watch history
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { EyeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useUserFeatures } from '../hooks/useUserFeatures';
import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../services/api';
import { ContentCard } from '../components/ui';
import { LoadingSpinner } from '../components/common';

const WatchHistoryPage: React.FC = () => {
  const { user } = useAuth();
  const { watchHistory, loading } = useUserFeatures();

  // Get library items for watch history
  const { data: watchedItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['watch-history', 'items', watchHistory.map(w => w.library_item_id)],
    queryFn: async () => {
      if (watchHistory.length === 0) return [];
      
      // Fetch each watched item
      const items = await Promise.all(
        watchHistory.map(async (watch) => {
          try {
            const item = await libraryApi.getLibraryItem(watch.library_item_id);
            return {
              ...item,
              watched_at: watch.watched_at,
              progress: watch.progress || 100
            };
          } catch (error) {
            console.error(`Error fetching item ${watch.library_item_id}:`, error);
            return null;
          }
        })
      );
      
      return items.filter(item => item !== null);
    },
    enabled: watchHistory.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <EyeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Watch History</h1>
        <p className="text-gray-600 mb-6">Sign in to track your Doctor Who viewing history</p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Go to Library
        </Link>
      </div>
    );
  }

  if (loading || itemsLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (watchHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <EyeIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Watch History</h1>
        <p className="text-gray-600 mb-6">
          Start watching Doctor Who content to track your viewing progress
        </p>
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Browse Library
        </Link>
      </div>
    );
  }

  const formatWatchedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="watch-history-page space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Watch History</h1>
        <p className="text-gray-600">
          {watchHistory.length} watched {watchHistory.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="space-y-6">
        {watchedItems?.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                <ContentCard
                  item={item}
                  variant="compact"
                  className="w-48"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  {item.section_name} • {item.content_type}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Watched {formatWatchedDate(item.watched_at)}</span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-green-500 rounded-full"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <span>{item.progress}%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WatchHistoryPage;