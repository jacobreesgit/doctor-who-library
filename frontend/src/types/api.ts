/**
 * TypeScript interfaces for Doctor Who Library API responses
 */

export interface LibraryItemResponse {
  id: string;
  title: string;
  display_title: string;
  content_type?: string;
  doctor?: string;
  companions?: string;
  writer?: string;
  director?: string;
  enrichment_status: EnrichmentStatus;
  enrichment_confidence: number;
  wiki_url?: string;
  wiki_summary?: string;
  wiki_image_url?: string;
}

export interface LibraryStatsResponse {
  total_items: number;
  total_sections: number;
  total_groups: number;
  enrichment_stats: Record<EnrichmentStatus, number>;
  note: string;
}

export interface LibrarySectionResponse {
  id: string;
  name: string;
  display_name?: string;
}

export interface LibrarySearchResponse {
  query: string;
  total_results: number;
  results: LibraryItemResponse[];
}

export type EnrichmentStatus = 'pending' | 'enriched' | 'failed' | 'skipped';

// API Query Parameters
export interface LibraryItemsQuery {
  section?: string;
  content_type?: string;
  doctor?: string;
  enrichment_status?: EnrichmentStatus;
  limit?: number;
  offset?: number;
}

export interface LibrarySearchQuery {
  q: string;
  limit?: number;
}

// API Error Response
export interface ApiError {
  detail: string;
  status_code?: number;
}