/**
 * Landing Page Component
 * 
 * Netflix-style homepage with featured content and content rails
 * Features:
 * - Hero section with featured enriched content
 * - Content rails for different categories
 * - Enriched content prioritization
 * - Responsive design with mobile optimization
 * - Performance optimized with React Query
 * - SEO friendly structure
 * - Real-time content updates
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { libraryApi, queryKeys } from '../services/api';
import HeroSection from '../components/HeroSection';
import ContentRail from '../components/ContentRail';
import LoadingSpinner from '../components/LoadingSpinner';

const LandingPage: React.FC = () => {
  // Fetch enriched content for hero and rails
  const { data: enrichedItems, isLoading: enrichedLoading } = useQuery({
    queryKey: queryKeys.library.enriched(),
    queryFn: () => libraryApi.getLibraryItems({ 
      enrichment_status: 'enriched', 
      limit: 100,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch recent enrichments
  const { data: recentItems, isLoading: recentLoading } = useQuery({
    queryKey: queryKeys.library.recent(),
    queryFn: () => libraryApi.getLibraryItems({ 
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'updated_at',
      sortOrder: 'desc'
    }),
    staleTime: 30 * 1000, // 30 seconds for recent items
  });

  // Fetch items by Doctor for spotlight
  const { data: doctorItems, isLoading: doctorLoading } = useQuery({
    queryKey: queryKeys.library.byDoctor('4th Doctor'),
    queryFn: () => libraryApi.getLibraryItems({ 
      section: '4th Doctor',
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch spin-off content
  const { data: spinoffItems, isLoading: spinoffLoading } = useQuery({
    queryKey: queryKeys.library.spinoffs(),
    queryFn: () => libraryApi.getLibraryItems({ 
      sections: ['Torchwood and Captain Jack', 'Sarah Jane Smith', 'Bernice Summerfield'],
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  if (enrichedLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const heroItem = enrichedItems?.[0];
  const enrichedItemsForRails = enrichedItems?.slice(1) || [];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      {heroItem && (
        <HeroSection 
          item={heroItem}
          className="mb-12"
        />
      )}

      {/* Content Rails */}
      <div className="space-y-12">
        {/* Recently Enriched */}
        <ContentRail
          title="🔥 Recently Enriched"
          subtitle="Newly added TARDIS Wiki content"
          items={recentItems || []}
          isLoading={recentLoading}
          viewAllLink="/explore/new"
        />

        {/* Doctor Spotlight */}
        <ContentRail
          title="👑 Doctor Spotlight: 4th Doctor"
          subtitle="The longest-serving Doctor's greatest adventures"
          items={doctorItems || []}
          isLoading={doctorLoading}
          viewAllLink="/stories/doctors/4th-doctor"
        />

        {/* Spin-off Adventures */}
        <ContentRail
          title="🚀 Spin-off Adventures"
          subtitle="Expanded universe stories and characters"
          items={spinoffItems || []}
          isLoading={spinoffLoading}
          viewAllLink="/universe/shows"
        />

        {/* Featured Collections */}
        <ContentRail
          title="📚 Featured Collections"
          subtitle="Curated story collections and themes"
          items={enrichedItemsForRails.slice(0, 20)}
          isLoading={false}
          viewAllLink="/explore/collections"
        />

        {/* Classic Serials */}
        <ContentRail
          title="🎭 Classic Serials"
          subtitle="Multi-part stories from the classic era"
          items={enrichedItemsForRails.filter((item: any) => 
            item.section_name?.includes('1st Doctor') || 
            item.section_name?.includes('2nd Doctor') ||
            item.section_name?.includes('3rd Doctor') ||
            item.section_name?.includes('4th Doctor')
          ).slice(0, 20)}
          isLoading={false}
          viewAllLink="/stories/formats/tv"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Ready to Explore?
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Dive into the complete Doctor Who universe with our comprehensive library
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/stories/doctors"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse by Doctor
          </Link>
          <Link
            to="/explore/featured"
            className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Explore Collections
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;