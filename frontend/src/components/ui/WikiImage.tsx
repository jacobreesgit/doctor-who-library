/**
 * WikiImage component with fallback for missing images and loading skeleton
 */

import React, { useState } from 'react';

interface WikiImageProps {
  src?: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackIcon?: string;
}

const WikiImage: React.FC<WikiImageProps> = ({ 
  src, 
  alt, 
  width = 150, 
  height = 150, 
  className = '',
  fallbackIcon = '📺'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // If no src provided or has error, show fallback
  if (!src || hasError) {
    return (
      <div 
        className={`wiki-image flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <div className="text-3xl mb-1">{fallbackIcon}</div>
          <div className="text-xs text-gray-500">No Image</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wiki-image relative overflow-hidden rounded-lg ${className}`} style={{ width, height }}>
      {/* Loading skeleton */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="text-gray-400">
            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              ></circle>
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        </div>
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`object-cover transition-opacity duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{ width, height }}
      />
      
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center opacity-0 hover:opacity-100">
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
    </div>
  );
};

export default WikiImage;