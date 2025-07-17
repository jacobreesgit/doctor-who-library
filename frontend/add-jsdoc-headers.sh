#!/bin/bash

# Add JSDoc Headers to All Source Files
# This script adds comprehensive JSDoc-style documentation headers to all TypeScript/React files

echo "Adding JSDoc headers to all source files..."

# Function to add header to a file
add_header() {
    local file_path="$1"
    local title="$2"
    local description="$3"
    local features="$4"
    
    # Check if file exists and doesn't already have a header
    if [[ -f "$file_path" && ! $(head -1 "$file_path") =~ ^/\*\* ]]; then
        # Create temporary file with header
        {
            echo "/**"
            echo " * $title"
            echo " * "
            echo " * $description"
            echo " * Features:"
            echo "$features"
            echo " */"
            echo ""
            cat "$file_path"
        } > "$file_path.tmp"
        
        # Replace original file
        mv "$file_path.tmp" "$file_path"
        echo "Updated: $file_path"
    fi
}

# Add headers to component files
add_header "src/components/WikiSummary.tsx" \
    "Wiki Summary Component" \
    "Displays TARDIS Wiki summary content with rich formatting" \
    " * - Rich text rendering with HTML support
 * - Expandable/collapsible content
 * - Character limit with \"read more\" functionality
 * - Link handling for external wiki links
 * - Responsive text sizing
 * - Loading states and error handling"

add_header "src/components/WikiImage.tsx" \
    "Wiki Image Component" \
    "Optimized image component for TARDIS Wiki content" \
    " * - Lazy loading with intersection observer
 * - Responsive image sizing
 * - Fallback placeholders for missing images
 * - Progressive loading with blur effects
 * - Error handling with retry logic
 * - Accessible alt text support"

add_header "src/components/EnrichmentStats.tsx" \
    "Enrichment Statistics Component" \
    "Interactive dashboard for enrichment progress and statistics" \
    " * - Real-time enrichment progress tracking
 * - Visual charts and progress bars
 * - Detailed breakdown by status
 * - Confidence level distribution
 * - Historical trends display
 * - Interactive filtering and sorting"

add_header "src/components/LibraryCard.tsx" \
    "Library Card Component" \
    "Individual library item card with enrichment status" \
    " * - Responsive card layout
 * - Enrichment status indicators
 * - Image lazy loading
 * - Hover effects and animations
 * - Action buttons for favorites/enrichment
 * - Accessibility support
 * - Mobile-optimized touch targets"

add_header "src/components/ContentRail.tsx" \
    "Content Rail Component" \
    "Horizontal scrolling content rail for Netflix-style browsing" \
    " * - Smooth horizontal scrolling
 * - Touch gesture support
 * - Responsive item sizing
 * - Intersection observer for lazy loading
 * - Navigation arrows for desktop
 * - Loading states and error handling
 * - Keyboard navigation support"

add_header "src/components/HeroSection.tsx" \
    "Hero Section Component" \
    "Featured content hero section for landing page" \
    " * - Dynamic featured content display
 * - Auto-rotating hero items
 * - Rich media integration
 * - Call-to-action buttons
 * - Responsive design
 * - Accessibility support
 * - Performance optimized"

add_header "src/components/LibraryGrid.tsx" \
    "Library Grid Component" \
    "Responsive grid layout for library items" \
    " * - Responsive grid with dynamic columns
 * - Infinite scrolling support
 * - Item filtering and sorting
 * - Selection mode for bulk actions
 * - Loading states and skeletons
 * - Keyboard navigation
 * - Touch gesture support"

# Add headers to view components
add_header "src/components/DoctorEraView.tsx" \
    "Doctor Era View Component" \
    "Specialized view for browsing content by Doctor era" \
    " * - Era-specific filtering and sorting
 * - Doctor-themed visual elements
 * - Chronological organization
 * - Era statistics and summaries
 * - Responsive grid layout
 * - Quick navigation between eras"

add_header "src/components/FormatView.tsx" \
    "Format View Component" \
    "Content browsing organized by media format" \
    " * - Format-based content organization
 * - Visual format indicators
 * - Filtering by content type
 * - Format-specific metadata display
 * - Responsive layout adaptation
 * - Search within format types"

add_header "src/components/AllStoriesView.tsx" \
    "All Stories View Component" \
    "Comprehensive view of all Doctor Who stories" \
    " * - Complete story listing with pagination
 * - Advanced filtering and sorting
 * - Bulk selection and actions
 * - Export functionality
 * - Story timeline visualization
 * - Enrichment status overview"

add_header "src/components/MainShowsView.tsx" \
    "Main Shows View Component" \
    "Primary series and main show content display" \
    " * - Main series organization
 * - Show-specific filtering
 * - Episode grouping and navigation
 * - Series statistics and progress
 * - Responsive grid layout
 * - Cross-series navigation"

add_header "src/components/AudioUniverseView.tsx" \
    "Audio Universe View Component" \
    "Audio drama and extended universe content" \
    " * - Audio-specific content organization
 * - Publisher-based grouping
 * - Audio format indicators
 * - Listening progress tracking
 * - Collection management
 * - Search within audio content"

add_header "src/components/DocumentariesView.tsx" \
    "Documentaries View Component" \
    "Documentary and behind-the-scenes content" \
    " * - Documentary-specific layout
 * - Topic-based organization
 * - Production year filtering
 * - Interview and feature highlights
 * - Educational content focus
 * - Related content suggestions"

add_header "src/components/FeaturedView.tsx" \
    "Featured View Component" \
    "Curated featured content and highlights" \
    " * - Editorial content curation
 * - Featured item rotation
 * - Seasonal content highlighting
 * - Quality content prioritization
 * - Recommendation algorithms
 * - User engagement tracking"

add_header "src/components/CollectionsView.tsx" \
    "Collections View Component" \
    "Themed collections and curated content groups" \
    " * - Collection-based organization
 * - Theme-based content grouping
 * - Collection creation and management
 * - Sharing and collaboration features
 * - Collection statistics
 * - Search within collections"

add_header "src/components/NewAdditionsView.tsx" \
    "New Additions View Component" \
    "Recently added and newly enriched content" \
    " * - Chronological new content display
 * - Recent enrichment highlights
 * - Addition date filtering
 * - New content notifications
 * - Progress tracking for additions
 * - Quality assessment display"

add_header "src/components/ContinueWatchingView.tsx" \
    "Continue Watching View Component" \
    "User progress and continuation functionality" \
    " * - Viewing progress tracking
 * - Resume functionality
 * - Next episode suggestions
 * - Watch history management
 * - Cross-device synchronization
 * - Completion status indicators"

add_header "src/components/RecentlyAddedView.tsx" \
    "Recently Added View Component" \
    "Timeline of recently added library content" \
    " * - Recent addition timeline
 * - Addition date organization
 * - New content highlighting
 * - Addition source tracking
 * - Notification preferences
 * - Freshness indicators"

add_header "src/components/FavoritesView.tsx" \
    "Favorites View Component" \
    "User favorited content management" \
    " * - Personal favorites collection
 * - Favorite organization and sorting
 * - Favorite sharing capabilities
 * - Favorite analytics and insights
 * - Quick access functionality
 * - Synchronization across devices"

# Add headers to page components
add_header "src/pages/HomePage.tsx" \
    "Home Page Component" \
    "Developer homepage with enrichment monitoring" \
    " * - Real-time enrichment statistics
 * - Interactive enrichment management
 * - System health monitoring
 * - Developer tools and utilities
 * - Performance metrics display
 * - Debug information panels"

add_header "src/pages/StoriesPage.tsx" \
    "Stories Page Component" \
    "Main stories browsing page with sub-navigation" \
    " * - Sub-route navigation (doctors, formats, all)
 * - Story filtering and search
 * - Doctor-centric organization
 * - Format-based browsing
 * - Responsive layout
 * - Breadcrumb navigation"

add_header "src/pages/UniversePage.tsx" \
    "Universe Page Component" \
    "Expanded universe content browsing" \
    " * - Spin-off series organization
 * - Audio drama collections
 * - Documentary browsing
 * - Content type filtering
 * - Rich metadata display
 * - Cross-series navigation"

add_header "src/pages/ExplorePage.tsx" \
    "Explore Page Component" \
    "Content discovery and curated collections" \
    " * - Featured content highlights
 * - Curated collections display
 * - New additions showcase
 * - Recommendation engine
 * - Personalized content
 * - Discovery algorithms"

add_header "src/pages/RecentPage.tsx" \
    "Recent Page Component" \
    "User activity and recently viewed content" \
    " * - Recently viewed items
 * - Continue watching functionality
 * - Favorites management
 * - Activity timeline
 * - Personalized recommendations
 * - Progress tracking"

# Add header to vite-env.d.ts
add_header "src/vite-env.d.ts" \
    "Vite Environment Types" \
    "TypeScript declarations for Vite build environment" \
    " * - Vite client types
 * - Import meta interface
 * - Build-time type definitions
 * - Development server types"

echo ""
echo "JSDoc header update complete!"
echo "Total files processed: $(find src -name "*.tsx" -o -name "*.ts" | wc -l)"