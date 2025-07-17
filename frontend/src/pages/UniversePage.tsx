/**
 * Universe page - Spin-offs and expanded content
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainShowsView from '../components/MainShowsView';
import AudioUniverseView from '../components/AudioUniverseView';
import DocumentariesView from '../components/DocumentariesView';

const UniversePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Doctor Who Universe
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Discover spin-offs, expanded universe content, and behind-the-scenes material
        </p>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/universe/shows" replace />} />
        <Route path="/shows" element={<MainShowsView />} />
        <Route path="/shows/:showId" element={<MainShowsView />} />
        <Route path="/audio" element={<AudioUniverseView />} />
        <Route path="/audio/:seriesId" element={<AudioUniverseView />} />
        <Route path="/documentaries" element={<DocumentariesView />} />
      </Routes>
    </div>
  );
};

export default UniversePage;