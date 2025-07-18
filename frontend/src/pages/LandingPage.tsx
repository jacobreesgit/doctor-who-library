/**
 * Landing Page Component
 * 
 * Combined landing page with hero section and browse all collections
 * Features:
 * - Hero section with featured enriched content
 * - Card-based collections grid for all sections
 * - Section-based organization (Doctors, Spin-offs, etc.)
 * - Responsive design with mobile optimization
 * - Performance optimized with React Query
 * - SEO friendly structure
 * - Real-time content updates
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ViewColumnsIcon } from '@heroicons/react/24/outline';
import { libraryApi, queryKeys } from '../services/api';
import { HeroSection } from '../components/layout';
import { LoadingSpinner } from '../components/common';
import type { LibraryItemResponse } from '../types/api';
import { SECTION_CATEGORIES } from '../constants/sections';
import { CollectionCard } from '../components/ui';

const LandingPage: React.FC = () => {
  // Fetch enriched content for hero
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

  // Fetch all library items for collections
  const {
    data: allItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.library.items({
      limit: 10000,
      sortBy: "story_number",
      sortOrder: "asc",
    }),
    queryFn: () =>
      libraryApi.getLibraryItems({
        limit: 10000,
        sortBy: "story_number",
        sortOrder: "asc",
      }),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch library sections
  const { data: sections } = useQuery({
    queryKey: queryKeys.library.sections(),
    queryFn: () => libraryApi.getLibrarySections(),
    staleTime: 10 * 60 * 1000,
  });

  // Group items by section
  const itemsBySection = useMemo(() => {
    if (!allItems || !sections) return {};

    const grouped: Record<string, LibraryItemResponse[]> = {};
    
    // Filter out undefined/null sections (sections are strings, not objects)
    const validSections = sections.filter((s) => s && typeof s === 'string');

    validSections.forEach((section) => {
      grouped[section] = allItems.filter(
        (item) => item.section_name === section
      );
    });

    return grouped;
  }, [allItems, sections]);

  // Get section stats
  const sectionStats = useMemo(() => {
    if (!itemsBySection) return {};

    const stats: Record<
      string,
      { total: number; enriched: number; pending: number }
    > = {};

    Object.entries(itemsBySection).forEach(([section, items]) => {
      stats[section] = {
        total: items.length,
        enriched: items.filter((item) => item.enrichment_status === "enriched")
          .length,
        pending: items.filter((item) => item.enrichment_status === "pending")
          .length,
      };
    });

    return stats;
  }, [itemsBySection]);

  // Section categories for better organization
  const sectionCategories = useMemo(() => {
    if (!sections) return {};

    const categories: Record<string, string[]> = {};

    // Filter out undefined/null sections (sections are strings, not objects)
    const validSections = sections.filter((s) => s && typeof s === 'string');
    
    // Use predefined categories from constants
    Object.entries(SECTION_CATEGORIES).forEach(([categoryName, approvedSections]) => {
      const foundSections = validSections.filter((s) => approvedSections.includes(s));
      if (foundSections.length > 0) {
        categories[categoryName] = foundSections;
      }
    });

    // Add any remaining sections to "Other Collections"
    const allCategorized = Object.values(categories).flat();
    const remaining = validSections.filter((s) => !allCategorized.includes(s));
    if (remaining.length > 0) {
      categories["Other Collections"] = remaining;
    }

    // If no categories were created, just show all sections under "All Collections"
    if (Object.keys(categories).length === 0) {
      categories["All Collections"] = validSections;
    }

    return categories;
  }, [sections]);

  if (enrichedLoading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Data
        </h1>
        <p className="text-gray-600">
          Unable to load library data. Please try again.
        </p>
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

      {/* Browse All Collections Section */}
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Doctor Who Collections
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Browse the complete Doctor Who universe organized by Doctors, eras,
            and special collections
          </p>
        </div>

        {/* Collection Categories */}
        <div className="space-y-12">
          {Object.entries(sectionCategories).map(
            ([categoryName, categorySections]) => (
              <div key={categoryName} className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {categoryName}
                  </h2>
                  <ViewColumnsIcon className="h-6 w-6 text-gray-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categorySections.map((section, index) => {
                    if (!section || section.trim() === '') return null;
                    const items = itemsBySection[section] || [];
                    const stats = sectionStats[section] || {
                      total: 0,
                      enriched: 0,
                      pending: 0,
                    };

                    return (
                      <CollectionCard
                        key={`${section}-${index}`}
                        section={section}
                        items={items}
                        stats={stats}
                      />
                    );
                  })}
                </div>
              </div>
            )
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Explore the Complete Library
          </h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Looking for something specific? Use our search and filtering tools to
            find exactly what you're looking for.
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;