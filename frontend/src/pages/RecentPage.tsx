/**
 * Recent page - Personal activity and favorites
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ContinueWatchingView from '../components/ContinueWatchingView';
import RecentlyAddedView from '../components/RecentlyAddedView';
import FavoritesView from '../components/FavoritesView';

const RecentPage: React.FC = () => {
  return (
    <div className="recent-page space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Your Activity
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Continue where you left off and manage your personal library
        </p>
      </div>

      <Routes>
        <Route path="/" element={<Navigate to="/recent/continue" replace />} />
        <Route path="/continue" element={<ContinueWatchingView />} />
        <Route path="/added" element={<RecentlyAddedView />} />
        <Route path="/favorites" element={<FavoritesView />} />
      </Routes>
    </div>
  );
};

export default RecentPage;