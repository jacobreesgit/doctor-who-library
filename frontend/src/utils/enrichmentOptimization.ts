/**
 * Enrichment Performance Optimization Utilities
 * 
 * Provides performance optimizations for real-time enrichment updates
 * Features:
 * - Selective rendering for visible items
 * - Batched updates with debouncing
 * - Image lazy loading with preloading
 * - Intersection observer for viewport optimization
 * - Memory management for large collections
 */

import type { LibraryItem } from '../types/api';

interface ViewportItem {
  id: string;
  element: HTMLElement;
  isVisible: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface OptimizationConfig {
  batchSize: number;
  debounceMs: number;
  maxConcurrentImages: number;
  viewportBuffer: number;
  memoryThreshold: number;
  preloadRadius: number;
}

class EnrichmentOptimizer {
  private viewportItems: Map<string, ViewportItem> = new Map();
  private intersectionObserver: IntersectionObserver | null = null;
  private updateQueue: LibraryItem[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private imageLoadQueue: string[] = [];
  private loadingImages: Set<string> = new Set();
  private imageCache: Map<string, HTMLImageElement> = new Map();
  private config: OptimizationConfig;

  constructor(config: Partial<OptimizationConfig> = {}) {
    this.config = {
      batchSize: 50,
      debounceMs: 100,
      maxConcurrentImages: 6,
      viewportBuffer: 200,
      memoryThreshold: 100,
      preloadRadius: 2,
      ...config
    };

    this.initializeIntersectionObserver();
  }

  /**
   * Initialize intersection observer for viewport tracking
   */
  private initializeIntersectionObserver() {
    if (typeof window === 'undefined') return;

    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const itemId = entry.target.getAttribute('data-item-id');
          if (!itemId) return;

          const viewportItem = this.viewportItems.get(itemId);
          if (viewportItem) {
            viewportItem.isVisible = entry.isIntersecting;
            
            // Trigger image preloading for visible items
            if (entry.isIntersecting) {
              this.scheduleImagePreload(itemId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: `${this.config.viewportBuffer}px`,
        threshold: [0, 0.1, 0.5, 1.0]
      }
    );
  }

  /**
   * Register an item for viewport tracking
   */
  registerItem(itemId: string, element: HTMLElement, priority: 'high' | 'medium' | 'low' = 'medium') {
    const viewportItem: ViewportItem = {
      id: itemId,
      element,
      isVisible: false,
      priority
    };

    this.viewportItems.set(itemId, viewportItem);
    this.intersectionObserver?.observe(element);
  }

  /**
   * Unregister an item from viewport tracking
   */
  unregisterItem(itemId: string) {
    const viewportItem = this.viewportItems.get(itemId);
    if (viewportItem) {
      this.intersectionObserver?.unobserve(viewportItem.element);
      this.viewportItems.delete(itemId);
    }
  }

  /**
   * Queue updates for batched processing
   */
  queueUpdate(items: LibraryItem[]) {
    this.updateQueue.push(...items);
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }
    
    this.batchTimeout = setTimeout(() => {
      this.processBatchedUpdates();
    }, this.config.debounceMs);
  }

  /**
   * Process batched updates with viewport prioritization
   */
  private processBatchedUpdates() {
    if (this.updateQueue.length === 0) return;

    // Sort updates by priority
    const sortedUpdates = this.prioritizeUpdates(this.updateQueue);
    
    // Process in batches to avoid blocking UI
    const batches = this.createBatches(sortedUpdates, this.config.batchSize);
    
    this.updateQueue = [];
    
    // Process batches with requestAnimationFrame for smooth updates
    this.processBatchesSequentially(batches);
  }

  /**
   * Prioritize updates based on viewport visibility and user engagement
   */
  private prioritizeUpdates(items: LibraryItem[]): LibraryItem[] {
    return items.sort((a, b) => {
      const aViewport = this.viewportItems.get(a.id);
      const bViewport = this.viewportItems.get(b.id);
      
      // Visible items get highest priority
      if (aViewport?.isVisible && !bViewport?.isVisible) return -1;
      if (!aViewport?.isVisible && bViewport?.isVisible) return 1;
      
      // Then by item priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      const aPriority = priorityOrder[aViewport?.priority || 'medium'];
      const bPriority = priorityOrder[bViewport?.priority || 'medium'];
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      
      // Finally by enrichment status (newly enriched items first)
      if (a.enrichment_status === 'enriched' && b.enrichment_status !== 'enriched') return -1;
      if (a.enrichment_status !== 'enriched' && b.enrichment_status === 'enriched') return 1;
      
      return 0;
    });
  }

  /**
   * Create batches from sorted updates
   */
  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Process batches sequentially with RAF
   */
  private processBatchesSequentially(batches: LibraryItem[][]) {
    if (batches.length === 0) return;

    const processBatch = (batchIndex: number) => {
      if (batchIndex >= batches.length) return;
      
      const batch = batches[batchIndex];
      
      // Trigger React updates for this batch
      this.triggerBatchUpdate(batch);
      
      // Schedule next batch
      requestAnimationFrame(() => {
        processBatch(batchIndex + 1);
      });
    };

    processBatch(0);
  }

  /**
   * Trigger batch update (to be implemented by consumer)
   */
  private triggerBatchUpdate(batch: LibraryItem[]) {
    // This would typically trigger a React state update
    // Implementation depends on specific state management solution
    console.log(`Processing batch of ${batch.length} items`);
  }

  /**
   * Schedule image preloading for visible items
   */
  private scheduleImagePreload(itemId: string) {
    if (this.imageLoadQueue.includes(itemId)) return;
    
    this.imageLoadQueue.push(itemId);
    this.processImageQueue();
  }

  /**
   * Process image loading queue with concurrency control
   */
  private processImageQueue() {
    while (
      this.imageLoadQueue.length > 0 && 
      this.loadingImages.size < this.config.maxConcurrentImages
    ) {
      const itemId = this.imageLoadQueue.shift();
      if (itemId) {
        this.preloadImage(itemId);
      }
    }
  }

  /**
   * Preload image with caching
   */
  private async preloadImage(itemId: string) {
    // Get image URL from item data
    const imageUrl = this.getImageUrl(itemId);
    if (!imageUrl || this.imageCache.has(imageUrl)) return;

    this.loadingImages.add(itemId);

    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
      });

      img.src = imageUrl;
      await loadPromise;
      
      // Cache the loaded image
      this.imageCache.set(imageUrl, img);
      
      // Preload adjacent images
      this.preloadAdjacentImages(itemId);
      
    } catch (error) {
      console.warn(`Failed to preload image for item ${itemId}:`, error);
    } finally {
      this.loadingImages.delete(itemId);
      this.processImageQueue();
    }
  }

  /**
   * Preload images for adjacent items
   */
  private preloadAdjacentImages(itemId: string) {
    // Implementation would depend on item ordering/pagination
    // This is a placeholder for the concept
    console.log(`Preloading adjacent images for ${itemId}`);
  }

  /**
   * Get image URL for an item
   */
  private getImageUrl(itemId: string): string | null {
    // This would typically fetch from your data source
    // Placeholder implementation
    return null;
  }

  /**
   * Clean up memory by removing old cached images
   */
  private cleanupImageCache() {
    if (this.imageCache.size <= this.config.memoryThreshold) return;

    // Remove oldest cached images
    const entries = Array.from(this.imageCache.entries());
    const toRemove = entries.slice(0, entries.length - this.config.memoryThreshold);
    
    toRemove.forEach(([url]) => {
      this.imageCache.delete(url);
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics() {
    return {
      viewportItems: this.viewportItems.size,
      queuedUpdates: this.updateQueue.length,
      loadingImages: this.loadingImages.size,
      cachedImages: this.imageCache.size,
      visibleItems: Array.from(this.viewportItems.values())
        .filter(item => item.isVisible).length
    };
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
    
    this.viewportItems.clear();
    this.updateQueue = [];
    this.imageLoadQueue = [];
    this.loadingImages.clear();
    this.imageCache.clear();
  }
}

// Singleton instance
export const enrichmentOptimizer = new EnrichmentOptimizer();

// Hook for React integration
export const useEnrichmentOptimization = () => {
  return {
    registerItem: enrichmentOptimizer.registerItem.bind(enrichmentOptimizer),
    unregisterItem: enrichmentOptimizer.unregisterItem.bind(enrichmentOptimizer),
    queueUpdate: enrichmentOptimizer.queueUpdate.bind(enrichmentOptimizer),
    getMetrics: enrichmentOptimizer.getMetrics.bind(enrichmentOptimizer)
  };
};

export default EnrichmentOptimizer;