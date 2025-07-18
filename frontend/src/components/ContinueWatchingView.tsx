/**
 * Continue Watching View - Personal progress tracking
 */

import React from 'react';

const ContinueWatchingView: React.FC = () => {
  return (
    <div className="continue-watching-view space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Continue Watching
        </h2>
        <p className="text-gray-600 mt-2">
          Pick up where you left off
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Continue Watching Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will track your progress through multi-part stories
        </p>
      </div>
    </div>
  );
};

export default ContinueWatchingView;