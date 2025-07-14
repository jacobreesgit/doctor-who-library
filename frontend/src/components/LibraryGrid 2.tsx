/**
 * Library grid component for displaying paginated library items
 */

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { libraryApi, queryKeys } from '../services/api';
import type { LibraryItemResponse, ApiError } from '../types/api';
import LibraryCard from './LibraryCard';
import LoadingSpinner from './LoadingSpinner';

interface LibraryGridProps {
  itemsPerPage?: number;
}

const LibraryGrid: React.FC<LibraryGridProps> = ({ itemsPerPage = 50 }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<LibraryItemResponse | null>(null);

  // Calculate offset for API call
  const offset = (currentPage - 1) * itemsPerPage;

  // Fetch library items
  const {
    data: items = [],
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.library.items({ limit: itemsPerPage, offset }),
    queryFn: () => libraryApi.getLibraryItems({ limit: itemsPerPage, offset }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)
  });

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle item click
  const handleItemClick = (item: LibraryItemResponse) => {
    setSelectedItem(item);
  };

  // Handle modal close
  const handleModalClose = () => {
    setSelectedItem(null);
  };

  // Error state
  if (error) {
    const apiError = error as ApiError;
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <div className="text-red-600 font-medium mb-2">Error Loading Library Items</div>
        <p className="text-red-600 text-sm mb-4">{apiError.detail}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="py-12">
        <LoadingSpinner size="lg" text="Loading library items..." />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
        <div className="text-gray-600 text-lg mb-2">No library items found</div>
        <p className="text-gray-500 text-sm">
          Try refreshing the page or check if the backend server is running.
        </p>
      </div>
    );
  }

  const hasNextPage = items.length === itemsPerPage;
  const hasPrevPage = currentPage > 1;

  return (
    <div className="space-y-6">
      {/* Loading indicator for pagination */}
      {isFetching && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 text-sm">Loading page {currentPage}...</div>
        </div>
      )}

      {/* Items count */}
      <div className="text-sm text-gray-600">
        Showing {items.length} items (Page {currentPage})
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <LibraryCard
            key={item.id}
            item={item}
            onClick={() => handleItemClick(item)}
          />
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevPage}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hasPrevPage
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Previous
        </button>

        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Page {currentPage}</span>
          {hasNextPage && (
            <>
              <span className="text-gray-400">•</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Next page
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            hasNextPage
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Next
        </button>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem.display_title}
                </h2>
                <button
                  onClick={handleModalClose}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Details</h3>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium">ID:</span> {selectedItem.id}</div>
                      <div><span className="font-medium">Title:</span> {selectedItem.title}</div>
                      {selectedItem.content_type && (
                        <div><span className="font-medium">Type:</span> {selectedItem.content_type}</div>
                      )}
                      {selectedItem.doctor && (
                        <div><span className="font-medium">Doctor:</span> {selectedItem.doctor}</div>
                      )}
                      {selectedItem.companions && (
                        <div><span className="font-medium">Companions:</span> {selectedItem.companions}</div>
                      )}
                      {selectedItem.writer && (
                        <div><span className="font-medium">Writer:</span> {selectedItem.writer}</div>
                      )}
                      {selectedItem.director && (
                        <div><span className="font-medium">Director:</span> {selectedItem.director}</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Enrichment</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium">Status:</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                          selectedItem.enrichment_status === 'enriched' ? 'bg-green-100 text-green-800' :
                          selectedItem.enrichment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          selectedItem.enrichment_status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedItem.enrichment_status}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span>
                        <span className="ml-2">{Math.round(selectedItem.enrichment_confidence * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LibraryGrid;