/**
 * Virtualized Library Grid Component
 * 
 * High-performance virtualization for large collections (6,401+ items)
 * Features:
 * - Windowing with react-window
 * - Infinite scrolling with React Query
 * - Real-time updates integration
 * - Responsive grid layout
 * - Mobile-optimized performance
 */

import React, { useCallback, useEffect, useRef, useMemo, useState } from 'react';
import { FixedSizeGrid as Grid, GridChildComponentProps } from 'react-window';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';
import InfiniteLoader from 'react-window-infinite-loader';
import { debounce } from 'lodash-es';

import { libraryApi } from '../services/api';
import { useLibraryStore } from '../store/libraryStore';
import { useRealTimeEnrichment } from '../hooks/useRealTimeEnrichment';
import { EnhancedContentCard } from './EnhancedContentCard';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorBoundary } from './ErrorBoundary';

import type { LibraryItem, LibraryItemsResponse } from '../types/api';

interface VirtualizedLibraryGridProps {
  className?: string;
  onItemClick?: (item: LibraryItem) => void;
  onItemSelect?: (item: LibraryItem, selected: boolean) => void;
}

interface GridItemData {
  items: LibraryItem[];
  columnCount: number;
  onItemClick?: (item: LibraryItem) => void;
  onItemSelect?: (item: LibraryItem, selected: boolean) => void;
  selectedItems: string[];
  favorites: string[];
  requestPriorityEnrichment: (itemId: string) => Promise<void>;
}

// ============================================================================
// Grid Item Component (Memoized for Performance)
// ============================================================================

const GridItem = React.memo<GridChildComponentProps<GridItemData>>(({ 
  columnIndex, 
  rowIndex, 
  style, 
  data 
}) => {
  const itemIndex = rowIndex * data.columnCount + columnIndex;
  const item = data.items[itemIndex];

  if (!item) {
    return (
      <div style={style} className="p-2">
        <div className="bg-gray-100 rounded-lg animate-pulse h-64" />
      </div>
    );
  }

  return (
    <div style={style} className="p-2">
      <EnhancedContentCard
        item={item}
        showEnrichmentStatus={true}
        onEnrichmentRequest={data.requestPriorityEnrichment}
        realTimeUpdates={true}
        className="h-full"
      />
    </div>
  );
});

GridItem.displayName = 'GridItem';

// ============================================================================
// Main Virtualized Grid Component
// ============================================================================

const VirtualizedLibraryGrid: React.FC<VirtualizedLibraryGridProps> = ({
  className = '',
  onItemClick,
  onItemSelect
}) => {
  const gridRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [columnCount, setColumnCount] = useState(3);
  const [itemHeight, setItemHeight] = useState(300);
  const [itemWidth, setItemWidth] = useState(250);

  // Store state
  const { filters, view, selection } = useLibraryStore();
  const { selectedItems } = selection;
  const { favorites } = useLibraryStore(state => state.preferences);

  // Real-time enrichment
  const { requestPriorityEnrichment, isConnected } = useRealTimeEnrichment({
    onUpdate: (items) => {
      // Invalidate queries to trigger re-render of updated items
      queryClient.invalidateQueries({ queryKey: ['library-items'] });
    }
  });

  // ============================================================================
  // Infinite Query for Large Dataset
  // ============================================================================

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch
  } = useInfiniteQuery({
    queryKey: ['library-items', filters],
    queryFn: ({ pageParam = 0 }) => 
      libraryApi.getLibraryItems({
        page: pageParam,
        limit: 100, // Fetch 100 items per page
        ...filters
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.page < lastPage.total_pages - 1) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true
  });

  // Flatten all pages into single array
  const items = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  const totalItemCount = data?.pages[0]?.total_items || 0;
  const hasLoadedAll = items.length >= totalItemCount;

  // ============================================================================
  // Responsive Grid Calculations
  // ============================================================================

  const calculateGridDimensions = useCallback(() => {
    if (!gridRef.current) return;

    const container = gridRef.current.parentElement;
    if (!container) return;

    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Calculate columns based on view settings and screen size
    let cols = 3;
    if (view.gridSize === 'small') cols = 5;
    else if (view.gridSize === 'medium') cols = 3;
    else if (view.gridSize === 'large') cols = 2;

    // Responsive adjustments
    if (containerWidth < 640) cols = 1;
    else if (containerWidth < 1024) cols = Math.min(cols, 2);
    else if (containerWidth < 1280) cols = Math.min(cols, 3);

    const itemW = Math.floor((containerWidth - (cols + 1) * 16) / cols);
    const itemH = view.layout === 'compact' ? 200 : 300;

    setColumnCount(cols);
    setItemWidth(itemW);
    setItemHeight(itemH);
    setDimensions({ width: containerWidth, height: containerHeight });
  }, [view.gridSize, view.layout]);

  const debouncedCalculateGridDimensions = useMemo(
    () => debounce(calculateGridDimensions, 100),
    [calculateGridDimensions]
  );

  // ============================================================================
  // Effects
  // ============================================================================

  useEffect(() => {
    calculateGridDimensions();
    window.addEventListener('resize', debouncedCalculateGridDimensions);
    return () => {
      window.removeEventListener('resize', debouncedCalculateGridDimensions);
      debouncedCalculateGridDimensions.cancel();
    };
  }, [calculateGridDimensions, debouncedCalculateGridDimensions]);

  // Recalculate when view settings change
  useEffect(() => {
    calculateGridDimensions();
  }, [view.gridSize, view.layout, calculateGridDimensions]);

  // ============================================================================
  // Infinite Loading Logic
  // ============================================================================

  const itemCount = hasLoadedAll ? items.length : items.length + 1;
  const rowCount = Math.ceil(itemCount / columnCount);

  const isItemLoaded = useCallback((index: number) => {
    return index < items.length;
  }, [items.length]);

  const loadMoreItems = useCallback(async () => {
    if (hasNextPage && !isFetchingNextPage) {
      await fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ============================================================================
  // Grid Item Data
  // ============================================================================

  const gridItemData: GridItemData = useMemo(() => ({
    items,
    columnCount,
    onItemClick,
    onItemSelect,
    selectedItems,
    favorites,
    requestPriorityEnrichment
  }), [
    items,
    columnCount,
    onItemClick,
    onItemSelect,
    selectedItems,
    favorites,
    requestPriorityEnrichment
  ]);

  // ============================================================================
  // Render States
  // ============================================================================

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center">
          <p className="text-red-600 mb-4">Failed to load library items</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-center text-gray-500">
          <p>No items found</p>
          {filters.searchQuery && (
            <p className="text-sm">Try adjusting your search or filters</p>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`relative ${className}`} style={{ height: dimensions.height }}>
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
        minimumBatchSize={50}
        threshold={25}
      >
        {({ onItemsRendered, ref }) => (
          <Grid
            ref={(grid) => {
              gridRef.current = grid;
              ref(grid);
            }}
            className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
            columnCount={columnCount}
            columnWidth={itemWidth}
            height={dimensions.height}
            width={dimensions.width}
            rowCount={rowCount}
            rowHeight={itemHeight}
            itemData={gridItemData}
            onItemsRendered={({ 
              visibleColumnStartIndex, 
              visibleColumnStopIndex, 
              visibleRowStartIndex, 
              visibleRowStopIndex 
            }) => {
              // Convert grid coordinates to flat list indices
              const startIndex = visibleRowStartIndex * columnCount + visibleColumnStartIndex;
              const stopIndex = visibleRowStopIndex * columnCount + visibleColumnStopIndex;
              
              onItemsRendered({
                overscanStartIndex: startIndex,
                overscanStopIndex: stopIndex,
                visibleStartIndex: startIndex,
                visibleStopIndex: stopIndex
              });
            }}
            overscanRowCount={2}
            overscanColumnCount={1}
          >
            {GridItem}
          </Grid>
        )}
      </InfiniteLoader>

      {/* Loading indicator for infinite scroll */}
      {isFetchingNextPage && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
            <LoadingSpinner size="small" />
            <span className="text-sm text-gray-600">Loading more items...</span>
          </div>
        </div>
      )}

      {/* Connection status indicator */}
      {!isConnected && (
        <div className="absolute top-4 right-4 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
          Real-time updates disconnected
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Error Boundary Wrapper
// ============================================================================

const VirtualizedLibraryGridWithErrorBoundary: React.FC<VirtualizedLibraryGridProps> = (props) => {
  return (
    <ErrorBoundary fallback={<div>Something went wrong with the library grid</div>}>
      <VirtualizedLibraryGrid {...props} />
    </ErrorBoundary>
  );
};

export default VirtualizedLibraryGridWithErrorBoundary;