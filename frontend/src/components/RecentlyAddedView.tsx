/**
 * Recently Added View - Latest library additions
 */

import React from 'react';

const RecentlyAddedView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Recently Added
        </h2>
        <p className="text-gray-600 mt-2">
          Latest additions to the library
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Recently Added View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will show the newest items added to the library
        </p>
      </div>
    </div>
  );
};

export default RecentlyAddedView;