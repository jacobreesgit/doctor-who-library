/**
 * Audio Universe View - Big Finish and audio content
 */

import React from 'react';

const AudioUniverseView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Audio Universe
        </h2>
        <p className="text-gray-600 mt-2">
          Big Finish Productions and audio adventures
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Audio Universe View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will organize audio content by series and character
        </p>
      </div>
    </div>
  );
};

export default AudioUniverseView;