/**
 * New Additions View - Recently enriched content
 */

import React from 'react';

const NewAdditionsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          New Additions
        </h2>
        <p className="text-gray-600 mt-2">
          Recently enriched content and latest additions
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          New Additions View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will show recently enriched items and new library additions
        </p>
      </div>
    </div>
  );
};

export default NewAdditionsView;