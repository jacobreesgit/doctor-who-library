/**
 * Watched Button Component
 * 
 * Toggle button for marking items as watched
 */

import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../../contexts/AuthContext';
import { useUserFeatures } from '../../hooks/useUserFeatures';

interface WatchedButtonProps {
  itemId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const WatchedButton: React.FC<WatchedButtonProps> = ({
  itemId,
  className = '',
  size = 'md'
}) => {
  const { user } = useAuth();
  const { isWatched, addToWatchHistory, getWatchProgress } = useUserFeatures();

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      return;
    }

    if (!isWatched(itemId)) {
      await addToWatchHistory(itemId, 100); // Mark as fully watched
    }
  };

  if (!user) {
    return null; // Don't show watched button for non-authenticated users
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

  const watched = isWatched(itemId);
  const progress = getWatchProgress(itemId);

  return (
    <button
      onClick={handleClick}
      className={`
        watched-button
        ${buttonClasses[size]}
        rounded-full transition-all duration-200
        ${watched 
          ? 'text-green-500 hover:text-green-600 bg-green-50 hover:bg-green-100' 
          : 'text-gray-400 hover:text-green-500 bg-white hover:bg-green-50'
        }
        ${className}
      `}
      title={watched ? `Watched (${progress}%)` : 'Mark as watched'}
    >
      {watched ? (
        <CheckCircleSolidIcon className={sizeClasses[size]} />
      ) : (
        <EyeIcon className={sizeClasses[size]} />
      )}
    </button>
  );
};

export default WatchedButton;