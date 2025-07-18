/**
 * Collection Card Component
 * 
 * Card component for displaying Doctor Who collection/section overview
 * Different from LibraryCard which displays individual items
 * Features:
 * - Collection header with emoji and statistics
 * - Featured items preview grid
 * - Enrichment status indicators
 * - Navigation to collection detail page
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { LibraryItemResponse } from '../../types/api';
import { getSectionEmoji, getSectionSlug } from '../../utils/sections';

interface CollectionCardProps {
  section: string;
  items: LibraryItemResponse[];
  stats: {
    total: number;
    enriched: number;
    pending: number;
  };
  className?: string;
}

const CollectionCard: React.FC<CollectionCardProps> = ({
  section,
  items,
  stats,
  className = '',
}) => {
  const featuredItems = items.slice(0, 3);

  return (
    <Link
      to={`/collections/${getSectionSlug(section)}`}
      className={`collection-card group bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 overflow-hidden ${className}`}
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
};

export default CollectionCard;