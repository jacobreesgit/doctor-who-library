/**
 * Main Shows View - Major spin-offs and shows
 */

import React from 'react';

const MainShowsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Main Shows
        </h2>
        <p className="text-gray-600 mt-2">
          Doctor Who, Torchwood, Sarah Jane Adventures, and more
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Main Shows View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will showcase major TV series and spin-offs
        </p>
      </div>
    </div>
  );
};

export default MainShowsView;