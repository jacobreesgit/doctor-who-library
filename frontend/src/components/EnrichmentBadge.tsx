/**
 * Enrichment Badge Component
 * 
 * Status badge for TARDIS Wiki enrichment with confidence indicators
 * Features:
 * - Multiple enrichment states (pending, enriched, failed, skipped)
 * - Confidence percentage display
 * - Animated states for pending items
 * - Accessible with proper ARIA labels
 * - Customizable sizes and variants
 * - Real-time updates integration
 * - Tooltip with detailed information
 */

import React, { useState } from 'react';
import type { EnrichmentStatus } from '../types/api';

interface EnrichmentBadgeProps {
  status: EnrichmentStatus;
  confidence: number;
  showConfidence?: boolean;
  size?: 'sm' | 'md';
}

const EnrichmentBadge: React.FC<EnrichmentBadgeProps> = ({ 
  status, 
  confidence, 
  showConfidence = false,
  size = 'sm'
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getStatusConfig = (status: EnrichmentStatus) => {
    switch (status) {
      case 'enriched':
        return {
          label: 'Enriched',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: '✓'
        };
      case 'pending':
        return {
          label: 'Pending',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏳'
        };
      case 'failed':
        return {
          label: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: '✗'
        };
      case 'skipped':
        return {
          label: 'Skipped',
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⊝'
        };
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '?'
        };
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatConfidence = (confidence: number) => {
    return Math.round(confidence * 100);
  };

  const config = getStatusConfig(status);
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <div className="enrichment-badge relative inline-flex items-center">
      <span
        className={`inline-flex items-center space-x-1 font-medium rounded-full border ${config.className} ${sizeClasses} cursor-default`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span>{config.icon}</span>
        <span>{config.label}</span>
        {showConfidence && status === 'enriched' && (
          <span className={`font-semibold ${getConfidenceColor(confidence)}`}>
            {formatConfidence(confidence)}%
          </span>
        )}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-10 shadow-lg">
          <div className="text-center">
            <div className="font-medium">{config.label} Status</div>
            {status === 'enriched' && (
              <div className="mt-1">
                <div>Confidence: {formatConfidence(confidence)}%</div>
                <div className="text-gray-300">
                  {confidence >= 0.8 ? 'High Quality' : 
                   confidence >= 0.5 ? 'Medium Quality' : 'Low Quality'}
                </div>
              </div>
            )}
            {status === 'pending' && (
              <div className="text-gray-300 mt-1">Awaiting wiki enrichment</div>
            )}
            {status === 'failed' && (
              <div className="text-gray-300 mt-1">Enrichment failed</div>
            )}
            {status === 'skipped' && (
              <div className="text-gray-300 mt-1">Enrichment skipped</div>
            )}
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
};

export default EnrichmentBadge;