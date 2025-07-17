/**
 * Collection Detail Page Component
 *
 * Displays all items within a specific collection/section
 * Features:
 * - Collection header with stats and metadata
 * - Grid layout with content cards matching landing page design
 * - Filtering by content type, enrichment status
 * - Sorting by title, date, enrichment confidence
 * - Search within collection
 * - Responsive design
 * - Breadcrumb navigation
 */

import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ViewColumnsIcon,
  ArrowLeftIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { libraryApi, queryKeys } from "../services/api";
import ContentCard from "../components/ContentCard";
import LoadingSpinner from "../components/LoadingSpinner";
import type { EnrichmentStatus } from "../types/api";

type SortField =
  | "title"
  | "story_number"
  | "created_at"
  | "enrichment_confidence";
type SortOrder = "asc" | "desc";

interface Filters {
  contentType: string;
  enrichmentStatus: EnrichmentStatus | "";
  search: string;
}

const CollectionDetailPage: React.FC = () => {
  const { sectionName } = useParams<{ sectionName: string }>();
  const decodedSectionName = decodeURIComponent(sectionName || "");

  const [sortField, setSortField] = useState<SortField>("title");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [filters, setFilters] = useState<Filters>({
    contentType: "",
    enrichmentStatus: "",
    search: "",
  });

  // Fetch all items and filter by section (temporary solution until backend section filtering is implemented)
  const {
    data: allLibraryItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.library.items({
      limit: 10000,
    }),
    queryFn: () =>
      libraryApi.getLibraryItems({
        limit: 10000,
      }),
    staleTime: 5 * 60 * 1000,
    enabled: !!decodedSectionName,
  });

  // Filter items by section on the client side
  const allItems = useMemo(() => {
    if (!allLibraryItems || !decodedSectionName) return [];
    return allLibraryItems.filter(
      (item) => item.section_name === decodedSectionName
    );
  }, [allLibraryItems, decodedSectionName]);

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    if (!allItems) return [];

    let filtered = allItems.filter((item) => {
      const matchesContentType =
        !filters.contentType || item.content_type === filters.contentType;
      const matchesEnrichmentStatus =
        !filters.enrichmentStatus ||
        item.enrichment_status === filters.enrichmentStatus;
      const matchesSearch =
        !filters.search ||
        item.title?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.story_title
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.episode_title
          ?.toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        item.doctor?.toLowerCase().includes(filters.search.toLowerCase()) ||
        item.writer?.toLowerCase().includes(filters.search.toLowerCase());

      return matchesContentType && matchesEnrichmentStatus && matchesSearch;
    });

    // Sort filtered items
    filtered.sort((a, b) => {
      let aValue: any = a[sortField] || "";
      let bValue: any = b[sortField] || "";

      if (sortField === "enrichment_confidence") {
        aValue = a.enrichment_confidence || 0;
        bValue = b.enrichment_confidence || 0;
      } else if (sortField === "story_number") {
        aValue = parseInt(a.story_number || "0");
        bValue = parseInt(b.story_number || "0");
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allItems, filters, sortField, sortOrder]);

  // Get unique content types for filter
  const contentTypes = useMemo(() => {
    if (!allItems) return [];
    return [
      ...new Set(allItems.map((item) => item.content_type).filter(Boolean)),
    ].sort();
  }, [allItems]);

  // Calculate collection stats
  const collectionStats = useMemo(() => {
    if (!allItems) return { total: 0, enriched: 0, pending: 0, failed: 0 };

    return {
      total: allItems.length,
      enriched: allItems.filter((item) => item.enrichment_status === "enriched")
        .length,
      pending: allItems.filter((item) => item.enrichment_status === "pending")
        .length,
      failed: allItems.filter((item) => item.enrichment_status === "failed")
        .length,
    };
  }, [allItems]);

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const getSectionEmoji = (section: string): string => {
    if (section.includes("1st")) return "👴";
    if (section.includes("2nd")) return "🎭";
    if (section.includes("3rd")) return "🥋";
    if (section.includes("4th")) return "🧣";
    if (section.includes("5th")) return "🏏";
    if (section.includes("6th")) return "🌈";
    if (section.includes("7th")) return "🎩";
    if (section.includes("8th")) return "💫";
    if (section.includes("9th")) return "👂";
    if (section.includes("10th")) return "🕺";
    if (section.includes("11th")) return "🎀";
    if (section.includes("12th")) return "🎸";
    if (section.includes("13th")) return "👥";
    if (section.includes("14th")) return "🔄";
    if (section.includes("15th")) return "✨";
    if (section.includes("Torchwood")) return "🚀";
    if (section.includes("Sarah Jane")) return "👩‍🔬";
    if (section.includes("Dalek")) return "🔵";
    if (section.includes("Cybermen")) return "🤖";
    if (section.includes("Master")) return "👹";
    if (section.includes("War Doctor")) return "⚔️";
    if (section.includes("Documentaries")) return "📺";
    return "📚";
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
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Error Loading Collection
        </h1>
        <p className="text-gray-600">
          Unable to load collection data. Please try again.
        </p>
      </div>
    );
  }

  if (!decodedSectionName) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Collection Not Found
        </h1>
        <p className="text-gray-600">
          The requested collection could not be found.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center space-x-2 text-sm text-gray-500">
        <Link
          to="/collections"
          className="hover:text-blue-600 transition-colors"
        >
          Collections
        </Link>
        <span>→</span>
        <span className="text-gray-900 font-medium">{decodedSectionName}</span>
      </div>

      {/* Collection Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">
              {getSectionEmoji(decodedSectionName)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {decodedSectionName}
              </h1>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>{collectionStats.total} items</span>
                <span>•</span>
                <span className="text-green-600">
                  {collectionStats.enriched} enriched
                </span>
                <span>•</span>
                <span className="text-yellow-600">
                  {collectionStats.pending} pending
                </span>
                {collectionStats.failed > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-red-600">
                      {collectionStats.failed} failed
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Link
            to="/collections"
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Back to Collections</span>
          </Link>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg p-4 border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filters & Sorting</span>
          </div>
          <div className="flex items-center space-x-4">
            <AdjustmentsHorizontalIcon className="h-5 w-5 text-gray-400" />
            <select
              value={`${sortField}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split("-");
                setSortField(field as SortField);
                setSortOrder(order as SortOrder);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="title-asc">Title (A-Z)</option>
              <option value="title-desc">Title (Z-A)</option>
              <option value="story_number-asc">Story Number (Low-High)</option>
              <option value="story_number-desc">Story Number (High-Low)</option>
              <option value="broadcast_date-asc">
                Broadcast Date (Old-New)
              </option>
              <option value="broadcast_date-desc">
                Broadcast Date (New-Old)
              </option>
              <option value="enrichment_confidence-desc">
                Enrichment Confidence (High-Low)
              </option>
              <option value="enrichment_confidence-asc">
                Enrichment Confidence (Low-High)
              </option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search within collection..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
            />
          </div>

          {/* Content Type Filter */}
          <select
            value={filters.contentType}
            onChange={(e) => handleFilterChange("contentType", e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Content Types</option>
            {contentTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Enrichment Status Filter */}
          <select
            value={filters.enrichmentStatus}
            onChange={(e) =>
              handleFilterChange("enrichmentStatus", e.target.value)
            }
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">All Statuses</option>
            <option value="enriched">Enriched</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="skipped">Skipped</option>
          </select>

          {/* Clear Filters */}
          <button
            onClick={() =>
              setFilters({ contentType: "", enrichmentStatus: "", search: "" })
            }
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredAndSortedItems.map((item) => (
          <ContentCard
            key={item.id}
            item={item}
            variant="default"
            showEnrichmentStatus={true}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedItems.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <ViewColumnsIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No items found
          </h3>
          <p className="text-gray-600">
            {filters.search || filters.contentType || filters.enrichmentStatus
              ? "Try adjusting your filters to see more results."
              : "This collection appears to be empty."}
          </p>
        </div>
      )}
    </div>
  );
};

export default CollectionDetailPage;
