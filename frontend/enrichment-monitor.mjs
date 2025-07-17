/**
 * Enrichment Monitor for Development
 * Polls the backend API and logs enrichment activity to the terminal
 * Only runs during npm run start:dev
 */

class EnrichmentMonitor {
  constructor() {
    this.isActive = false;
    this.apiUrl = 'http://localhost:8000';
    this.pollInterval = null;
    this.seenEnrichments = new Set();
    this.lastCheckTime = new Date().toISOString();
  }

  async start() {
    console.log('\n🔧 Enrichment Monitor: Starting...');
    console.log('📋 Monitoring backend for enrichment activity...');
    console.log('🚀 Auto-starting enrichment from first entry...\n');
    
    this.isActive = true;
    
    // Wait a moment for backend to start, then show first entry status and auto-start enrichment
    setTimeout(async () => {
      await this.showFirstEntryStatus();
      await this.startEnrichment();
      this.checkActivity();
      
      // Poll every 1 second for real-time monitoring
      this.pollInterval = setInterval(() => {
        this.checkActivity();
      }, 1000);
    }, 3000);
  }

  async showFirstEntryStatus() {
    try {
      console.log('📊 CHRONOLOGICAL STATUS UP TO LAST ENRICHMENT:');
      console.log('═'.repeat(50));
      
      // First, find the last enriched episode position
      let lastEnrichedIndex = -1;
      let allItems = [];
      
      // Get all items to find the last enriched position
      let offset = 0;
      const limit = 1000; // Use maximum allowed limit
      let hasMore = true;
      
      while (hasMore) {
        const response = await fetch(`${this.apiUrl}/api/library/items?limit=${limit}&offset=${offset}`);
        if (!response.ok) break;
        
        const items = await response.json();
        if (!items || items.length === 0) break;
        
        allItems.push(...items);
        offset += limit;
        hasMore = items.length === limit;
      }
      
      // Find the last enriched episode in chronological order
      for (let i = allItems.length - 1; i >= 0; i--) {
        if (allItems[i].enrichment_status === 'enriched') {
          lastEnrichedIndex = i;
          break;
        }
      }
      
      // Show status from Fast Times up to last enriched episode
      const endIndex = lastEnrichedIndex >= 0 ? lastEnrichedIndex + 1 : Math.min(10, allItems.length);
      
      for (let i = 0; i < endIndex; i++) {
        const item = allItems[i];
        const statusIcon = this.getStatusIcon(item.enrichment_status);
        const confidence = item.enrichment_confidence ? Math.round(item.enrichment_confidence * 100) + '%' : 'N/A';
        
        console.log(`${statusIcon} "${item.title}" - ${item.enrichment_status.toUpperCase()} (${confidence})`);
      }
      
      console.log('═'.repeat(50));
      if (lastEnrichedIndex >= 0) {
        console.log(`📍 Last enriched: "${allItems[lastEnrichedIndex].title}"`);
        console.log(`🎯 Will continue from episode ${lastEnrichedIndex + 2}`);
      } else {
        console.log('🎯 Starting enrichment from first episode');
      }
      console.log('');
    } catch (error) {
      console.log('❌ Could not load chronological status');
    }
  }

  getStatusIcon(status) {
    switch (status) {
      case 'enriched': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'skipped': return '⏭️';
      default: return '❓';
    }
  }

  async startEnrichment() {
    try {
      console.log('🎬 Starting unlimited enrichment from first pending entry...');
      
      const { spawn } = await import('child_process');
      const enrichProcess = spawn('poetry', ['run', 'dw-cli', 'enrich'], {
        cwd: '..',
        stdio: 'pipe'
      });
      
      enrichProcess.stdout.on('data', (data) => {
        // Don't log CLI output to avoid duplication with our monitor
      });
      
      enrichProcess.stderr.on('data', (data) => {
        console.log(`⚠️  Enrichment Error: ${data.toString().trim()}`);
      });
      
      console.log('✅ Enrichment process started in background\n');
      
    } catch (error) {
      console.log(`❌ Failed to start enrichment: ${error.message}`);
      console.log('💡 You can manually run: poetry run dw-cli enrich\n');
    }
  }

  async checkActivity() {
    try {
      // Check for new enrichments since last check
      await this.checkNewEnrichments();
      
    } catch (error) {
      // Silently ignore network errors
    }
  }

  async checkNewEnrichments() {
    try {
      const response = await fetch(`${this.apiUrl}/api/dev/recent-enrichments?limit=20&since=${encodeURIComponent(this.lastCheckTime)}`);
      if (!response.ok) {
        return;
      }
      
      const data = await response.json();
      
      // Process new enrichments in chronological order (oldest first)
      const newEnrichments = data.recent_enrichments
        .filter(item => !this.seenEnrichments.has(item.id))
        .reverse(); // Reverse to show oldest first
      
      for (const item of newEnrichments) {
        this.logIndividualEnrichment(item);
        this.seenEnrichments.add(item.id);
      }
      
      // Update last check time
      if (data.recent_enrichments.length > 0) {
        this.lastCheckTime = new Date().toISOString();
      }
      
    } catch (error) {
      // Silently ignore network errors
    }
  }

  logIndividualEnrichment(item) {
    const confidence = Math.round(item.confidence * 100);
    const wikiStatus = item.wiki_url ? '✅' : '❌';
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`[${timestamp}] ✅ ENRICHED: "${item.title}"`);
    console.log(`    📊 Confidence: ${confidence}%`);
    if (item.wiki_search_term) {
      console.log(`    🔍 Search Term: ${item.wiki_search_term}`);
    }
    if (item.wiki_url) {
      console.log(`    🔗 Wiki URL: ${item.wiki_url}`);
    }
    console.log(`    ${wikiStatus} Status: ${item.enrichment_status}`);
    console.log(''); // Empty line for readability
  }


  stop() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.isActive = false;
    console.log('\n🔧 Enrichment Monitor: Stopped\n');
  }
}

// Start monitoring
const monitor = new EnrichmentMonitor();
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