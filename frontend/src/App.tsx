/**
 * Main App Component for Doctor Who Library
 * 
 * Root application component that provides the core application structure
 * Features:
 * - React Query client configuration with optimized defaults
 * - Router-based navigation with protected routes
 * - Error boundary for graceful error handling
 * - Combined header and navigation component
 * - Main content area with route-based page rendering
 * - Development tools integration (React Query DevTools)
 * - Simplified navigation without Universe dropdown and API docs
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { HeaderNavigation } from './components/layout';
import { Footer } from './components/layout';
import { ErrorBoundary } from './components/common';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

// Lazy load all pages for code splitting
const LandingPage = lazy(() => import('./pages/LandingPage'));
const StoriesPage = lazy(() => import('./pages/StoriesPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const RecentPage = lazy(() => import('./pages/RecentPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const CollectionsPage = lazy(() => import('./pages/CollectionsPage'));
const CollectionDetailPage = lazy(() => import('./pages/CollectionDetailPage'));
const ItemDetailPage = lazy(() => import('./pages/ItemDetailPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const WatchHistoryPage = lazy(() => import('./pages/WatchHistoryPage'));

// Lazy load dev tools only in development
const ReactQueryDevtools = lazy(() => import('@tanstack/react-query-devtools').then(module => ({ default: module.ReactQueryDevtools })));

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <div className="app min-h-screen bg-gray-50 flex flex-col">
              <HeaderNavigation />
              <main className="container mx-auto px-4 py-8 flex-1">
                <Suspense fallback={<LoadingSpinner />}>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/stories/*" element={<StoriesPage />} />
                    <Route path="/explore/*" element={<ExplorePage />} />
                    <Route path="/recent/*" element={<RecentPage />} />
                    <Route path="/dev" element={<HomePage />} />
                    <Route path="/collections" element={<CollectionsPage />} />
                    <Route path="/collections/:sectionName" element={<CollectionDetailPage />} />
                    <Route path="/item/:itemId" element={<ItemDetailPage />} />
                    <Route path="/auth/callback" element={<AuthCallbackPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/watch-history" element={<WatchHistoryPage />} />
                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </Suspense>
              </main>
              <Footer />
            </div>
            {process.env.NODE_ENV === 'development' && (
              <Suspense fallback={null}>
                <ReactQueryDevtools initialIsOpen={false} />
              </Suspense>
            )}
          </ErrorBoundary>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

// Loading spinner component for lazy loading
const LoadingSpinner = () => (
  <div className="loading-spinner flex justify-center items-center py-12">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Loading...</span>
  </div>
);

// Simple NotFound component
const NotFoundPage = () => (
  <div className="not-found-page text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
  </div>
);

export default App;