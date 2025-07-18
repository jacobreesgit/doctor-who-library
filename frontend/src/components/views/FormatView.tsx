/**
 * Format View - Browse by content type (TV/Audio/Books)
 */

import React from 'react';

const FormatView: React.FC = () => {
  return (
    <div className="format-view space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Browse by Format
        </h2>
        <p className="text-gray-600 mt-2">
          Explore content by media type
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Format View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will organize content by TV Episodes, Audio Adventures, Books, etc.
        </p>
      </div>
    </div>
  );
};

export default FormatView;