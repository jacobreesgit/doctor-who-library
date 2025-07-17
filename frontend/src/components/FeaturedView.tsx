/**
 * Featured View - Curated high-quality content
 */

import React from 'react';

const FeaturedView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Featured Content
        </h2>
        <p className="text-gray-600 mt-2">
          Curated selections of high-quality enriched content
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Featured View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will showcase the best enriched content with high confidence scores
        </p>
      </div>
    </div>
  );
};

export default FeaturedView;