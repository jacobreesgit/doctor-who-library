/**
 * Search Hook with Backend API Integration
 * 
 * Custom hook for searching Doctor Who library content with debounced queries
 * Features:
 * - Debounced search to avoid excessive API calls
 * - Loading states and error handling
 * - Search result caching for performance
 * - Keyboard navigation support
 */

import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchLibraryItems } from '../services/api';
import type { LibraryItemResponse } from '../types/api';

type SearchResult = LibraryItemResponse;

interface UseSearchOptions {
  minLength?: number;
  debounceMs?: number;
  limit?: number;
}

interface UseSearchReturn {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  hasResults: boolean;
  selectedIndex: number;
  setQuery: (query: string) => void;
  clearSearch: () => void;
  selectNext: () => void;
  selectPrevious: () => void;
  selectResult: (index: number) => void;
  getSelectedResult: () => SearchResult | null;
}

export const useSearch = ({
  minLength = 2,
  debounceMs = 300,
  limit = 8
}: UseSearchOptions = {}): UseSearchReturn => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(-1);
  }, [debouncedQuery]);

  // Search API query
  const {
    data: results = [],
    isLoading,
    isError,
    error
  } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: () => searchLibraryItems(debouncedQuery, limit),
    enabled: debouncedQuery.length >= minLength,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const hasResults = results.length > 0;

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSelectedIndex(-1);
  }, []);

  const selectNext = useCallback(() => {
    setSelectedIndex(prev => 
      prev < results.length - 1 ? prev + 1 : prev
    );
  }, [results.length]);

  const selectPrevious = useCallback(() => {
    setSelectedIndex(prev => prev > -1 ? prev - 1 : -1);
  }, []);

  const selectResult = useCallback((index: number) => {
    setSelectedIndex(index);
  }, []);

  const getSelectedResult = useCallback(() => {
    if (selectedIndex >= 0 && selectedIndex < results.length) {
      return results[selectedIndex];
    }
    return null;
  }, [selectedIndex, results]);

  return {
    query,
    results,
    isLoading: isLoading && debouncedQuery.length >= minLength,
    isError,
    error: error as Error | null,
    hasResults,
    selectedIndex,
    setQuery,
    clearSearch,
    selectNext,
    selectPrevious,
    selectResult,
    getSelectedResult
  };
};