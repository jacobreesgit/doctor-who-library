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

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon
} from '@heroicons/react/24/outline';
import { libraryApi, queryKeys } from '../services/api';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import type { LibraryItemResponse } from '../types/api';

const CollectionsPage: React.FC = () => {
  // Fetch all library items
  const { data: allItems, isLoading, error } = useQuery({
    queryKey: queryKeys.library.items({ 
      limit: 10000,
      sortBy: 'section_name',
      sortOrder: 'asc'
    }),
    queryFn: () => libraryApi.getLibraryItems({ 
      limit: 10000,
      sortBy: 'section_name',
      sortOrder: 'asc'
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
    
    sections.forEach(section => {
      grouped[section] = allItems.filter(item => item.section_name === section);
    });
    
    return grouped;
  }, [allItems, sections]);

  // Get section stats
  const sectionStats = useMemo(() => {
    if (!itemsBySection) return {};
    
    const stats: Record<string, { total: number; enriched: number; pending: number }> = {};
    
    Object.entries(itemsBySection).forEach(([section, items]) => {
      stats[section] = {
        total: items.length,
        enriched: items.filter(item => item.enrichment_status === 'enriched').length,
        pending: items.filter(item => item.enrichment_status === 'pending').length
      };
    });
    
    return stats;
  }, [itemsBySection]);

  // Section categories for better organization
  const sectionCategories = useMemo(() => {
    if (!sections) return {};
    
    const categories: Record<string, string[]> = {
      'Classic Era Doctors': sections.filter(s => 
        ['1st Doctor', '2nd Doctor', '3rd Doctor', '4th Doctor', '5th Doctor', '6th Doctor', '7th Doctor', '8th Doctor'].includes(s)
      ),
      'Modern Era Doctors': sections.filter(s => 
        ['9th Doctor', '10th Doctor', '11th Doctor', '12th Doctor', '13th Doctor', '14th Doctor', '15th Doctor'].includes(s)
      ),
      'Spin-offs & Companions': sections.filter(s => 
        ['Torchwood and Captain Jack', 'Sarah Jane Smith', 'Class', 'K-9', 'UNIT'].includes(s)
      ),
      'Villains & Monsters': sections.filter(s => 
        ['Dalek Empire & I, Davros', 'Cybermen', 'The Master', 'War Master', 'Missy'].includes(s)
      ),
      'Special Collections': sections.filter(s => 
        ['Time Lord Victorious Chronology', 'Tales from New Earth', 'Documentaries', 'War Doctor'].includes(s)
      )
    };
    
    // Add any remaining sections to "Other"
    const allCategorized = Object.values(categories).flat();
    const remaining = sections.filter(s => !allCategorized.includes(s));
    if (remaining.length > 0) {
      categories['Other Collections'] = remaining;
    }
    
    return categories;
  }, [sections]);

  const getSectionEmoji = (section: string): string => {
    if (section.includes('1st')) return '👴';
    if (section.includes('2nd')) return '🎭';
    if (section.includes('3rd')) return '🥋';
    if (section.includes('4th')) return '🧣';
    if (section.includes('5th')) return '🏏';
    if (section.includes('6th')) return '🌈';
    if (section.includes('7th')) return '🎩';
    if (section.includes('8th')) return '💫';
    if (section.includes('9th')) return '👂';
    if (section.includes('10th')) return '🕺';
    if (section.includes('11th')) return '🎀';
    if (section.includes('12th')) return '🎸';
    if (section.includes('13th')) return '👥';
    if (section.includes('14th')) return '🔄';
    if (section.includes('15th')) return '✨';
    if (section.includes('Torchwood')) return '🚀';
    if (section.includes('Sarah Jane')) return '👩‍🔬';
    if (section.includes('Dalek')) return '🔵';
    if (section.includes('Cybermen')) return '🤖';
    if (section.includes('Master')) return '👹';
    if (section.includes('War Doctor')) return '⚔️';
    if (section.includes('Documentaries')) return '📺';
    return '📚';
  };

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
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Data</h1>
        <p className="text-gray-600">Unable to load library data. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Doctor Who Collections</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Browse the complete Doctor Who universe organized by Doctors, eras, and special collections
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-blue-600">{allItems?.length || 0}</div>
          <div className="text-sm text-gray-600">Total Items</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-green-600">
            {allItems?.filter(item => item.enrichment_status === 'enriched').length || 0}
          </div>
          <div className="text-sm text-gray-600">Enriched Items</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-purple-600">{sections?.length || 0}</div>
          <div className="text-sm text-gray-600">Collections</div>
        </div>
        <div className="bg-white rounded-lg p-4 border">
          <div className="text-2xl font-bold text-orange-600">{Object.keys(sectionCategories).length}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>

      {/* Collection Categories */}
      <div className="space-y-12">
        {Object.entries(sectionCategories).map(([categoryName, categorySections]) => (
          <div key={categoryName} className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{categoryName}</h2>
              <ViewColumnsIcon className="h-6 w-6 text-gray-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categorySections.map(section => {
                const items = itemsBySection[section] || [];
                const stats = sectionStats[section] || { total: 0, enriched: 0, pending: 0 };
                const featuredItems = items
                  .slice(0, 3);
                
                return (
                  <Link
                    key={section}
                    to={`/collections/${encodeURIComponent(section)}`}
                    className="group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Collection Header */}
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getSectionEmoji(section)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                            {section}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{stats.total} items</span>
                            <span>•</span>
                            <span className="text-green-600">{stats.enriched} enriched</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Featured Items Preview */}
                    <div className="p-4">
                      {featuredItems.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2">
                          {featuredItems.map((item, index) => (
                            <div key={item.id} className="aspect-square relative">
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
                              {item.enrichment_status !== 'enriched' && (
                                <div className="absolute top-1 right-1">
                                  <div className={`w-2 h-2 rounded-full ${
                                    item.enrichment_status === 'pending' ? 'bg-yellow-400' :
                                    item.enrichment_status === 'failed' ? 'bg-red-400' :
                                    'bg-gray-400'
                                  }`} />
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
                          {stats.enriched > 0 ? `${Math.round((stats.enriched / stats.total) * 100)}% enriched` : 'Basic info only'}
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
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Explore the Complete Library
        </h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Looking for something specific? Use our search and filtering tools to find exactly what you're looking for.
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