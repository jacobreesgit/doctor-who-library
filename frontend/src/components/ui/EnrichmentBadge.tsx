/**
 * Enrichment Badge Component
 * 
 * Specialized badge for displaying enrichment status and confidence
 * Features:
 * - Multiple enrichment states
 * - Confidence percentage display
 * - Real-time updates
 * - Accessibility support
 * - Mobile-optimized
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from './utils/classNames';
import { 
  CheckCircleIcon, 
  ClockIcon, 
  XCircleIcon, 
  ForwardIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const badgeVariants = cva(
  'inline-flex items-center rounded-full text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        enriched: 'bg-green-100 text-green-800 hover:bg-green-200',
        pending: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        failed: 'bg-red-100 text-red-800 hover:bg-red-200',
        skipped: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      },
      size: {
        default: 'px-2.5 py-0.5',
        sm: 'px-2 py-0.5',
        lg: 'px-3 py-1'
      },
      confidence: {
        low: 'ring-1 ring-red-200',
        medium: 'ring-1 ring-yellow-200',
        high: 'ring-1 ring-green-200',
        premium: 'ring-2 ring-gold-300 bg-gradient-to-r from-yellow-50 to-orange-50'
      }
    },
    defaultVariants: {
      variant: 'pending',
      size: 'default'
    }
  }
);

export interface EnrichmentBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  status: 'enriched' | 'pending' | 'failed' | 'skipped';
  confidence?: number;
  showIcon?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  compact?: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'enriched':
      return <CheckCircleIcon className="h-3 w-3" />;
    case 'pending':
      return <ClockIcon className="h-3 w-3" />;
    case 'failed':
      return <XCircleIcon className="h-3 w-3" />;
    case 'skipped':
      return <ForwardIcon className="h-3 w-3" />;
    default:
      return <SparklesIcon className="h-3 w-3" />;
  }
};

const getConfidenceLevel = (confidence: number) => {
  if (confidence >= 90) return 'premium';
  if (confidence >= 70) return 'high';
  if (confidence >= 50) return 'medium';
  return 'low';
};

const getStatusText = (status: string, confidence?: number, showPercentage?: boolean) => {
  switch (status) {
    case 'enriched':
      if (showPercentage && confidence) {
        return `${Math.round(confidence * 100)}%`;
      }
      return 'Enriched';
    case 'pending':
      return 'Enriching...';
    case 'failed':
      return 'Failed';
    case 'skipped':
      return 'Skipped';
    default:
      return 'Unknown';
  }
};

const EnrichmentBadge = React.forwardRef<HTMLSpanElement, EnrichmentBadgeProps>(
  (
    {
      className,
      variant,
      size,
      status,
      confidence,
      showIcon = true,
      showPercentage = false,
      animated = false,
      compact = false,
      ...props
    },
    ref
  ) => {
    const confidenceLevel = confidence ? getConfidenceLevel(confidence * 100) : undefined;
    const statusText = getStatusText(status, confidence, showPercentage);
    
    return (
      <span
        ref={ref}
        className={cn(
          badgeVariants({ 
            variant: status, 
            size: compact ? 'sm' : size,
            confidence: confidenceLevel 
          }),
          {
            'animate-pulse': animated && status === 'pending',
            'space-x-1': showIcon && !compact,
            'px-1.5': compact
          },
          className
        )}
        role="status"
        aria-label={`Enrichment status: ${statusText}`}
        {...props}
      >
        {showIcon && !compact && (
          <span className={animated && status === 'pending' ? 'animate-spin' : ''}>
            {getStatusIcon(status)}
          </span>
        )}
        
        {!compact && (
          <span>{statusText}</span>
        )}
        
        {compact && showIcon && (
          <span className={animated && status === 'pending' ? 'animate-spin' : ''}>
            {getStatusIcon(status)}
          </span>
        )}
      </span>
    );
  }
);

EnrichmentBadge.displayName = 'EnrichmentBadge';

export default EnrichmentBadge;