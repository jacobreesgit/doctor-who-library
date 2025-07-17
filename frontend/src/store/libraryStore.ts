/**
 * Scalable State Management for Doctor Who Library
 * 
 * Combines React Query for server state with Zustand for complex UI state
 * Handles 6,401+ items with efficient state updates and real-time synchronization
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { LibraryItem } from '../types/api';

// ============================================================================
// UI State Management (Zustand)
// ============================================================================

interface FilterState {
  searchQuery: string;
  contentTypes: string[];
  sections: string[];
  enrichmentStatus: ('pending' | 'enriched' | 'failed' | 'skipped')[];
  confidenceRange: [number, number];
  sortBy: 'title' | 'date' | 'confidence' | 'section';
  sortOrder: 'asc' | 'desc';
}

interface ViewState {
  layout: 'grid' | 'list' | 'tiles';
  gridSize: 'small' | 'medium' | 'large';
  showEnrichmentStatus: boolean;
  showDetails: boolean;
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
}

interface SelectionState {
  selectedItems: string[];
  lastSelectedItem: string | null;
  selectionMode: boolean;
  multiSelectAnchor: string | null;
}

interface ScrollState {
  scrollPositions: Record<string, number>;
  virtualizedRange: { start: number; end: number };
  visibleItems: string[];
  preloadedItems: string[];
}

interface UserPreferences {
  favorites: string[];
  recentlyViewed: string[];
  preferredSections: string[];
  autoEnrichFavorites: boolean;
  enableNotifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

interface LibraryStore {
  // Filter state
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  
  // View state
  view: ViewState;
  setView: (view: Partial<ViewState>) => void;
  
  // Selection state
  selection: SelectionState;
  setSelectedItems: (items: string[]) => void;
  toggleItemSelection: (itemId: string, multiSelect?: boolean) => void;
  selectAll: (itemIds: string[]) => void;
  clearSelection: () => void;
  
  // Scroll state
  scroll: ScrollState;
  setScrollPosition: (route: string, position: number) => void;
  setVirtualizedRange: (range: { start: number; end: number }) => void;
  setVisibleItems: (items: string[]) => void;
  
  // User preferences
  preferences: UserPreferences;
  setPreferences: (prefs: Partial<UserPreferences>) => void;
  addToFavorites: (itemId: string) => void;
  removeFromFavorites: (itemId: string) => void;
  addToRecentlyViewed: (itemId: string) => void;
  
  // Computed selectors
  hasActiveFilters: () => boolean;
  getFilteredItemCount: () => number;
  getSelectedItemCount: () => number;
  
  // Actions
  bulkEnrichSelected: () => void;
  bulkFavoriteSelected: () => void;
  exportSelected: () => void;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  contentTypes: [],
  sections: [],
  enrichmentStatus: [],
  confidenceRange: [0, 100],
  sortBy: 'title',
  sortOrder: 'asc'
};

const defaultView: ViewState = {
  layout: 'grid',
  gridSize: 'medium',
  showEnrichmentStatus: true,
  showDetails: false,
  sidebarOpen: false,
  mobileMenuOpen: false
};

const defaultSelection: SelectionState = {
  selectedItems: [],
  lastSelectedItem: null,
  selectionMode: false,
  multiSelectAnchor: null
};

const defaultScroll: ScrollState = {
  scrollPositions: {},
  virtualizedRange: { start: 0, end: 50 },
  visibleItems: [],
  preloadedItems: []
};

const defaultPreferences: UserPreferences = {
  favorites: [],
  recentlyViewed: [],
  preferredSections: [],
  autoEnrichFavorites: true,
  enableNotifications: true,
  theme: 'auto'
};

export const useLibraryStore = create<LibraryStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        filters: defaultFilters,
        view: defaultView,
        selection: defaultSelection,
        scroll: defaultScroll,
        preferences: defaultPreferences,

        // Filter actions
        setFilters: (newFilters) => set((state) => {
          Object.assign(state.filters, newFilters);
        }),

        resetFilters: () => set((state) => {
          state.filters = defaultFilters;
        }),

        // View actions
        setView: (newView) => set((state) => {
          Object.assign(state.view, newView);
        }),

        // Selection actions
        setSelectedItems: (items) => set((state) => {
          state.selection.selectedItems = items;
          state.selection.lastSelectedItem = items[items.length - 1] || null;
        }),

        toggleItemSelection: (itemId, multiSelect = false) => set((state) => {
          const { selectedItems } = state.selection;
          const isSelected = selectedItems.includes(itemId);
          
          if (multiSelect) {
            if (isSelected) {
              state.selection.selectedItems = selectedItems.filter(id => id !== itemId);
            } else {
              state.selection.selectedItems.push(itemId);
            }
          } else {
            state.selection.selectedItems = isSelected ? [] : [itemId];
          }
          
          state.selection.lastSelectedItem = itemId;
          state.selection.selectionMode = state.selection.selectedItems.length > 0;
        }),

        selectAll: (itemIds) => set((state) => {
          state.selection.selectedItems = itemIds;
          state.selection.selectionMode = true;
        }),

        clearSelection: () => set((state) => {
          state.selection.selectedItems = [];
          state.selection.lastSelectedItem = null;
          state.selection.selectionMode = false;
          state.selection.multiSelectAnchor = null;
        }),

        // Scroll actions
        setScrollPosition: (route, position) => set((state) => {
          state.scroll.scrollPositions[route] = position;
        }),

        setVirtualizedRange: (range) => set((state) => {
          state.scroll.virtualizedRange = range;
        }),

        setVisibleItems: (items) => set((state) => {
          state.scroll.visibleItems = items;
        }),

        // Preference actions
        setPreferences: (newPrefs) => set((state) => {
          Object.assign(state.preferences, newPrefs);
        }),

        addToFavorites: (itemId) => set((state) => {
          if (!state.preferences.favorites.includes(itemId)) {
            state.preferences.favorites.push(itemId);
          }
        }),

        removeFromFavorites: (itemId) => set((state) => {
          state.preferences.favorites = state.preferences.favorites.filter(id => id !== itemId);
        }),

        addToRecentlyViewed: (itemId) => set((state) => {
          const recent = state.preferences.recentlyViewed.filter(id => id !== itemId);
          recent.unshift(itemId);
          state.preferences.recentlyViewed = recent.slice(0, 50); // Keep last 50 items
        }),

        // Computed selectors
        hasActiveFilters: () => {
          const { filters } = get();
          return !!(
            filters.searchQuery ||
            filters.contentTypes.length > 0 ||
            filters.sections.length > 0 ||
            filters.enrichmentStatus.length > 0 ||
            filters.confidenceRange[0] > 0 ||
            filters.confidenceRange[1] < 100
          );
        },

        getFilteredItemCount: () => {
          // This would integrate with React Query data
          return 0; // Placeholder
        },

        getSelectedItemCount: () => {
          return get().selection.selectedItems.length;
        },

        // Bulk actions
        bulkEnrichSelected: () => {
          const { selectedItems } = get().selection;
          // Trigger bulk enrichment API call
          console.log('Bulk enriching:', selectedItems);
        },

        bulkFavoriteSelected: () => {
          const { selectedItems } = get().selection;
          set((state) => {
            selectedItems.forEach(itemId => {
              if (!state.preferences.favorites.includes(itemId)) {
                state.preferences.favorites.push(itemId);
              }
            });
          });
        },

        exportSelected: () => {
          const { selectedItems } = get().selection;
          // Trigger export functionality
          console.log('Exporting:', selectedItems);
        }
      }))
    ),
    { name: 'library-store' }
  )
);

// ============================================================================
// Persistence Middleware
// ============================================================================

// Persist preferences to localStorage
useLibraryStore.subscribe(
  (state) => state.preferences,
  (preferences) => {
    localStorage.setItem('library-preferences', JSON.stringify(preferences));
  }
);

// Persist view state to sessionStorage
useLibraryStore.subscribe(
  (state) => state.view,
  (view) => {
    sessionStorage.setItem('library-view', JSON.stringify(view));
  }
);

// Persist scroll positions
useLibraryStore.subscribe(
  (state) => state.scroll.scrollPositions,
  (positions) => {
    sessionStorage.setItem('library-scroll', JSON.stringify(positions));
  }
);

// Load persisted state
const loadPersistedState = () => {
  try {
    const preferences = localStorage.getItem('library-preferences');
    const view = sessionStorage.getItem('library-view');
    const scroll = sessionStorage.getItem('library-scroll');

    if (preferences) {
      useLibraryStore.getState().setPreferences(JSON.parse(preferences));
    }
    if (view) {
      useLibraryStore.getState().setView(JSON.parse(view));
    }
    if (scroll) {
      useLibraryStore.getState().setScrollPosition('', 0);
      // Restore scroll positions
      const positions = JSON.parse(scroll);
      Object.entries(positions).forEach(([route, position]) => {
        useLibraryStore.getState().setScrollPosition(route, position as number);
      });
    }
  } catch (error) {
    console.warn('Failed to load persisted state:', error);
  }
};

// Initialize persisted state
if (typeof window !== 'undefined') {
  loadPersistedState();
}

// ============================================================================
// Selectors (for performance optimization)
// ============================================================================

export const selectFilters = (state: LibraryStore) => state.filters;
export const selectView = (state: LibraryStore) => state.view;
export const selectSelection = (state: LibraryStore) => state.selection;
export const selectPreferences = (state: LibraryStore) => state.preferences;
export const selectFavorites = (state: LibraryStore) => state.preferences.favorites;
export const selectSelectedItems = (state: LibraryStore) => state.selection.selectedItems;
export const selectHasActiveFilters = (state: LibraryStore) => state.hasActiveFilters();

// ============================================================================
// Custom Hooks for Common Operations
// ============================================================================

export const useFilters = () => {
  const filters = useLibraryStore(selectFilters);
  const setFilters = useLibraryStore(state => state.setFilters);
  const resetFilters = useLibraryStore(state => state.resetFilters);
  const hasActiveFilters = useLibraryStore(selectHasActiveFilters);

  return {
    filters,
    setFilters,
    resetFilters,
    hasActiveFilters
  };
};

export const useSelection = () => {
  const selection = useLibraryStore(selectSelection);
  const setSelectedItems = useLibraryStore(state => state.setSelectedItems);
  const toggleItemSelection = useLibraryStore(state => state.toggleItemSelection);
  const selectAll = useLibraryStore(state => state.selectAll);
  const clearSelection = useLibraryStore(state => state.clearSelection);

  return {
    selection,
    setSelectedItems,
    toggleItemSelection,
    selectAll,
    clearSelection
  };
};

export const useFavorites = () => {
  const favorites = useLibraryStore(selectFavorites);
  const addToFavorites = useLibraryStore(state => state.addToFavorites);
  const removeFromFavorites = useLibraryStore(state => state.removeFromFavorites);

  const isFavorite = (itemId: string) => favorites.includes(itemId);
  const toggleFavorite = (itemId: string) => {
    if (isFavorite(itemId)) {
      removeFromFavorites(itemId);
    } else {
      addToFavorites(itemId);
    }
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites
  };
};

export default useLibraryStore;