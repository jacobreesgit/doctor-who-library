/**
 * EnrichmentManager - Component for managing enrichment data
 */

import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface EnrichmentManagerProps {
  itemId?: string;
  itemTitle?: string;
  onClose?: () => void;
  variant?: 'individual' | 'global';
}

interface ResetResponse {
  status: string;
  message: string;
  affected_items: number;
}

const EnrichmentManager: React.FC<EnrichmentManagerProps> = ({
  itemId,
  itemTitle,
  onClose,
  variant = 'individual'
}) => {
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const queryClient = useQueryClient();

  const resetMutation = useMutation({
    mutationFn: async (): Promise<ResetResponse> => {
      const url = variant === 'global' 
        ? '/api/enrichment/reset'
        : `/api/enrichment/items/${itemId}/reset`;
        
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to reset enrichment');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
      queryClient.invalidateQueries({ queryKey: ['library-stats'] });
      
      // Show success message
      console.log('✅', data.message);
      
      // Close dialog
      setIsConfirmingReset(false);
      onClose?.();
    },
    onError: (error: Error) => {
      console.error('❌ Reset failed:', error.message);
      setIsConfirmingReset(false);
    },
  });

  const handleReset = () => {
    setIsConfirmingReset(true);
  };

  const handleConfirmReset = () => {
    resetMutation.mutate();
  };

  const handleCancelReset = () => {
    setIsConfirmingReset(false);
  };

  if (variant === 'global') {
    return (
      <div className="bg-white rounded-lg shadow-md border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-red-600 text-lg">⚠️</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Enrichment Management</h3>
            <p className="text-sm text-gray-600">Reset all enrichment data</p>
          </div>
        </div>

        {!isConfirmingReset ? (
          <div>
            <p className="text-gray-700 mb-4">
              This will reset all enrichment data (Wiki URLs, summaries, images, etc.) for every item 
              in the library. Items will return to "pending" status.
            </p>
            
            <button
              onClick={handleReset}
              disabled={resetMutation.isPending}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
            >
              {resetMutation.isPending ? 'Resetting...' : 'Reset All Enrichments'}
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <h4 className="font-semibold text-red-800 mb-2">⚠️ Confirm Reset All</h4>
              <p className="text-red-700 text-sm">
                This action cannot be undone. All enrichment data will be permanently removed 
                from the database.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmReset}
                disabled={resetMutation.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                {resetMutation.isPending ? 'Resetting...' : 'Yes, Reset All'}
              </button>
              
              <button
                onClick={handleCancelReset}
                disabled={resetMutation.isPending}
                className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resetMutation.error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-red-700 text-sm">
              Error: {resetMutation.error.message}
            </p>
          </div>
        )}
      </div>
    );
  }

  // Individual item variant
  return (
    <div className="inline-block">
      {!isConfirmingReset ? (
        <button
          onClick={handleReset}
          disabled={resetMutation.isPending}
          className="text-red-600 hover:text-red-800 text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
          title={`Reset enrichment for "${itemTitle}"`}
        >
          <span>🔄</span>
          <span>{resetMutation.isPending ? 'Resetting...' : 'Reset'}</span>
        </button>
      ) : (
        <div className="flex items-center space-x-2">
          <span className="text-red-700 text-sm font-medium">Reset enrichment?</span>
          
          <button
            onClick={handleConfirmReset}
            disabled={resetMutation.isPending}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
          >
            {resetMutation.isPending ? 'Resetting...' : 'Yes'}
          </button>
          
          <button
            onClick={handleCancelReset}
            disabled={resetMutation.isPending}
            className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs font-medium transition-colors duration-200"
          >
            No
          </button>
        </div>
      )}

      {resetMutation.error && (
        <div className="absolute z-10 mt-1 bg-red-50 border border-red-200 rounded-md p-2 shadow-lg">
          <p className="text-red-700 text-xs">
            Error: {resetMutation.error.message}
          </p>
        </div>
      )}
    </div>
  );
};

export default EnrichmentManager;