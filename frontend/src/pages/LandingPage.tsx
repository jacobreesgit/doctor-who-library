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

  // Fetch modern era Doctors collection
  const { data: modernDoctors, isLoading: modernLoading } = useQuery({
    queryKey: queryKeys.library.modernDoctors(),
    queryFn: () => libraryApi.getLibraryItems({ 
      sections: ['9th Doctor', '10th Doctor', '11th Doctor', '12th Doctor', '13th Doctor', '14th Doctor', '15th Doctor'],
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch classic era Doctors collection
  const { data: classicDoctors, isLoading: classicLoading } = useQuery({
    queryKey: queryKeys.library.classicDoctors(),
    queryFn: () => libraryApi.getLibraryItems({ 
      sections: ['1st Doctor', '2nd Doctor', '3rd Doctor', '4th Doctor', '5th Doctor', '6th Doctor', '7th Doctor', '8th Doctor'],
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
      sections: ['Torchwood and Captain Jack', 'Sarah Jane Smith', 'Class', 'K-9', 'UNIT'],
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch special collections
  const { data: specialCollections, isLoading: specialLoading } = useQuery({
    queryKey: queryKeys.library.specialCollections(),
    queryFn: () => libraryApi.getLibraryItems({ 
      sections: ['Time Lord Victorious Chronology', 'Tales from New Earth', 'Documentaries', 'War Doctor'],
      enrichment_status: 'enriched',
      limit: 20,
      sortBy: 'enrichment_confidence',
      sortOrder: 'desc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch villain collections
  const { data: villainItems, isLoading: villainLoading } = useQuery({
    queryKey: queryKeys.library.villains(),
    queryFn: () => libraryApi.getLibraryItems({ 
      sections: ['Dalek Empire & I, Davros', 'Cybermen', 'The Master', 'War Master', 'Missy'],
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
        {/* Modern Era Doctors */}
        <ContentRail
          title="🌟 Modern Era Doctors"
          subtitle="From the 9th Doctor to the 15th Doctor"
          items={modernDoctors || []}
          isLoading={modernLoading}
          viewAllLink="/doctors/modern"
        />

        {/* Classic Era Doctors */}
        <ContentRail
          title="🎭 Classic Era Doctors"
          subtitle="The original eight Doctors' greatest adventures"
          items={classicDoctors || []}
          isLoading={classicLoading}
          viewAllLink="/doctors/classic"
        />

        {/* Spin-off Adventures */}
        <ContentRail
          title="🚀 Spin-off Adventures"
          subtitle="Expanded universe shows and characters"
          items={spinoffItems || []}
          isLoading={spinoffLoading}
          viewAllLink="/spinoffs"
        />

        {/* Special Collections */}
        <ContentRail
          title="📚 Special Collections"
          subtitle="Time Lord Victorious, New Earth, and more"
          items={specialCollections || []}
          isLoading={specialLoading}
          viewAllLink="/collections"
        />

        {/* Villain Collections */}
        <ContentRail
          title="👹 Villains & Monsters"
          subtitle="Daleks, Cybermen, Masters, and more"
          items={villainItems || []}
          isLoading={villainLoading}
          viewAllLink="/collections/villains"
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
            to="/doctors"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Browse by Doctor
          </Link>
          <Link
            to="/spinoffs"
            className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Explore Spin-offs
          </Link>
          <Link
            to="/collections"
            className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
          >
            Special Collections
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;