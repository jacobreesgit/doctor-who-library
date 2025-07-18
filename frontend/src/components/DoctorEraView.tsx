/**
 * Doctor Era View - Browse stories by Doctor
 */

import React from 'react';
import { useParams } from 'react-router-dom';

const DoctorEraView: React.FC = () => {
  const { doctorId } = useParams();

  return (
    <div className="doctor-era-view space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {doctorId ? `${doctorId} Stories` : 'Browse by Doctor'}
        </h2>
        <p className="text-gray-600 mt-2">
          Explore Doctor Who stories organized by era
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Doctor Era View Coming Soon
        </h3>
        <p className="text-blue-800">
          This view will show Doctor-specific story collections with visual timelines
        </p>
      </div>
    </div>
  );
};

export default DoctorEraView;