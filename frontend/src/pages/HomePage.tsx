/**
 * Home page component for Doctor Who Library
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryApi, queryKeys } from '../services/api';
import EnrichmentStats from '../components/EnrichmentStats';
import LibraryGrid from '../components/LibraryGrid';
import EnrichmentManager from '../components/EnrichmentManager';
import type { ApiError, EnrichmentStatus } from '../types/api';

const HomePage: React.FC = () => {
  const [enrichmentFilter, setEnrichmentFilter] = useState<EnrichmentStatus | null>(null);
  // Fetch library statistics
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: queryKeys.library.stats(),
    queryFn: libraryApi.getLibraryStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="home-page space-y-8">
      {/* Page Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Doctor Who Library
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore the comprehensive collection of Doctor Who stories, episodes, and media 
          with enriched metadata from the TARDIS Wiki.
        </p>
      </div>

      {/* Statistics Section */}
      {statsError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div className="text-red-600 font-medium mb-2">Error Loading Statistics</div>
          <p className="text-red-600 text-sm">
{(statsError as unknown as ApiError)?.detail || (statsError as Error)?.message || 'Failed to load statistics'}
          </p>
        </div>
      ) : (
        <EnrichmentStats 
          stats={stats} 
          isLoading={statsLoading}
          onFilterByStatus={setEnrichmentFilter}
          activeFilter={enrichmentFilter}
        />
      )}

      {/* Instructions and Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Getting Started
          </h2>
          <div className="text-blue-800 text-sm space-y-2">
            <p>
              <strong>Backend Status:</strong> Make sure the FastAPI server is running with{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">poetry run dw-serve</code>
            </p>
            <p>
              <strong>Data Import:</strong> Import chronology data with{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">
                poetry run dw-cli convert data/raw/DOCTOR\ WHO\ CHRONOLOGY.xlsx --clear
              </code>
            </p>
            <p>
              <strong>Enrichment:</strong> Enrich with wiki data using{' '}
              <code className="bg-blue-100 px-2 py-1 rounded">poetry run dw-cli enrich</code>
            </p>
          </div>
        </div>

        {/* Global Enrichment Management */}
        <EnrichmentManager variant="global" />
      </div>

      {/* Library Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Library Items
        </h2>
        <LibraryGrid 
          itemsPerPage={50} 
          enrichmentFilter={enrichmentFilter}
        />
      </div>
    </div>
  );
};

export default HomePage;