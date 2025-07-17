/**
 * Optimized Enrichment Monitor for Development
 * 
 * Enhanced with:
 * - Real-time Server-Sent Events (no polling)
 * - Unified display showing all enrichment data
 * - No artificial limits
 * - Better error handling and reconnection logic
 * - Comprehensive status display
 */

import EventSource from 'eventsource';
import { spawn } from 'child_process';

class OptimizedEnrichmentMonitor {
  constructor() {
    this.isActive = false;
    this.apiUrl = 'http://localhost:8000';
    this.eventSource = null;
    this.seenEnrichments = new Set();
    this.allItems = new Map(); // Track all enrichment items
    this.enrichedItems = new Map(); // Track enriched items for live table
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 1000;
    this.enrichmentProcess = null;
    this.liveTableDisplayed = false;
  }

  async start() {
    console.log('\n🚀 Optimized Enrichment Monitor: Starting...');
    console.log('📊 Loading comprehensive enrichment status...');
    console.log('🌐 Connecting to real-time updates...\n');
    
    this.isActive = true;
    
    // Load initial comprehensive status
    await this.loadComprehensiveStatus();
    
    // Start real-time monitoring
    this.startRealTimeMonitoring();
    
    // Auto-start enrichment if needed
    setTimeout(async () => {
      await this.autoStartEnrichment();
    }, 2000);
  }

  async loadComprehensiveStatus() {
    try {
      console.log('📋 COMPREHENSIVE ENRICHMENT STATUS:');
      console.log('═'.repeat(80));
      
      // Try the new unified API endpoint first, fallback to original if not available
      let response;
      try {
        response = await fetch(`${this.apiUrl}/api/enrichment/all?include_pending=true`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Fallback to original API if new endpoints aren't available
        response = await fetch(`${this.apiUrl}/api/library/items?limit=1000`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const items = data.items || [];
      const stats = data.stats || {};
      
      // Display comprehensive statistics
      this.displayStats(stats);
      
      // Display items by status
      this.displayItemsByStatus(items);
      
      // Store items for tracking
      items.forEach(item => {
        this.allItems.set(item.id, item);
        // Store enriched items for live table
        if (item.enrichment_status === 'enriched') {
          this.enrichedItems.set(item.id, item);
        }
      });
      
      // Display live enrichment table
      this.displayLiveEnrichmentTable();
      
      console.log('═'.repeat(80));
      console.log(`📊 Total Items: ${items.length}`);
      console.log(`⏳ Pending: ${stats.pending_count || 0}`);
      console.log(`✅ Enriched: ${stats.enriched_count || 0}`);
      console.log(`❌ Failed: ${stats.failed_count || 0}`);
      console.log(`⏭️ Skipped: ${stats.skipped_count || 0}`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Failed to load comprehensive status: ${error.message}`);
      console.log('💡 Using fallback loading method...\n');
      await this.loadFallbackStatus();
    }
  }

  displayStats(stats) {
    if (!stats || Object.keys(stats).length === 0) return;
    
    console.log('📈 ENRICHMENT STATISTICS:');
    console.log(`   Completion: ${(stats.completion_percentage || 0).toFixed(1)}%`);
    console.log(`   Success Rate: ${(stats.success_rate || 0).toFixed(1)}%`);
    console.log(`   Avg Confidence: ${(stats.avg_confidence || 0).toFixed(2)}`);
    console.log(`   Wiki Coverage: ${(stats.wiki_coverage_percentage || 0).toFixed(1)}%`);
    
    const recentHours = stats.recent_activity_hours || 24;
    console.log(`\n⚡ RECENT ACTIVITY (${recentHours}h):`);
    console.log(`   ✅ Enriched: ${stats.recent_enriched || 0}`);
    console.log(`   ❌ Failed: ${stats.recent_failed || 0}`);
    console.log(`   ⏭️ Skipped: ${stats.recent_skipped || 0}`);
    console.log('');
  }

  displayItemsByStatus(items) {
    const statusGroups = {
      'enriched': [],
      'pending': [],
      'failed': [],
      'skipped': []
    };
    
    // Group items by status
    items.forEach(item => {
      if (statusGroups[item.enrichment_status]) {
        statusGroups[item.enrichment_status].push(item);
      }
    });
    
    // Display each status group
    Object.entries(statusGroups).forEach(([status, statusItems]) => {
      if (statusItems.length === 0) return;
      
      const statusIcon = this.getStatusIcon(status);
      console.log(`\n${statusIcon} ${status.toUpperCase()} (${statusItems.length} items):`);
      
      // Show first 5 items, then summary
      const displayItems = statusItems.slice(0, 5);
      displayItems.forEach(item => {
        const confidence = item.enrichment_confidence ? `${Math.round(item.enrichment_confidence * 100)}%` : 'N/A';
        const wikiStatus = item.has_wiki_data ? '🔗' : '❌';
        const ageText = this.formatAge(item.activity_age_hours);
        
        console.log(`   ${item.title} (${confidence}) ${wikiStatus} ${ageText}`);
      });
      
      if (statusItems.length > 5) {
        console.log(`   ... and ${statusItems.length - 5} more items`);
      }
    });
  }

  displayLiveEnrichmentTable() {
    const enrichedArray = Array.from(this.enrichedItems.values());
    
    if (enrichedArray.length === 0) {
      console.log('\n📋 LIVE ENRICHMENT TABLE: No enriched items yet');
      return;
    }
    
    console.log('\n🔴 LIVE ENRICHMENT TABLE (Chronological Order):');
    console.log('═'.repeat(120));
    console.log('ID   | Title                                    | Confidence | Wiki | Updated');
    console.log('─'.repeat(120));
    
    // Sort by oldest first (chronological order from beginning)
    enrichedArray.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    
    enrichedArray.forEach((item, index) => {
      const id = String(index + 1).padStart(3, '0');
      const title = item.title.length > 40 ? item.title.substring(0, 37) + '...' : item.title.padEnd(40);
      const confidence = item.enrichment_confidence ? `${Math.round(item.enrichment_confidence * 100)}%`.padEnd(8) : 'N/A'.padEnd(8);
      const wikiStatus = item.has_wiki_data ? '🔗 Yes' : '❌ No ';
      const timestamp = new Date(item.updated_at).toLocaleTimeString();
      
      console.log(`${id}  | ${title} | ${confidence} | ${wikiStatus} | ${timestamp}`);
    });
    
    console.log('═'.repeat(120));
    console.log(`✅ Total Enriched Items: ${enrichedArray.length}`);
    console.log('🔄 This table shows chronological order from beginning. New items will be added at the end...\n');
    
    this.liveTableDisplayed = true;
  }

  displayNewlyEnrichedItems(newItems) {
    // Sort all enriched items to get correct IDs
    const enrichedArray = Array.from(this.enrichedItems.values());
    enrichedArray.sort((a, b) => new Date(a.updated_at) - new Date(b.updated_at));
    
    // Display each new item in table format
    newItems.forEach(item => {
      const itemIndex = enrichedArray.findIndex(enrichedItem => enrichedItem.id === item.id);
      const id = String(itemIndex + 1).padStart(3, '0');
      const title = item.title.length > 40 ? item.title.substring(0, 37) + '...' : item.title.padEnd(40);
      const confidence = item.enrichment_confidence ? `${Math.round(item.enrichment_confidence * 100)}%`.padEnd(8) : 'N/A'.padEnd(8);
      const wikiStatus = item.has_wiki_data ? '🔗 Yes' : '❌ No ';
      const timestamp = new Date(item.updated_at).toLocaleTimeString();
      
      console.log(`[MONITOR] ${id}  | ${title} | ${confidence} | ${wikiStatus} | ${timestamp}`);
    });
  }

  formatAge(hours) {
    if (hours < 1) return `${Math.round(hours * 60)}m ago`;
    if (hours < 24) return `${Math.round(hours)}h ago`;
    return `${Math.round(hours / 24)}d ago`;
  }

  async loadFallbackStatus() {
    try {
      // Fallback to original method if new API is not available
      const response = await fetch(`${this.apiUrl}/api/library/items?limit=100`);
      if (!response.ok) throw new Error('Fallback failed');
      
      const items = await response.json();
      console.log(`📋 Loaded ${items.length} items (fallback mode)`);
      
      // Display basic status
      const statusCounts = {};
      items.forEach(item => {
        statusCounts[item.enrichment_status] = (statusCounts[item.enrichment_status] || 0) + 1;
      });
      
      Object.entries(statusCounts).forEach(([status, count]) => {
        const icon = this.getStatusIcon(status);
        console.log(`${icon} ${status.toUpperCase()}: ${count}`);
      });
      
      console.log('');
    } catch (error) {
      console.log(`❌ Fallback loading failed: ${error.message}\n`);
    }
  }

  startRealTimeMonitoring() {
    console.log('🌐 Starting real-time monitoring...');
    
    // Close existing connection
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    // Create new Server-Sent Events connection
    this.eventSource = new EventSource(`${this.apiUrl}/api/enrichment/stream`);
    
    this.eventSource.onopen = () => {
      console.log('✅ Real-time connection established');
      this.reconnectAttempts = 0;
      console.log('');
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeUpdate(data);
      } catch (error) {
        console.log(`❌ Failed to parse real-time data: ${error.message}`);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.log(`❌ Real-time connection error: ${error.message || 'Unknown error'}`);
      this.handleReconnection();
    };
  }

  handleRealtimeUpdate(data) {
    switch (data.type) {
      case 'items_updated':
        this.handleItemsUpdated(data.items, data.stats);
        break;
      case 'heartbeat':
        // Optional: log heartbeat for debugging
        // console.log('💓 Heartbeat received');
        break;
      case 'error':
        console.log(`❌ Server error: ${data.message}`);
        break;
      default:
        console.log(`📨 Unknown update type: ${data.type}`);
    }
  }

  handleItemsUpdated(items, stats) {
    if (!items || items.length === 0) return;
    
    console.log(`📊 REAL-TIME UPDATE (${items.length} items):`);
    console.log('─'.repeat(60));
    
    let newlyEnriched = [];
    
    items.forEach(item => {
      const wasNew = !this.allItems.has(item.id);
      const oldItem = this.allItems.get(item.id);
      
      // Update our tracking
      this.allItems.set(item.id, item);
      
      // Check if this item was just enriched
      if (item.enrichment_status === 'enriched') {
        const wasAlreadyEnriched = this.enrichedItems.has(item.id);
        this.enrichedItems.set(item.id, item);
        
        if (!wasAlreadyEnriched) {
          newlyEnriched.push(item);
        }
      }
      
      // Log the update
      this.logItemUpdate(item, wasNew, oldItem);
    });
    
    // Show updated stats if available
    if (stats) {
      console.log(`\n📈 Updated Stats: ${stats.enriched_count || 0} enriched, ${stats.pending_count || 0} pending, ${stats.failed_count || 0} failed`);
    }
    
    // Update live table if there are newly enriched items
    if (newlyEnriched.length > 0) {
      console.log(`\n🔴 LIVE TABLE UPDATE: ${newlyEnriched.length} newly enriched items added to the end!`);
      this.displayNewlyEnrichedItems(newlyEnriched);
    }
    
    console.log('');
  }

  logItemUpdate(item, wasNew, oldItem) {
    const statusIcon = this.getStatusIcon(item.enrichment_status);
    const timestamp = new Date().toLocaleTimeString();
    const confidence = item.enrichment_confidence ? `${Math.round(item.enrichment_confidence * 100)}%` : 'N/A';
    const wikiStatus = item.has_wiki_data ? '🔗' : '❌';
    
    if (wasNew) {
      console.log(`[${timestamp}] 🆕 NEW: "${item.title}"`);
    } else {
      console.log(`[${timestamp}] ${statusIcon} UPDATED: "${item.title}"`);
    }
    
    console.log(`    📊 Status: ${item.enrichment_status.toUpperCase()} (${confidence})`);
    console.log(`    ${wikiStatus} Wiki: ${item.has_wiki_data ? 'Available' : 'None'}`);
    
    if (item.wiki_search_term) {
      console.log(`    🔍 Search: ${item.wiki_search_term}`);
    }
    
    if (item.wiki_url) {
      console.log(`    🔗 URL: ${item.wiki_url}`);
    }
    
    if (item.enrichment_error) {
      console.log(`    ❌ Error: ${item.enrichment_error}`);
    }
    
    console.log('');
  }

  handleReconnection() {
    if (!this.isActive) return;
    
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.log(`❌ Maximum reconnection attempts reached (${this.maxReconnectAttempts})`);
      console.log('💡 Falling back to manual polling...');
      this.startFallbackPolling();
      return;
    }
    
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    
    setTimeout(() => {
      if (this.isActive) {
        this.startRealTimeMonitoring();
      }
    }, delay);
  }

  startFallbackPolling() {
    console.log('🔄 Starting fallback polling mode...');
    
    this.pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${this.apiUrl}/api/enrichment/recent?hours=1`);
        if (!response.ok) return;
        
        const data = await response.json();
        const newItems = data.items.filter(item => !this.seenEnrichments.has(item.id));
        
        if (newItems.length > 0) {
          console.log(`📊 POLLING UPDATE (${newItems.length} new items):`);
          newItems.forEach(item => {
            this.logItemUpdate(item, true, null);
            this.seenEnrichments.add(item.id);
          });
        }
      } catch (error) {
        // Silently ignore polling errors
      }
    }, 5000); // Poll every 5 seconds in fallback mode
  }

  async autoStartEnrichment() {
    try {
      // Check if there are pending items
      const response = await fetch(`${this.apiUrl}/api/enrichment/stats`);
      if (!response.ok) return;
      
      const stats = await response.json();
      const pendingCount = stats.pending_count || 0;
      
      if (pendingCount === 0) {
        console.log('✅ No pending items - enrichment not needed');
        return;
      }
      
      console.log(`🎬 Auto-starting enrichment for ${pendingCount} pending items...`);
      
      // Start enrichment process with new unified command
      this.enrichmentProcess = spawn('poetry', ['run', 'dw-cli', 'enrich', '--show-all'], {
        cwd: '..',
        stdio: 'pipe'
      });
      
      this.enrichmentProcess.stdout.on('data', (data) => {
        // Don't log CLI output to avoid duplication
      });
      
      this.enrichmentProcess.stderr.on('data', (data) => {
        console.log(`⚠️  Enrichment Error: ${data.toString().trim()}`);
      });
      
      this.enrichmentProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Enrichment process completed successfully');
        } else {
          console.log(`❌ Enrichment process exited with code ${code}`);
        }
      });
      
      console.log('✅ Enrichment process started with live updates');
      console.log('');
      
    } catch (error) {
      console.log(`❌ Failed to auto-start enrichment: ${error.message}`);
      console.log('💡 You can manually run: poetry run dw-cli enrich');
      console.log('');
    }
  }

  getStatusIcon(status) {
    const icons = {
      'enriched': '✅',
      'pending': '⏳',
      'failed': '❌',
      'skipped': '⏭️',
      'reset': '🔄'
    };
    return icons[status] || '❓';
  }

  async showComprehensiveStatus() {
    try {
      const response = await fetch(`${this.apiUrl}/api/enrichment/all?include_pending=true`);
      if (!response.ok) return;
      
      const data = await response.json();
      const items = data.items || [];
      const stats = data.stats || {};
      
      console.log('\n📊 CURRENT COMPREHENSIVE STATUS:');
      console.log('═'.repeat(80));
      
      this.displayStats(stats);
      this.displayItemsByStatus(items);
      
      console.log('═'.repeat(80));
      console.log(`📊 Total: ${items.length} items`);
      console.log('');
      
    } catch (error) {
      console.log(`❌ Failed to load comprehensive status: ${error.message}`);
    }
  }

  stop() {
    this.isActive = false;
    
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    
    if (this.enrichmentProcess) {
      this.enrichmentProcess.kill();
      this.enrichmentProcess = null;
    }
    
    console.log('\n🛑 Optimized Enrichment Monitor: Stopped\n');
  }
}

// Start monitoring
const monitor = new OptimizedEnrichmentMonitor();
monitor.start();

// Handle graceful shutdown
process.on('SIGINT', () => {
  monitor.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  monitor.stop();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.log(`❌ Uncaught exception: ${error.message}`);
  monitor.stop();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.log(`❌ Unhandled rejection: ${reason}`);
  monitor.stop();
  process.exit(1);
});

// Export for testing
export { OptimizedEnrichmentMonitor };