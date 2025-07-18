/**
 * Favorites View - User's favorite content
 */

import React from 'react';

const FavoritesView: React.FC = () => {
  return (
    <div className="favorites-view space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Your Favorites
        </h2>
        <p className="text-gray-600 mt-2">
          Your personal collection of favorite stories
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Favorites View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will manage your personal favorites and watchlist
        </p>
      </div>
    </div>
  );
};

export default FavoritesView;