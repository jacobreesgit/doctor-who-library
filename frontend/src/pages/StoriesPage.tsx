/**
 * Stories page - Primary content discovery by Doctor, format, or chronology
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DoctorEraView from '../components/DoctorEraView';
import FormatView from '../components/FormatView';
import AllStoriesView from '../components/AllStoriesView';

const StoriesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Doctor Who Stories
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore the complete collection of Doctor Who adventures across all eras and formats
        </p>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/stories/doctors" replace />} />
        <Route path="/doctors" element={<DoctorEraView />} />
        <Route path="/doctors/:doctorId" element={<DoctorEraView />} />
        <Route path="/formats" element={<FormatView />} />
        <Route path="/formats/:formatId" element={<FormatView />} />
        <Route path="/all" element={<AllStoriesView />} />
      </Routes>
    </div>
  );
};

export default StoriesPage;