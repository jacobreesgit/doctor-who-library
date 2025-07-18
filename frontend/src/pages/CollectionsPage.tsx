/**
 * Collections Page Component
 *
 * Browse Doctor Who content organized by sections and collections
 * Features:
 * - Netflix-style grid layout with content cards
 * - Section-based organization (Doctors, Spin-offs, etc.)
 * - Visual hierarchy for enriched vs non-enriched content
 * - Collection cards matching landing page design
 * - Responsive grid layout
 */

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ViewColumnsIcon } from "@heroicons/react/24/outline";
import { libraryApi, queryKeys } from "../services/api";
import { LoadingSpinner } from "../components/common";
import type { LibraryItemResponse } from "../types/api";
import { SECTION_CATEGORIES } from "../constants/sections";
import { getSectionEmoji, getSectionSlug } from "../utils/sections";

const CollectionsPage: React.FC = () => {
  // Fetch all library items
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

  if (isLoading) {
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

  return (
    <div className="collections-page space-y-8">
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
                  const featuredItems = items.slice(0, 3);

                  return (
                    <Link
                      key={`${section}-${index}`}
                      to={`/collections/${getSectionSlug(section)}`}
                      className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Collection Header */}
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">
                            {getSectionEmoji(section)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {section}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>{stats.total} items</span>
                              <span>•</span>
                              <span className="text-green-600">
                                {stats.enriched} enriched
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Featured Items Preview */}
                      <div className="p-4">
                        {featuredItems.length > 0 ? (
                          <div className="grid grid-cols-3 gap-2">
                            {featuredItems.map((item) => (
                              <div
                                key={item.id}
                                className="aspect-square relative"
                              >
                                {item.wiki_image_url ? (
                                  <img
                                    src={item.wiki_image_url}
                                    alt={item.title}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-md flex items-center justify-center">
                                    <span className="text-lg opacity-50">
                                      {getSectionEmoji(section)}
                                    </span>
                                  </div>
                                )}
                                {/* Enrichment status overlay */}
                                {item.enrichment_status !== "enriched" && (
                                  <div className="absolute top-1 right-1">
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        item.enrichment_status === "pending"
                                          ? "bg-yellow-400"
                                          : item.enrichment_status === "failed"
                                          ? "bg-red-400"
                                          : "bg-gray-400"
                                      }`}
                                    />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-md flex items-center justify-center">
                            <div className="text-center">
                              <div className="text-3xl opacity-50 mb-2">
                                {getSectionEmoji(section)}
                              </div>
                              <p className="text-sm text-gray-500">
                                No items in this collection
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Collection Footer */}
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            {stats.enriched > 0
                              ? `${Math.round(
                                  (stats.enriched / stats.total) * 100
                                )}% enriched`
                              : "Basic info only"}
                          </span>
                          <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                            Explore →
                          </span>
                        </div>
                      </div>
                    </Link>
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
            to="/search"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Search Library
          </Link>
          <Link
            to="/doctors"
            className="bg-white text-gray-700 px-6 py-3 rounded-lg font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Browse by Doctor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CollectionsPage;
