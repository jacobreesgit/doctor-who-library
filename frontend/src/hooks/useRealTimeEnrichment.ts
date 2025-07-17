/**
 * Real-Time Enrichment Hook
 * 
 * Provides real-time synchronization with TARDIS Wiki enrichment process
 * Features:
 * - Server-Sent Events integration
 * - Optimistic updates with rollback
 * - Selective item updates to prevent UI disruption
 * - Performance optimizations for large collections
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { LibraryItem } from '../types/api';

interface EnrichmentUpdate {
  type: 'items_updated' | 'heartbeat' | 'error';
  items?: LibraryItem[];
  stats?: {
    enriched_count: number;
    pending_count: number;
    failed_count: number;
    completion_percentage: number;
  };
  message?: string;
}

interface UseRealTimeEnrichmentOptions {
  enabled?: boolean;
  itemIds?: string[]; // Listen only to specific items
  onUpdate?: (items: LibraryItem[]) => void;
  onError?: (error: string) => void;
  reconnectDelay?: number;
  maxReconnectAttempts?: number;
}

interface UseRealTimeEnrichmentReturn {
  isConnected: boolean;
  connectionState: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  lastUpdate: Date | null;
  stats: EnrichmentUpdate['stats'] | null;
  requestPriorityEnrichment: (itemId: string) => Promise<void>;
  pauseUpdates: () => void;
  resumeUpdates: () => void;
}

const useRealTimeEnrichment = (
  options: UseRealTimeEnrichmentOptions = {}
): UseRealTimeEnrichmentReturn => {
  const {
    enabled = true,
    itemIds,
    onUpdate,
    onError,
    reconnectDelay = 1000,
    maxReconnectAttempts = 10
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [connectionState, setConnectionState] = useState<UseRealTimeEnrichmentReturn['connectionState']>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [stats, setStats] = useState<EnrichmentUpdate['stats'] | null>(null);
  const [isPaused, setIsPaused] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  // Optimistic update tracking
  const optimisticUpdatesRef = useRef<Map<string, LibraryItem>>(new Map());
  const updateQueueRef = useRef<LibraryItem[]>([]);
  const batchUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Process batched updates to prevent UI thrashing
  const processBatchedUpdates = useCallback(() => {
    if (updateQueueRef.current.length === 0 || isPaused) return;

    const updates = [...updateQueueRef.current];
    updateQueueRef.current = [];

    // Group updates by query key for efficient cache updates
    const libraryItemsQuery = queryClient.getQueryData(['library-items']);
    
    if (libraryItemsQuery) {
      // Update query cache with new items
      queryClient.setQueryData(['library-items'], (oldData: any) => {
        if (!oldData?.items) return oldData;
        
        const updatedItems = oldData.items.map((item: LibraryItem) => {
          const update = updates.find(u => u.id === item.id);
          return update || item;
        });
        
        return {
          ...oldData,
          items: updatedItems
        };
      });
    }

    // Filter updates by itemIds if specified
    const filteredUpdates = itemIds 
      ? updates.filter(item => itemIds.includes(item.id))
      : updates;

    if (filteredUpdates.length > 0) {
      onUpdate?.(filteredUpdates);
    }

    // Update stats cache
    queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    
    setLastUpdate(new Date());
  }, [queryClient, onUpdate, itemIds, isPaused]);

  // Queue update for batching
  const queueUpdate = useCallback((items: LibraryItem[]) => {
    updateQueueRef.current.push(...items);
    
    // Clear existing timeout and set new one
    if (batchUpdateTimeoutRef.current) {
      clearTimeout(batchUpdateTimeoutRef.current);
    }
    
    batchUpdateTimeoutRef.current = setTimeout(processBatchedUpdates, 100);
  }, [processBatchedUpdates]);

  // Handle SSE message
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data: EnrichmentUpdate = JSON.parse(event.data);
      
      switch (data.type) {
        case 'items_updated':
          if (data.items && data.items.length > 0) {
            queueUpdate(data.items);
          }
          if (data.stats) {
            setStats(data.stats);
          }
          break;
          
        case 'heartbeat':
          // Update connection status
          setIsConnected(true);
          setConnectionState('connected');
          break;
          
        case 'error':
          onError?.(data.message || 'Unknown server error');
          break;
      }
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
      onError?.('Failed to parse real-time update');
    }
  }, [queueUpdate, onError]);

  // Establish SSE connection
  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return;

    setConnectionState('connecting');
    
    const eventSource = new EventSource('/api/enrichment/stream');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionState('connected');
      reconnectAttemptsRef.current = 0;
      
      // Clear any pending reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };

    eventSource.onmessage = handleMessage;

    eventSource.onerror = () => {
      setIsConnected(false);
      setConnectionState('disconnected');
      
      // Attempt reconnection
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        setConnectionState('reconnecting');
        reconnectAttemptsRef.current++;
        
        const delay = reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          eventSource.close();
          eventSourceRef.current = null;
          connect();
        }, delay);
      } else {
        onError?.('Maximum reconnection attempts reached');
      }
    };
  }, [enabled, handleMessage, onError, reconnectDelay, maxReconnectAttempts]);

  // Disconnect SSE
  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (batchUpdateTimeoutRef.current) {
      clearTimeout(batchUpdateTimeoutRef.current);
      batchUpdateTimeoutRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('disconnected');
  }, []);

  // Request priority enrichment for specific item
  const requestPriorityEnrichment = useCallback(async (itemId: string) => {
    try {
      // Optimistic update
      const optimisticItem = queryClient.getQueryData(['library-items'])?.items?.find(
        (item: LibraryItem) => item.id === itemId
      );
      
      if (optimisticItem) {
        const optimisticUpdate = {
          ...optimisticItem,
          enrichment_status: 'pending' as const,
          enrichment_priority: true
        };
        
        optimisticUpdatesRef.current.set(itemId, optimisticUpdate);
        queueUpdate([optimisticUpdate]);
      }

      const response = await fetch(`/api/enrichment/items/${itemId}/priority`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        // Rollback optimistic update
        optimisticUpdatesRef.current.delete(itemId);
        throw new Error('Failed to request priority enrichment');
      }

      // Success - optimistic update will be replaced by real-time update
      const result = await response.json();
      return result;
      
    } catch (error) {
      // Rollback optimistic update on error
      optimisticUpdatesRef.current.delete(itemId);
      throw error;
    }
  }, [queryClient, queueUpdate]);

  // Pause/resume updates
  const pauseUpdates = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeUpdates = useCallback(() => {
    setIsPaused(false);
    // Process any queued updates
    if (updateQueueRef.current.length > 0) {
      processBatchedUpdates();
    }
  }, [processBatchedUpdates]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionState,
    lastUpdate,
    stats,
    requestPriorityEnrichment,
    pauseUpdates,
    resumeUpdates
  };
};

export default useRealTimeEnrichment;