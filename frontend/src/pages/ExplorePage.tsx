/**
 * Explore page - Curated discovery and collections
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import FeaturedView from '../components/FeaturedView';
import CollectionsView from '../components/CollectionsView';
import NewAdditionsView from '../components/NewAdditionsView';

const ExplorePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Explore the Whoniverse
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Curated collections, featured content, and new discoveries
        </p>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/explore/featured" replace />} />
        <Route path="/featured" element={<FeaturedView />} />
        <Route path="/collections" element={<CollectionsView />} />
        <Route path="/collections/:collectionId" element={<CollectionsView />} />
        <Route path="/new" element={<NewAdditionsView />} />
      </Routes>
    </div>
  );
};

export default ExplorePage;