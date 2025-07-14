/**
 * WikiSummary component with expandable "read more" functionality
 */

import React, { useState } from 'react';

interface WikiSummaryProps {
  summary?: string;
  maxLength?: number;
  className?: string;
}

const WikiSummary: React.FC<WikiSummaryProps> = ({ 
  summary, 
  maxLength = 150, 
  className = '' 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!summary) {
    return null;
  }

  const needsTruncation = summary.length > maxLength;
  const displayText = needsTruncation && !isExpanded 
    ? summary.substring(0, maxLength).trim() + '...'
    : summary;

  return (
    <div className={`text-sm text-gray-700 ${className}`}>
      <p className="leading-relaxed">
        {displayText}
        {needsTruncation && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="ml-2 text-blue-600 hover:text-blue-800 font-medium focus:outline-none focus:underline transition-colors"
          >
            {isExpanded ? 'Read less' : 'Read more'}
          </button>
        )}
      </p>
    </div>
  );
};

export default WikiSummary;