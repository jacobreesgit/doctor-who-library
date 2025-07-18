/**
 * Enrichment statistics component with interactive filtering
 */

import React from 'react';
import type { LibraryStatsResponse, EnrichmentStatus } from '../types/api';

interface EnrichmentStatsProps {
  stats?: LibraryStatsResponse;
  isLoading?: boolean;
  onFilterByStatus?: (status: EnrichmentStatus | null) => void;
  activeFilter?: EnrichmentStatus | null;
}

const EnrichmentStats: React.FC<EnrichmentStatsProps> = ({ 
  stats, 
  isLoading = false, 
  onFilterByStatus,
  activeFilter
}) => {
  if (isLoading || !stats) {
    return (
      <div className="enrichment-stats bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalItems = stats.total_items;
  const enrichedCount = stats.enrichment_stats.enriched || 0;
  const pendingCount = stats.enrichment_stats.pending || 0;
  const failedCount = stats.enrichment_stats.failed || 0;
  const skippedCount = stats.enrichment_stats.skipped || 0;

  const enrichmentProgress = totalItems > 0 ? (enrichedCount / totalItems) * 100 : 0;

  return (
    <div className="enrichment-stats bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Library Statistics</h2>
        {activeFilter && (
          <button
            onClick={() => onFilterByStatus?.(null)}
            className="text-sm text-gray-600 hover:text-gray-800 bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded-full transition-colors duration-200 flex items-center space-x-2"
          >
            <span>Filtered by: <span className="font-medium capitalize">{activeFilter}</span></span>
            <span className="text-lg">×</span>
          </button>
        )}
      </div>
      
      {/* Main Stats Grid - Clickable */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <button
          onClick={() => onFilterByStatus?.(null)}
          className={`text-center p-3 rounded-lg transition-all duration-200 ${
            activeFilter === null 
              ? 'bg-blue-50 border-2 border-blue-200 shadow-md' 
              : 'hover:bg-gray-50 hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold text-blue-600">{totalItems.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </button>
        
        <button
          onClick={() => onFilterByStatus?.('enriched')}
          className={`text-center p-3 rounded-lg transition-all duration-200 ${
            activeFilter === 'enriched' 
              ? 'bg-green-50 border-2 border-green-200 shadow-md' 
              : 'hover:bg-gray-50 hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold text-green-600">{enrichedCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Enriched</div>
        </button>
        
        <button
          onClick={() => onFilterByStatus?.('pending')}
          className={`text-center p-3 rounded-lg transition-all duration-200 ${
            activeFilter === 'pending' 
              ? 'bg-yellow-50 border-2 border-yellow-200 shadow-md' 
              : 'hover:bg-gray-50 hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold text-yellow-600">{pendingCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Pending</div>
        </button>
        
        <button
          onClick={() => onFilterByStatus?.('failed')}
          className={`text-center p-3 rounded-lg transition-all duration-200 ${
            activeFilter === 'failed' 
              ? 'bg-red-50 border-2 border-red-200 shadow-md' 
              : 'hover:bg-gray-50 hover:shadow-md'
          }`}
        >
          <div className="text-2xl font-bold text-red-600">{failedCount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Failed</div>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Enrichment Progress</span>
          <span className="text-sm text-gray-600">{enrichmentProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${enrichmentProgress}%` }}
          ></div>
        </div>
      </div>

      {/* Enrichment Status Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          <span>Enriched: {enrichedCount}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
          <span>Pending: {pendingCount}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          <span>Failed: {failedCount}</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
          <span>Skipped: {skippedCount}</span>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-600">
          <p className="mb-1">
            <span className="font-medium">{stats.total_sections}</span> sections • 
            <span className="font-medium ml-1">{stats.total_groups}</span> groups
          </p>
          <p className="text-xs text-gray-500">{stats.note}</p>
        </div>
      </div>
    </div>
  );
};

export default EnrichmentStats;