/**
 * Favorite Button Component
 * 
 * Toggle button for adding/removing items from favorites
 */

import React from 'react';
import { HeartIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useUserFeatures } from '../../hooks/useUserFeatures';

interface FavoriteButtonProps {
  itemId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({
  itemId,
  className = '',
  size = 'md'
}) => {
  const { user } = useAuth();
  const { isFavorite, addToFavorites, removeFromFavorites } = useUserFeatures();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      // Could trigger login modal here
      return;
    }

    if (isFavorite(itemId)) {
      await removeFromFavorites(itemId);
    } else {
      await addToFavorites(itemId);
    }
  };

  if (!user) {
    return null; // Don't show favorite button for non-authenticated users
  }

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const buttonClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const isFav = isFavorite(itemId);

  return (
    <button
      onClick={handleClick}
      className={`
        favorite-button
        ${buttonClasses[size]}
        rounded-full transition-all duration-200
        ${isFav 
          ? 'text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100' 
          : 'text-gray-400 hover:text-red-500 bg-white hover:bg-red-50'
        }
        ${className}
      `}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
    >
      {isFav ? (
        <HeartSolidIcon className={sizeClasses[size]} />
      ) : (
        <HeartIcon className={sizeClasses[size]} />
      )}
    </button>
  );
};

export default FavoriteButton;