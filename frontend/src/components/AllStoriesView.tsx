/**
 * All Stories View - Complete chronological listing
 */

import React from 'react';

const AllStoriesView: React.FC = () => {
  return (
    <div className="all-stories-view space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          All Stories
        </h2>
        <p className="text-gray-600 mt-2">
          Complete chronological listing of all Doctor Who content
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          All Stories View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will show the complete library with advanced filtering
        </p>
      </div>
    </div>
  );
};

export default AllStoriesView;