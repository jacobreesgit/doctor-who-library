/**
 * Mobile Performance Optimization Utilities
 * 
 * Comprehensive mobile optimization for Doctor Who library
 * Features:
 * - Device capability detection
 * - Performance monitoring
 * - Adaptive rendering strategies
 * - Touch optimization
 * - Battery and network awareness
 */

import { debounce, throttle } from 'lodash-es';

// ============================================================================
// Device Capability Detection
// ============================================================================

interface DeviceCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  hasTouch: boolean;
  deviceMemory: number;
  cpuCores: number;
  connectionType: string;
  connectionSpeed: 'slow' | 'medium' | 'fast';
  batteryLevel: number;
  isLowPowerMode: boolean;
  screenSize: { width: number; height: number };
  pixelRatio: number;
  supportedFormats: {
    webp: boolean;
    avif: boolean;
    webm: boolean;
  };
}

export class DeviceCapabilityDetector {
  private capabilities: DeviceCapabilities;
  private listeners: Map<string, Set<(capabilities: DeviceCapabilities) => void>> = new Map();

  constructor() {
    this.capabilities = this.detectCapabilities();
    this.setupEventListeners();
  }

  private detectCapabilities(): DeviceCapabilities {
    const userAgent = navigator.userAgent;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?!.*Mobile)/i.test(userAgent);
    const isDesktop = !isMobile && !isTablet;

    return {
      isMobile,
      isTablet,
      isDesktop,
      hasTouch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
      deviceMemory: (navigator as any).deviceMemory || 4,
      cpuCores: navigator.hardwareConcurrency || 4,
      connectionType: this.getConnectionType(),
      connectionSpeed: this.getConnectionSpeed(),
      batteryLevel: 1,
      isLowPowerMode: false,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      pixelRatio: window.devicePixelRatio || 1,
      supportedFormats: {
        webp: this.supportsFormat('webp'),
        avif: this.supportsFormat('avif'),
        webm: this.supportsFormat('webm')
      }
    };
  }

  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection?.effectiveType || 'unknown';
  }

  private getConnectionSpeed(): 'slow' | 'medium' | 'fast' {
    const connection = (navigator as any).connection;
    if (!connection) return 'medium';

    const effectiveType = connection.effectiveType;
    if (effectiveType === 'slow-2g' || effectiveType === '2g') return 'slow';
    if (effectiveType === '3g') return 'medium';
    return 'fast';
  }

  private supportsFormat(format: string): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    try {
      return canvas.toDataURL(`image/${format}`).startsWith(`data:image/${format}`);
    } catch {
      return false;
    }
  }

  private setupEventListeners(): void {
    // Screen orientation and resize
    window.addEventListener('resize', debounce(() => {
      this.capabilities.screenSize = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      this.notifyListeners('screenChange');
    }, 100));

    // Network change
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', () => {
        this.capabilities.connectionType = this.getConnectionType();
        this.capabilities.connectionSpeed = this.getConnectionSpeed();
        this.notifyListeners('connectionChange');
      });
    }

    // Battery status
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        this.capabilities.batteryLevel = battery.level;
        this.capabilities.isLowPowerMode = battery.level < 0.2 && !battery.charging;

        battery.addEventListener('levelchange', () => {
          this.capabilities.batteryLevel = battery.level;
          this.capabilities.isLowPowerMode = battery.level < 0.2 && !battery.charging;
          this.notifyListeners('batteryChange');
        });

        battery.addEventListener('chargingchange', () => {
          this.capabilities.isLowPowerMode = battery.level < 0.2 && !battery.charging;
          this.notifyListeners('batteryChange');
        });
      });
    }
  }

  private notifyListeners(event: string): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(this.capabilities));
    }
  }

  public getCapabilities(): DeviceCapabilities {
    return { ...this.capabilities };
  }

  public addEventListener(event: string, listener: (capabilities: DeviceCapabilities) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
  }

  public removeEventListener(event: string, listener: (capabilities: DeviceCapabilities) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }
}

// ============================================================================
// Performance Monitoring
// ============================================================================

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  interactionLatency: number;
  scrollPerformance: number;
  imageLoadTime: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private fpsCounter: number = 0;
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private isMonitoring: boolean = false;

  constructor() {
    this.metrics = {
      fps: 0,
      memoryUsage: 0,
      renderTime: 0,
      interactionLatency: 0,
      scrollPerformance: 0,
      imageLoadTime: 0
    };
  }

  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.monitorFPS();
    this.monitorMemory();
    this.monitorInteractions();
    this.monitorScrollPerformance();
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
  }

  private monitorFPS(): void {
    const measureFPS = (currentTime: number) => {
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = currentTime;
        this.frameCount = 0;
      }

      this.frameCount++;
      const elapsed = currentTime - this.lastFrameTime;

      if (elapsed >= 1000) {
        this.metrics.fps = (this.frameCount * 1000) / elapsed;
        this.frameCount = 0;
        this.lastFrameTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFPS);
      }
    };

    requestAnimationFrame(measureFPS);
  }

  private monitorMemory(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
      }, 5000);
    }
  }

  private monitorInteractions(): void {
    let interactionStart: number = 0;

    const measureInteraction = (event: Event) => {
      interactionStart = performance.now();
    };

    const measureInteractionEnd = () => {
      if (interactionStart > 0) {
        this.metrics.interactionLatency = performance.now() - interactionStart;
        interactionStart = 0;
      }
    };

    ['click', 'touchstart'].forEach(event => {
      document.addEventListener(event, measureInteraction);
    });

    ['transitionend', 'animationend'].forEach(event => {
      document.addEventListener(event, measureInteractionEnd);
    });
  }

  private monitorScrollPerformance(): void {
    let scrollStart: number = 0;
    let frameCount: number = 0;

    const scrollHandler = throttle(() => {
      if (scrollStart === 0) {
        scrollStart = performance.now();
        frameCount = 0;
      }
      frameCount++;
    }, 16);

    const scrollEndHandler = debounce(() => {
      if (scrollStart > 0) {
        const duration = performance.now() - scrollStart;
        this.metrics.scrollPerformance = frameCount / (duration / 1000);
        scrollStart = 0;
      }
    }, 100);

    window.addEventListener('scroll', scrollHandler);
    window.addEventListener('scroll', scrollEndHandler);
  }

  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public isPerformanceGood(): boolean {
    return (
      this.metrics.fps > 30 &&
      this.metrics.memoryUsage < 0.8 &&
      this.metrics.interactionLatency < 100
    );
  }
}

// ============================================================================
// Adaptive Rendering Strategies
// ============================================================================

export class AdaptiveRenderer {
  private deviceCapabilities: DeviceCapabilities;
  private performanceMonitor: PerformanceMonitor;
  private renderQuality: 'low' | 'medium' | 'high' = 'medium';

  constructor(deviceCapabilities: DeviceCapabilities, performanceMonitor: PerformanceMonitor) {
    this.deviceCapabilities = deviceCapabilities;
    this.performanceMonitor = performanceMonitor;
    this.updateRenderQuality();
  }

  private updateRenderQuality(): void {
    const metrics = this.performanceMonitor.getMetrics();
    
    if (this.deviceCapabilities.isLowPowerMode || 
        this.deviceCapabilities.connectionSpeed === 'slow' ||
        this.deviceCapabilities.deviceMemory < 4) {
      this.renderQuality = 'low';
    } else if (metrics.fps < 30 || metrics.memoryUsage > 0.7) {
      this.renderQuality = 'medium';
    } else {
      this.renderQuality = 'high';
    }
  }

  public getOptimalImageProps(width: number, height: number): {
    src: string;
    sizes: string;
    loading: 'lazy' | 'eager';
    decoding: 'async' | 'sync';
    quality: number;
  } {
    const pixelRatio = this.deviceCapabilities.pixelRatio;
    const connectionSpeed = this.deviceCapabilities.connectionSpeed;
    
    let quality = 80;
    let loading: 'lazy' | 'eager' = 'lazy';
    let decoding: 'async' | 'sync' = 'async';
    
    if (connectionSpeed === 'slow' || this.renderQuality === 'low') {
      quality = 60;
      loading = 'lazy';
    } else if (connectionSpeed === 'fast' && this.renderQuality === 'high') {
      quality = 90;
      loading = 'eager';
    }
    
    const optimizedWidth = Math.ceil(width * pixelRatio);
    const optimizedHeight = Math.ceil(height * pixelRatio);
    
    return {
      src: `https://images.example.com/optimize?w=${optimizedWidth}&h=${optimizedHeight}&q=${quality}`,
      sizes: `${width}px`,
      loading,
      decoding,
      quality
    };
  }

  public getOptimalGridSize(): { columns: number; itemHeight: number } {
    const screenWidth = this.deviceCapabilities.screenSize.width;
    let columns = 3;
    let itemHeight = 300;
    
    if (this.deviceCapabilities.isMobile) {
      columns = screenWidth < 400 ? 1 : 2;
      itemHeight = this.renderQuality === 'low' ? 200 : 250;
    } else if (this.deviceCapabilities.isTablet) {
      columns = screenWidth < 800 ? 2 : 3;
      itemHeight = this.renderQuality === 'low' ? 250 : 300;
    } else {
      columns = Math.floor(screenWidth / 300);
      itemHeight = this.renderQuality === 'low' ? 300 : 350;
    }
    
    return { columns, itemHeight };
  }

  public shouldUseAnimations(): boolean {
    return (
      this.renderQuality !== 'low' &&
      !this.deviceCapabilities.isLowPowerMode &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  public getOptimalBatchSize(): number {
    if (this.deviceCapabilities.deviceMemory < 4) return 25;
    if (this.deviceCapabilities.deviceMemory < 8) return 50;
    return 100;
  }

  public getRenderQuality(): 'low' | 'medium' | 'high' {
    return this.renderQuality;
  }
}

// ============================================================================
// Touch Optimization
// ============================================================================

export class TouchOptimizer {
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } = { x: 0, y: 0 };
  private isScrolling: boolean = false;

  constructor() {
    this.setupTouchOptimizations();
  }

  private setupTouchOptimizations(): void {
    // Prevent 300ms click delay
    document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: true });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
    
    // Optimize scroll performance
    this.optimizeScrolling();
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.touchStartTime = performance.now();
    this.touchStartPosition = { x: touch.clientX, y: touch.clientY };
    this.isScrolling = false;
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isScrolling) {
      const touch = event.touches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartPosition.x);
      const deltaY = Math.abs(touch.clientY - this.touchStartPosition.y);
      
      if (deltaX > 10 || deltaY > 10) {
        this.isScrolling = true;
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touchDuration = performance.now() - this.touchStartTime;
    
    if (!this.isScrolling && touchDuration < 300) {
      // Fast tap - could trigger immediate action
      this.handleFastTap(event);
    }
  }

  private handleFastTap(event: TouchEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('[data-fast-tap]')) {
      // Dispatch immediate click for fast tap elements
      target.click();
    }
  }

  private optimizeScrolling(): void {
    // Use passive event listeners for better scroll performance
    const scrollOptions = { passive: true };
    
    document.addEventListener('scroll', throttle(() => {
      // Optimize scroll-based operations
      this.updateVisibleElements();
    }, 16), scrollOptions);
  }

  private updateVisibleElements(): void {
    // Intersection observer logic would go here
    // This is handled by the virtualization system
  }

  public createOptimizedTouchHandler(callback: (event: TouchEvent) => void): (event: TouchEvent) => void {
    return throttle(callback, 16);
  }
}

// ============================================================================
// Singleton Instances
// ============================================================================

export const deviceCapabilityDetector = new DeviceCapabilityDetector();
export const performanceMonitor = new PerformanceMonitor();
export const adaptiveRenderer = new AdaptiveRenderer(
  deviceCapabilityDetector.getCapabilities(),
  performanceMonitor
);
export const touchOptimizer = new TouchOptimizer();

// ============================================================================
// React Hooks for Mobile Optimization
// ============================================================================

export const useMobileOptimization = () => {
  const [capabilities, setCapabilities] = React.useState(deviceCapabilityDetector.getCapabilities());
  const [metrics, setMetrics] = React.useState(performanceMonitor.getMetrics());

  React.useEffect(() => {
    const handleCapabilityChange = (newCapabilities: DeviceCapabilities) => {
      setCapabilities(newCapabilities);
    };

    deviceCapabilityDetector.addEventListener('any', handleCapabilityChange);
    
    const metricsInterval = setInterval(() => {
      setMetrics(performanceMonitor.getMetrics());
    }, 1000);

    return () => {
      deviceCapabilityDetector.removeEventListener('any', handleCapabilityChange);
      clearInterval(metricsInterval);
    };
  }, []);

  return {
    capabilities,
    metrics,
    adaptiveRenderer,
    touchOptimizer,
    isPerformanceGood: performanceMonitor.isPerformanceGood()
  };
};

export default {
  deviceCapabilityDetector,
  performanceMonitor,
  adaptiveRenderer,
  touchOptimizer,
  useMobileOptimization
};