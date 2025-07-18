/**
 * Favorites Page
 * 
 * Displays user's favorite library items
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useUserFeatures } from '../hooks/useUserFeatures';
import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../services/api';
import { ContentCard } from '../components/ui';
import { LoadingSpinner } from '../components/common';

const FavoritesPage: React.FC = () => {
  const { user } = useAuth();
  const { favorites, loading } = useUserFeatures();

  // Get library items for favorites
  const { data: favoriteItems, isLoading: itemsLoading } = useQuery({
    queryKey: ['favorites', 'items', favorites.map(f => f.library_item_id)],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      // Fetch each favorite item
      const items = await Promise.all(
        favorites.map(async (fav) => {
          try {
            return await libraryApi.getLibraryItem(fav.library_item_id);
          } catch (error) {
            console.error(`Error fetching item ${fav.library_item_id}:`, error);
            return null;
          }
        })
      );
      
      return items.filter(item => item !== null);
    },
    enabled: favorites.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  if (!user) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">My Favorites</h1>
        <p className="text-gray-600 mb-6">Sign in to save your favorite Doctor Who content</p>
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

  if (favorites.length === 0) {
    return (
      <div className="text-center py-12">
        <HeartIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Favorites Yet</h1>
        <p className="text-gray-600 mb-6">
          Start exploring the Doctor Who library and save your favorite stories
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

  return (
    <div className="favorites-page space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">My Favorites</h1>
        <p className="text-gray-600">
          {favorites.length} favorite {favorites.length === 1 ? 'item' : 'items'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favoriteItems?.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            variant="default"
          />
        ))}
      </div>
    </div>
  );
};

export default FavoritesPage;