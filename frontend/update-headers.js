/**
 * Script to Add JSDoc Headers to All Source Files
 * 
 * Updates all TypeScript/JavaScript files in the src directory
 * with comprehensive JSDoc-style documentation headers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File headers mapping
const fileHeaders = {
  // Components
  'components/LoadingSpinner.tsx': {
    title: 'Loading Spinner Component',
    description: 'Reusable loading spinner with multiple sizes and animations',
    features: [
      'Multiple size variants (small, medium, large)',
      'Smooth CSS animations',
      'Accessible with proper ARIA labels',
      'Customizable colors and styling',
      'TypeScript support with props interface'
    ]
  },
  'components/WikiSummary.tsx': {
    title: 'Wiki Summary Component',
    description: 'Displays TARDIS Wiki summary content with rich formatting',
    features: [
      'Rich text rendering with HTML support',
      'Expandable/collapsible content',
      'Character limit with "read more" functionality',
      'Link handling for external wiki links',
      'Responsive text sizing',
      'Loading states and error handling'
    ]
  },
  'components/EnrichmentBadge.tsx': {
    title: 'Enrichment Badge Component',
    description: 'Status badge for TARDIS Wiki enrichment with confidence indicators',
    features: [
      'Multiple enrichment states (pending, enriched, failed, skipped)',
      'Confidence percentage display',
      'Animated states for pending items',
      'Accessible with proper ARIA labels',
      'Customizable sizes and variants',
      'Real-time updates integration'
    ]
  },
  'components/WikiImage.tsx': {
    title: 'Wiki Image Component',
    description: 'Optimized image component for TARDIS Wiki content',
    features: [
      'Lazy loading with intersection observer',
      'Responsive image sizing',
      'Fallback placeholders for missing images',
      'Progressive loading with blur effects',
      'Error handling with retry logic',
      'Accessible alt text support'
    ]
  },
  'components/EnrichmentStats.tsx': {
    title: 'Enrichment Statistics Component',
    description: 'Interactive dashboard for enrichment progress and statistics',
    features: [
      'Real-time enrichment progress tracking',
      'Visual charts and progress bars',
      'Detailed breakdown by status',
      'Confidence level distribution',
      'Historical trends display',
      'Interactive filtering and sorting'
    ]
  },
  'components/LibraryCard.tsx': {
    title: 'Library Card Component',
    description: 'Individual library item card with enrichment status',
    features: [
      'Responsive card layout',
      'Enrichment status indicators',
      'Image lazy loading',
      'Hover effects and animations',
      'Action buttons for favorites/enrichment',
      'Accessibility support',
      'Mobile-optimized touch targets'
    ]
  },
  'components/EnrichmentManager.tsx': {
    title: 'Enrichment Manager Component',
    description: 'Management interface for enrichment operations',
    features: [
      'Individual item enrichment reset',
      'Global enrichment management',
      'Confirmation dialogs for destructive actions',
      'React Query integration for mutations',
      'Error handling and feedback',
      'Bulk operations support'
    ]
  },
  'components/ContentRail.tsx': {
    title: 'Content Rail Component',
    description: 'Horizontal scrolling content rail for Netflix-style browsing',
    features: [
      'Smooth horizontal scrolling',
      'Touch gesture support',
      'Responsive item sizing',
      'Intersection observer for lazy loading',
      'Navigation arrows for desktop',
      'Loading states and error handling',
      'Keyboard navigation support'
    ]
  },
  'components/DoctorEraView.tsx': {
    title: 'Doctor Era View Component',
    description: 'Specialized view for browsing content by Doctor era',
    features: [
      'Era-specific filtering and sorting',
      'Doctor-themed visual elements',
      'Chronological organization',
      'Era statistics and summaries',
      'Responsive grid layout',
      'Quick navigation between eras'
    ]
  },
  'components/FormatView.tsx': {
    title: 'Format View Component',
    description: 'Content browsing organized by media format',
    features: [
      'Format-based content organization',
      'Visual format indicators',
      'Filtering by content type',
      'Format-specific metadata display',
      'Responsive layout adaptation',
      'Search within format types'
    ]
  },
  'components/AllStoriesView.tsx': {
    title: 'All Stories View Component',
    description: 'Comprehensive view of all Doctor Who stories',
    features: [
      'Complete story listing with pagination',
      'Advanced filtering and sorting',
      'Bulk selection and actions',
      'Export functionality',
      'Story timeline visualization',
      'Enrichment status overview'
    ]
  },
  'components/HeroSection.tsx': {
    title: 'Hero Section Component',
    description: 'Featured content hero section for landing page',
    features: [
      'Dynamic featured content display',
      'Auto-rotating hero items',
      'Rich media integration',
      'Call-to-action buttons',
      'Responsive design',
      'Accessibility support',
      'Performance optimized'
    ]
  },
  'components/ContentCard.tsx': {
    title: 'Content Card Component',
    description: 'Visual content card with enrichment hierarchy',
    features: [
      'Visual hierarchy for enriched vs non-enriched content',
      'Progressive enhancement indicators',
      'Doctor-specific placeholder styling',
      'Hover effects and animations',
      'Mobile-responsive design',
      'Wiki link integration',
      'Confidence scoring display'
    ]
  },
  'components/LibraryGrid.tsx': {
    title: 'Library Grid Component',
    description: 'Responsive grid layout for library items',
    features: [
      'Responsive grid with dynamic columns',
      'Infinite scrolling support',
      'Item filtering and sorting',
      'Selection mode for bulk actions',
      'Loading states and skeletons',
      'Keyboard navigation',
      'Touch gesture support'
    ]
  },

  // Pages
  'pages/HomePage.tsx': {
    title: 'Home Page Component',
    description: 'Developer homepage with enrichment monitoring',
    features: [
      'Real-time enrichment statistics',
      'Interactive enrichment management',
      'System health monitoring',
      'Developer tools and utilities',
      'Performance metrics display',
      'Debug information panels'
    ]
  },
  'pages/StoriesPage.tsx': {
    title: 'Stories Page Component',
    description: 'Main stories browsing page with sub-navigation',
    features: [
      'Sub-route navigation (doctors, formats, all)',
      'Story filtering and search',
      'Doctor-centric organization',
      'Format-based browsing',
      'Responsive layout',
      'Breadcrumb navigation'
    ]
  },
  'pages/UniversePage.tsx': {
    title: 'Universe Page Component',
    description: 'Expanded universe content browsing',
    features: [
      'Spin-off series organization',
      'Audio drama collections',
      'Documentary browsing',
      'Content type filtering',
      'Rich metadata display',
      'Cross-series navigation'
    ]
  },
  'pages/ExplorePage.tsx': {
    title: 'Explore Page Component',
    description: 'Content discovery and curated collections',
    features: [
      'Featured content highlights',
      'Curated collections display',
      'New additions showcase',
      'Recommendation engine',
      'Personalized content',
      'Discovery algorithms'
    ]
  },
  'pages/RecentPage.tsx': {
    title: 'Recent Page Component',
    description: 'User activity and recently viewed content',
    features: [
      'Recently viewed items',
      'Continue watching functionality',
      'Favorites management',
      'Activity timeline',
      'Personalized recommendations',
      'Progress tracking'
    ]
  },
  'pages/LandingPage.tsx': {
    title: 'Landing Page Component',
    description: 'Netflix-style homepage with featured content',
    features: [
      'Hero section with featured content',
      'Content rails for different categories',
      'Enriched content prioritization',
      'Responsive design',
      'Performance optimized',
      'SEO friendly structure'
    ]
  },

  // Utility files
  'vite-env.d.ts': {
    title: 'Vite Environment Types',
    description: 'TypeScript declarations for Vite build environment',
    features: [
      'Vite client types',
      'Import meta interface',
      'Build-time type definitions',
      'Development server types'
    ]
  }
};

// Function to create header comment
function createHeader(title, description, features) {
  const featureList = features.map(feature => ` * - ${feature}`).join('\n');
  return `/**
 * ${title}
 * 
 * ${description}
 * Features:
${featureList}
 */`;
}

// Function to update file with header
function updateFileWithHeader(filePath, headerInfo) {
  const fullPath = path.join(__dirname, 'src', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  
  // Check if file already has a header
  if (content.trim().startsWith('/**')) {
    console.log(`File already has header: ${filePath}`);
    return;
  }

  const header = createHeader(headerInfo.title, headerInfo.description, headerInfo.features);
  const newContent = `${header}\n\n${content}`;
  
  fs.writeFileSync(fullPath, newContent, 'utf8');
  console.log(`Updated header for: ${filePath}`);
}

// Main execution
console.log('Adding JSDoc headers to source files...\n');

Object.entries(fileHeaders).forEach(([filePath, headerInfo]) => {
  updateFileWithHeader(filePath, headerInfo);
});

console.log('\nHeader update complete!');