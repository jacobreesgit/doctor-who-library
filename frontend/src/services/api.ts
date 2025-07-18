/**
 * API Service Layer for Doctor Who Library
 * 
 * Centralized API service providing type-safe HTTP client functionality
 * Features:
 * - Axios-based HTTP client with custom configuration
 * - Request/response interceptors for logging and error handling
 * - Comprehensive error handling with network fallbacks
 * - Type-safe API functions for all endpoints
 * - React Query integration with optimized query keys
 * - Health check functionality for service monitoring
 */

import axios, { type AxiosResponse } from 'axios';
import type {
  LibraryItemResponse,
  LibraryItemsQuery,
  LibrarySearchQuery,
  LibrarySearchResponse,
  LibraryStatsResponse,
  LibrarySectionResponse,
  ApiError
} from '../types/api';

// Configure axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        detail: error.response.data?.detail || 'An error occurred',
        status_code: error.response.status,
      };
      return Promise.reject(apiError);
    } else if (error.request) {
      // Network error
      const networkError: ApiError = {
        detail: 'Network error. Please check if the backend server is running.',
        status_code: 0,
      };
      return Promise.reject(networkError);
    } else {
      // Other error
      const unknownError: ApiError = {
        detail: error.message || 'An unknown error occurred',
      };
      return Promise.reject(unknownError);
    }
  }
);

// API functions
export const libraryApi = {
  /**
   * Get library items with optional filtering and pagination
   */
  async getLibraryItems(params: LibraryItemsQuery = {}): Promise<LibraryItemResponse[]> {
    const response = await api.get<{items: LibraryItemResponse[], total: number, page: number, size: number, pages: number}>('/library/items', { params });
    return response.data.items;
  },

  /**
   * Get a specific library item by ID
   */
  async getLibraryItem(itemId: string): Promise<LibraryItemResponse> {
    const response = await api.get<LibraryItemResponse>(`/library/items/${itemId}`);
    return response.data;
  },

  /**
   * Get library statistics
   */
  async getLibraryStats(): Promise<LibraryStatsResponse> {
    const response = await api.get<LibraryStatsResponse>('/library/stats');
    return response.data;
  },

  /**
   * Get all library sections
   */
  async getLibrarySections(): Promise<LibrarySectionResponse[]> {
    const response = await api.get<LibrarySectionResponse[]>('/library/sections');
    return response.data;
  },

  /**
   * Search library items
   */
  async searchLibrary(params: LibrarySearchQuery): Promise<LibrarySearchResponse> {
    const response = await api.get<LibrarySearchResponse>('/library/search', { params });
    return response.data;
  },
};

// Health check API
export const healthApi = {
  /**
   * Check API health
   */
  async checkHealth(): Promise<{ status: string; message: string }> {
    const response = await api.get<{ status: string; message: string }>('/health');
    return response.data;
  },
};

// Query keys for React Query
export const queryKeys = {
  library: {
    items: (params?: LibraryItemsQuery) => ['library', 'items', params],
    item: (id: string) => ['library', 'item', id],
    stats: () => ['library', 'stats'],
    sections: () => ['library', 'sections'],
    search: (query: LibrarySearchQuery) => ['library', 'search', query],
    enriched: () => ['library', 'enriched'],
    recent: () => ['library', 'recent'],
    byDoctor: (doctor: string) => ['library', 'byDoctor', doctor],
    spinoffs: () => ['library', 'spinoffs'],
    modernDoctors: () => ['library', 'modernDoctors'],
    classicDoctors: () => ['library', 'classicDoctors'],
    specialCollections: () => ['library', 'specialCollections'],
    villains: () => ['library', 'villains'],
    sampleStories: () => ['library', 'sampleStories'],
  },
  health: {
    check: () => ['health', 'check'],
  },
} as const;

// Helper function for search hook
export const searchLibraryItems = async (query: string, limit: number = 8): Promise<LibraryItemResponse[]> => {
  const searchParams: LibrarySearchQuery = { q: query, limit };
  const response = await libraryApi.searchLibrary(searchParams);
  return response.results;
};

export default api;