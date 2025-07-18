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
import { HeroSection } from '../components/layout';
import { ContentRail } from '../components/ui';
import { LoadingSpinner } from '../components/common';

const LandingPage: React.FC = () => {
  // Fetch enriched content for hero and rails
  const { data: enrichedItems, isLoading: enrichedLoading } = useQuery({
    queryKey: queryKeys.library.enriched(),
    queryFn: () => libraryApi.getLibraryItems({ 
      enrichment_status: 'enriched', 
      limit: 100,
      sortBy: 'story_number',
      sortOrder: 'asc'
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
      sortBy: 'story_number',
      sortOrder: 'asc'
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
      sortBy: 'story_number',
      sortOrder: 'asc'
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
      sortBy: 'story_number',
      sortOrder: 'asc'
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
      sortBy: 'story_number',
      sortOrder: 'asc'
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
      sortBy: 'story_number',
      sortOrder: 'asc'
    }),
    staleTime: 10 * 60 * 1000,
  });

  // Fetch sections data
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: queryKeys.library.sections(),
    queryFn: () => libraryApi.getLibrarySections(),
    staleTime: 30 * 60 * 1000, // 30 minutes since sections rarely change
  });

  // Get sample stories for each major section
  const { data: sampleStories, isLoading: storiesLoading } = useQuery({
    queryKey: queryKeys.library.sampleStories(),
    queryFn: async () => {
      const samples = await Promise.all([
        libraryApi.getLibraryItems({ section: '8th Doctor', limit: 5 }),
        libraryApi.getLibraryItems({ section: 'Torchwood and Captain Jack', limit: 5 }),
        libraryApi.getLibraryItems({ section: 'Dalek Empire & I, Davros', limit: 5 }),
      ]);
      return {
        eighthDoctor: samples[0],
        torchwood: samples[1],
        daleks: samples[2]
      };
    },
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

  return (
    <div className="landing-page space-y-8">
      {/* Hero Section */}
      {heroItem && (
        <HeroSection 
          item={heroItem}
          className="mb-12"
        />
      )}



      {/* Content Rails */}
      <div className="space-y-12">
        {/* Sections, Stories & Serials Mix */}
        <ContentRail
          title="📚 Sections"
          subtitle="Browse by Doctor era and theme"
          items={[
            // Convert sections to content cards
            ...(sections?.slice(0, 8).map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })) || []),
            // Mix in some featured stories
            ...(sampleStories?.eighthDoctor?.slice(0, 4) || []),
            ...(sampleStories?.torchwood?.slice(0, 4) || []),
            // Add more sections
            ...(sections?.slice(8, 16).map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })) || []),
            // Mix in Dalek stories
            ...(sampleStories?.daleks?.slice(0, 4) || []),
          ]}
          isLoading={sectionsLoading || storiesLoading}
          viewAllLink="/collections"
        />

        {/* Modern Era Doctors with Stories */}
        <ContentRail
          title="🌟 Modern Era Doctors"
          subtitle="From the 9th Doctor to the 15th Doctor - sections and stories"
          items={[
            // Add section cards for modern doctors
            ...(['9th Doctor', '10th Doctor', '11th Doctor', '12th Doctor', '13th Doctor', '14th Doctor', '15th Doctor'].map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))),
            // Mix in actual stories
            ...(modernDoctors?.slice(0, 15) || [])
          ]}
          isLoading={modernLoading}
          viewAllLink="/doctors/modern"
        />

        {/* Classic Era Doctors with Stories */}
        <ContentRail
          title="🎭 Classic Era Doctors"
          subtitle="The original eight Doctors - sections and stories"
          items={[
            // Add section cards for classic doctors
            ...(['1st Doctor', '2nd Doctor', '3rd Doctor', '4th Doctor', '5th Doctor', '6th Doctor', '7th Doctor', '8th Doctor'].map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))),
            // Mix in actual stories
            ...(classicDoctors?.slice(0, 15) || [])
          ]}
          isLoading={classicLoading}
          viewAllLink="/doctors/classic"
        />

        {/* Spin-off Adventures with Sections */}
        <ContentRail
          title="🚀 Spin-off Adventures"
          subtitle="Expanded universe - sections and stories"
          items={[
            // Add section cards for spin-offs
            ...(['Torchwood and Captain Jack', 'Sarah Jane Smith', 'Class', 'K-9', 'UNIT'].map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))),
            // Mix in actual stories
            ...(spinoffItems?.slice(0, 15) || [])
          ]}
          isLoading={spinoffLoading}
          viewAllLink="/spinoffs"
        />

        {/* Special Collections with Sections */}
        <ContentRail
          title="📚 Special Collections"
          subtitle="Time Lord Victorious, New Earth, and more - sections and stories"
          items={[
            // Add section cards for special collections
            ...(['Time Lord Victorious Chronology', 'Tales from New Earth', 'Documentaries', 'War Doctor'].map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))),
            // Mix in actual stories
            ...(specialCollections?.slice(0, 15) || [])
          ]}
          isLoading={specialLoading}
          viewAllLink="/collections"
        />

        {/* Villain Collections with Sections */}
        <ContentRail
          title="👹 Villains & Monsters"
          subtitle="Daleks, Cybermen, Masters, and more - sections and stories"
          items={[
            // Add section cards for villains
            ...(['Dalek Empire & I, Davros', 'Cybermen', 'The Master', 'War Master', 'Missy'].map(section => ({
              id: section,
              title: section,
              display_title: section,
              section_name: section,
              enrichment_status: 'enriched' as const,
              enrichment_confidence: 1,
              wiki_image_url: undefined,
              wiki_summary: undefined,
              content_type: 'Section',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))),
            // Mix in actual stories
            ...(villainItems?.slice(0, 15) || [])
          ]}
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