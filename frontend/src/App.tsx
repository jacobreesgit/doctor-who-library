/**
 * Main App component for Doctor Who Library
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import StoriesPage from './pages/StoriesPage';
import UniversePage from './pages/UniversePage';
import ExplorePage from './pages/ExplorePage';
import RecentPage from './pages/RecentPage';
import HomePage from './pages/HomePage';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

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
      <Router>
        <ErrorBoundary>
          <div className="min-h-screen bg-gray-50">
            <Header />
            <Navigation />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/stories/*" element={<StoriesPage />} />
                <Route path="/universe/*" element={<UniversePage />} />
                <Route path="/explore/*" element={<ExplorePage />} />
                <Route path="/recent/*" element={<RecentPage />} />
                <Route path="/dev" element={<HomePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </main>
          </div>
          <ReactQueryDevtools initialIsOpen={false} />
        </ErrorBoundary>
      </Router>
    </QueryClientProvider>
  );
}

// Simple NotFound component
const NotFoundPage = () => (
  <div className="text-center py-12">
    <h1 className="text-2xl font-bold text-gray-900 mb-4">Page Not Found</h1>
    <p className="text-gray-600">The page you're looking for doesn't exist.</p>
  </div>
);

export default App;