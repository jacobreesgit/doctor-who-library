/**
 * Collections View - Themed story collections
 */

import React from 'react';

const CollectionsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Collections
        </h2>
        <p className="text-gray-600 mt-2">
          Themed collections like "Dalek Stories", "Christmas Specials", etc.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Collections View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will organize content into thematic collections
        </p>
      </div>
    </div>
  );
};

export default CollectionsView;