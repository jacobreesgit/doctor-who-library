/**
 * Advanced Real-Time Service Architecture
 * 
 * Comprehensive real-time update system for Doctor Who library
 * Features:
 * - Multi-channel event handling (SSE, WebSockets, Polling fallback)
 * - Intelligent reconnection strategies
 * - Event queuing and replay
 * - Performance optimization for large datasets
 * - Offline/online state management
 */

import { QueryClient } from '@tanstack/react-query';
import { useLibraryStore } from '../store/libraryStore';
import type { LibraryItem } from '../types/api';

// ============================================================================
// Event Types and Interfaces
// ============================================================================

interface RealTimeEvent {
  id: string;
  type: 'item_updated' | 'item_enriched' | 'bulk_update' | 'stats_updated' | 'heartbeat' | 'error';
  timestamp: number;
  data: any;
  priority?: 'high' | 'medium' | 'low';
  retryCount?: number;
}

interface ConnectionState {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error';
  lastConnected: number | null;
  reconnectAttempts: number;
  method: 'sse' | 'websocket' | 'polling';
}

interface RealTimeConfig {
  enableSSE: boolean;
  enableWebSocket: boolean;
  enablePolling: boolean;
  reconnectDelay: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  batchDelay: number;
  maxBatchSize: number;
  priorityChannels: string[];
  fallbackToPolling: boolean;
}

// ============================================================================
// Real-Time Service Class
// ============================================================================

class RealTimeService {
  private config: RealTimeConfig;
  private queryClient: QueryClient;
  private eventSource: EventSource | null = null;
  private webSocket: WebSocket | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private connectionState: ConnectionState;
  private eventQueue: RealTimeEvent[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(event: RealTimeEvent) => void>> = new Map();
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private heartbeatTimeout: NodeJS.Timeout | null = null;
  private isOnline: boolean = navigator.onLine;

  constructor(queryClient: QueryClient, config: Partial<RealTimeConfig> = {}) {
    this.queryClient = queryClient;
    this.config = {
      enableSSE: true,
      enableWebSocket: true,
      enablePolling: true,
      reconnectDelay: 1000,
      maxReconnectAttempts: 10,
      heartbeatInterval: 30000,
      batchDelay: 100,
      maxBatchSize: 50,
      priorityChannels: ['item_enriched', 'item_updated'],
      fallbackToPolling: true,
      ...config
    };

    this.connectionState = {
      status: 'disconnected',
      lastConnected: null,
      reconnectAttempts: 0,
      method: 'sse'
    };

    this.initializeOnlineHandlers();
  }

  // ============================================================================
  // Connection Management
  // ============================================================================

  async connect(): Promise<void> {
    if (this.connectionState.status === 'connected' || this.connectionState.status === 'connecting') {
      return;
    }

    this.connectionState.status = 'connecting';
    this.connectionState.reconnectAttempts = 0;

    try {
      // Try SSE first
      if (this.config.enableSSE) {
        await this.connectSSE();
        return;
      }

      // Fallback to WebSocket
      if (this.config.enableWebSocket) {
        await this.connectWebSocket();
        return;
      }

      // Final fallback to polling
      if (this.config.enablePolling) {
        this.startPolling();
        return;
      }

      throw new Error('No connection method available');
    } catch (error) {
      console.error('Failed to establish real-time connection:', error);
      this.handleConnectionError(error);
    }
  }

  private async connectSSE(): Promise<void> {
    this.eventSource = new EventSource('/api/enrichment/stream');
    this.connectionState.method = 'sse';

    this.eventSource.onopen = () => {
      this.handleConnectionOpen();
    };

    this.eventSource.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.eventSource.onerror = (error) => {
      this.handleConnectionError(error);
    };
  }

  private async connectWebSocket(): Promise<void> {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws/enrichment`;
    
    this.webSocket = new WebSocket(wsUrl);
    this.connectionState.method = 'websocket';

    this.webSocket.onopen = () => {
      this.handleConnectionOpen();
    };

    this.webSocket.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.webSocket.onerror = (error) => {
      this.handleConnectionError(error);
    };

    this.webSocket.onclose = () => {
      this.handleConnectionClose();
    };
  }

  private startPolling(): void {
    this.connectionState.method = 'polling';
    this.connectionState.status = 'connected';
    this.connectionState.lastConnected = Date.now();

    this.pollingInterval = setInterval(async () => {
      if (!this.isOnline) return;

      try {
        const response = await fetch('/api/enrichment/recent?since=' + (this.connectionState.lastConnected || 0));
        if (response.ok) {
          const events = await response.json();
          events.forEach((event: RealTimeEvent) => {
            this.handleMessage(JSON.stringify(event));
          });
        }
      } catch (error) {
        console.warn('Polling failed:', error);
      }
    }, 5000);
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    if (this.webSocket) {
      this.webSocket.close();
      this.webSocket = null;
    }

    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }

    this.clearTimeouts();
    this.connectionState.status = 'disconnected';
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  private handleConnectionOpen(): void {
    this.connectionState.status = 'connected';
    this.connectionState.lastConnected = Date.now();
    this.connectionState.reconnectAttempts = 0;

    this.startHeartbeat();
    this.processQueuedEvents();
    this.notifyListeners('connection_open', { method: this.connectionState.method });
  }

  private handleConnectionClose(): void {
    this.connectionState.status = 'disconnected';
    this.clearTimeouts();
    this.attemptReconnection();
  }

  private handleConnectionError(error: any): void {
    console.error('Real-time connection error:', error);
    this.connectionState.status = 'error';
    this.clearTimeouts();
    this.attemptReconnection();
  }

  private handleMessage(rawData: string): void {
    try {
      const event: RealTimeEvent = JSON.parse(rawData);
      event.timestamp = event.timestamp || Date.now();
      
      // Add to queue for batch processing
      this.eventQueue.push(event);
      
      // Process high-priority events immediately
      if (event.priority === 'high' || this.config.priorityChannels.includes(event.type)) {
        this.processEvent(event);
      } else {
        this.scheduleBatchProcessing();
      }
    } catch (error) {
      console.error('Failed to parse real-time message:', error);
    }
  }

  private scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatchedEvents();
    }, this.config.batchDelay);
  }

  private processBatchedEvents(): void {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.config.maxBatchSize);
    
    // Group events by type for efficient processing
    const eventsByType = new Map<string, RealTimeEvent[]>();
    
    batch.forEach(event => {
      if (!eventsByType.has(event.type)) {
        eventsByType.set(event.type, []);
      }
      eventsByType.get(event.type)!.push(event);
    });

    // Process each event type
    eventsByType.forEach((events, type) => {
      switch (type) {
        case 'item_updated':
        case 'item_enriched':
          this.handleItemUpdates(events);
          break;
        case 'bulk_update':
          this.handleBulkUpdate(events);
          break;
        case 'stats_updated':
          this.handleStatsUpdate(events);
          break;
        default:
          events.forEach(event => this.processEvent(event));
      }
    });
  }

  private processEvent(event: RealTimeEvent): void {
    this.notifyListeners(event.type, event);
  }

  private processQueuedEvents(): void {
    const queuedEvents = [...this.eventQueue];
    this.eventQueue = [];
    queuedEvents.forEach(event => this.processEvent(event));
  }

  // ============================================================================
  // Specific Event Handlers
  // ============================================================================

  private handleItemUpdates(events: RealTimeEvent[]): void {
    const items: LibraryItem[] = events.map(event => event.data);
    
    // Update React Query cache
    this.queryClient.setQueryData(['library-items'], (oldData: any) => {
      if (!oldData?.pages) return oldData;
      
      const updatedPages = oldData.pages.map((page: any) => ({
        ...page,
        items: page.items.map((item: LibraryItem) => {
          const update = items.find(updated => updated.id === item.id);
          return update || item;
        })
      }));
      
      return { ...oldData, pages: updatedPages };
    });

    // Notify listeners
    this.notifyListeners('items_updated', { items });
  }

  private handleBulkUpdate(events: RealTimeEvent[]): void {
    // Invalidate all queries for bulk updates
    this.queryClient.invalidateQueries({ queryKey: ['library-items'] });
    events.forEach(event => this.notifyListeners('bulk_update', event));
  }

  private handleStatsUpdate(events: RealTimeEvent[]): void {
    // Update stats cache
    this.queryClient.invalidateQueries({ queryKey: ['library-stats'] });
    events.forEach(event => this.notifyListeners('stats_updated', event));
  }

  // ============================================================================
  // Reconnection Logic
  // ============================================================================

  private attemptReconnection(): void {
    if (this.connectionState.reconnectAttempts >= this.config.maxReconnectAttempts) {
      if (this.config.fallbackToPolling && this.connectionState.method !== 'polling') {
        console.log('Falling back to polling...');
        this.connectionState.reconnectAttempts = 0;
        this.startPolling();
        return;
      }
      
      console.error('Max reconnection attempts reached');
      this.connectionState.status = 'error';
      return;
    }

    this.connectionState.status = 'reconnecting';
    this.connectionState.reconnectAttempts++;

    const delay = this.config.reconnectDelay * Math.pow(2, this.connectionState.reconnectAttempts - 1);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, delay);
  }

  // ============================================================================
  // Heartbeat Management
  // ============================================================================

  private startHeartbeat(): void {
    this.heartbeatTimeout = setTimeout(() => {
      this.sendHeartbeat();
    }, this.config.heartbeatInterval);
  }

  private sendHeartbeat(): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify({ type: 'heartbeat' }));
    }
    
    // Schedule next heartbeat
    this.startHeartbeat();
  }

  // ============================================================================
  // Online/Offline Handling
  // ============================================================================

  private initializeOnlineHandlers(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      if (this.connectionState.status === 'disconnected') {
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.disconnect();
    });
  }

  // ============================================================================
  // Event Listeners
  // ============================================================================

  addEventListener(eventType: string, listener: (event: RealTimeEvent) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  removeEventListener(eventType: string, listener: (event: RealTimeEvent) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private notifyListeners(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error('Listener error:', error);
        }
      });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private clearTimeouts(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    if (this.heartbeatTimeout) {
      clearTimeout(this.heartbeatTimeout);
      this.heartbeatTimeout = null;
    }
  }

  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  getQueueSize(): number {
    return this.eventQueue.length;
  }

  isConnected(): boolean {
    return this.connectionState.status === 'connected';
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  destroy(): void {
    this.disconnect();
    this.listeners.clear();
    this.eventQueue = [];
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let realTimeService: RealTimeService | null = null;

export const getRealTimeService = (queryClient: QueryClient): RealTimeService => {
  if (!realTimeService) {
    realTimeService = new RealTimeService(queryClient);
  }
  return realTimeService;
};

export default RealTimeService;