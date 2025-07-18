/**
 * Item Detail Page Component
 * 
 * Displays detailed information about a specific Doctor Who story/episode
 * Features:
 * - Full item metadata display
 * - TARDIS Wiki content integration
 * - Large hero image with fallback
 * - Related items recommendations
 * - Breadcrumb navigation
 * - Enrichment status and confidence display
 * - External links (TARDIS Wiki)
 * - Responsive design
 */

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  FilmIcon,
  ClockIcon,
  ArrowTopRightOnSquareIcon,
  PhotoIcon,
  BookOpenIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { libraryApi, queryKeys } from '../services/api';
import ContentCard from '../components/ContentCard';
import LoadingSpinner from '../components/LoadingSpinner';
import EnrichmentBadge from '../components/EnrichmentBadge';
import { getSectionEmoji } from '../utils/sections';

const ItemDetailPage: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  
  // Fetch specific item details
  const { data: item, isLoading, error } = useQuery({
    queryKey: queryKeys.library.item(itemId || ''),
    queryFn: () => libraryApi.getLibraryItem(itemId || ''),
    staleTime: 5 * 60 * 1000,
    enabled: !!itemId
  });

  // Fetch all items for related items recommendations
  const { data: allItems } = useQuery({
    queryKey: queryKeys.library.items({ limit: 1000, sortBy: 'story_number', sortOrder: 'asc' }),
    queryFn: () => libraryApi.getLibraryItems({ limit: 1000, sortBy: 'story_number', sortOrder: 'asc' }),
    staleTime: 5 * 60 * 1000,
  });

  // Get related items (same section, different items)
  const relatedItems = useMemo(() => {
    if (!item || !allItems) return [];
    
    return allItems
      .filter(relatedItem => 
        relatedItem.id !== item.id && 
        relatedItem.section_name === item.section_name
      )
      .filter(relatedItem => relatedItem.enrichment_status === 'enriched')
      .slice(0, 8);
  }, [item, allItems]);


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
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Item</h1>
        <p className="text-gray-600">Unable to load item details. Please try again.</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Item Not Found</h1>
        <p className="text-gray-600">The requested item could not be found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link to="/collections" className="hover:text-blue-600 transition-colors">
          Collections
        </Link>
        <span>→</span>
        <Link 
          to={`/collections/${encodeURIComponent(item.section_name || '')}`} 
          className="hover:text-blue-600 transition-colors"
        >
          {item.section_name}
        </Link>
        <span>→</span>
        <span className="text-gray-900 font-medium">{item.title}</span>
      </div>

      {/* Hero Section */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
          {/* Image Section */}
          <div className="aspect-video lg:aspect-square relative">
            {item.wiki_image_url ? (
              <img
                src={item.wiki_image_url}
                alt={item.title}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-50">
                    {getSectionEmoji(item.section_name || '')}
                  </div>
                  <PhotoIcon className="h-16 w-16 text-gray-300 mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getSectionEmoji(item.section_name || '')}</div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{item.title}</h1>
                    {item.story_title && item.story_title !== item.title && (
                      <p className="text-xl text-gray-600 mt-1">{item.story_title}</p>
                    )}
                    {item.episode_title && (
                      <p className="text-lg text-gray-500 mt-1">{item.episode_title}</p>
                    )}
                  </div>
                </div>
                <Link
                  to={`/collections/${encodeURIComponent(item.section_name || '')}`}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  <span>Back to {item.section_name}</span>
                </Link>
              </div>

              {/* Enrichment Status */}
              <div className="flex items-center space-x-4 mb-6">
                <EnrichmentBadge 
                  status={item.enrichment_status} 
                  confidence={item.enrichment_confidence || 0}
                />
                {item.enrichment_confidence && (
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <StarSolidIcon className="h-4 w-4 text-yellow-500" />
                    <span>{Math.round(item.enrichment_confidence * 100)}% confidence</span>
                  </div>
                )}
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {item.section_name && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BookOpenIcon className="h-4 w-4" />
                    <span>{item.section_name}</span>
                  </div>
                )}
                {item.content_type && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <FilmIcon className="h-4 w-4" />
                    <span>{item.content_type}</span>
                  </div>
                )}
                {item.doctor && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <UserIcon className="h-4 w-4" />
                    <span>{item.doctor}</span>
                  </div>
                )}
                {item.duration && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4" />
                    <span>{item.duration}</span>
                  </div>
                )}
                {item.created_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <CalendarDaysIcon className="h-4 w-4" />
                    <span>{new Date(item.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                {item.story_number && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Story #{item.story_number}</span>
                  </div>
                )}
              </div>

              {/* External Links */}
              {item.wiki_url && (
                <div className="pt-4">
                  <a
                    href={item.wiki_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <span>View on TARDIS Wiki</span>
                    <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Synopsis/Summary */}
        {item.wiki_summary && (
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Synopsis</h2>
            <p className="text-gray-700 leading-relaxed">{item.wiki_summary}</p>
          </div>
        )}

        {/* Production Details */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Production Details</h2>
          <div className="space-y-3">
            {item.writer && (
              <div className="flex justify-between">
                <span className="text-gray-600">Writer:</span>
                <span className="text-gray-900 font-medium">{item.writer}</span>
              </div>
            )}
            {item.director && (
              <div className="flex justify-between">
                <span className="text-gray-600">Director:</span>
                <span className="text-gray-900 font-medium">{item.director}</span>
              </div>
            )}
            {item.companions && (
              <div className="flex justify-between">
                <span className="text-gray-600">Companions:</span>
                <span className="text-gray-900 font-medium">{item.companions}</span>
              </div>
            )}
            {item.series && (
              <div className="flex justify-between">
                <span className="text-gray-600">Series:</span>
                <span className="text-gray-900 font-medium">{item.series}</span>
              </div>
            )}
            {item.format && (
              <div className="flex justify-between">
                <span className="text-gray-600">Format:</span>
                <span className="text-gray-900 font-medium">{item.format}</span>
              </div>
            )}
            {item.updated_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated:</span>
                <span className="text-gray-900 font-medium">{new Date(item.updated_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Items */}
      {relatedItems.length > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              More from {item.section_name}
            </h2>
            <Link
              to={`/collections/${encodeURIComponent(item.section_name || '')}`}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {relatedItems.map((relatedItem) => (
              <ContentCard
                key={relatedItem.id}
                item={relatedItem}
                variant="compact"
                showEnrichmentStatus={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDetailPage;