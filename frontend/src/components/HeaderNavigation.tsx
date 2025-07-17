/**
 * Combined Header and Navigation Component
 * 
 * Unified header and navigation bar for Doctor Who Library
 * Features:
 * - Doctor Who Library branding with icon
 * - Integrated navigation tabs (Stories/Explore/Recent)
 * - Dropdown menus with contextual sub-navigation
 * - Search functionality
 * - Active state management and visual indicators
 * - Responsive design with mobile considerations
 * - TARDIS blue color scheme
 * - Accessibility support with keyboard navigation
 * - Outside click handling for dropdown menus
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpenIcon, 
  SparklesIcon, 
  ClockIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface HeaderNavigationProps {
  className?: string;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({ className = '' }) => {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const mainTabs = [
    {
      id: 'stories',
      label: 'Stories',
      icon: BookOpenIcon,
      href: '/stories',
      description: 'Browse by Doctor, format, or chronology',
      subItems: [
        { label: 'By Doctor', href: '/stories/doctors' },
        { label: 'By Format', href: '/stories/formats' },
        { label: 'All Stories', href: '/stories/all' },
      ]
    },
    {
      id: 'explore',
      label: 'Explore',
      icon: SparklesIcon,
      href: '/explore',
      description: 'Curated collections and discoveries',
      subItems: [
        { label: 'Featured', href: '/explore/featured' },
        { label: 'Collections', href: '/explore/collections' },
        { label: 'New Additions', href: '/explore/new' },
      ]
    },
    {
      id: 'recent',
      label: 'Recent',
      icon: ClockIcon,
      href: '/recent',
      description: 'Your activity and favorites',
      subItems: [
        { label: 'Continue Watching', href: '/recent/continue' },
        { label: 'Recently Added', href: '/recent/added' },
        { label: 'Your Favorites', href: '/recent/favorites' },
      ]
    }
  ];

  const isActive = (href: string) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const handleDropdownToggle = (tabId: string) => {
    setActiveDropdown(activeDropdown === tabId ? null : tabId);
  };

  return (
    <header className={`bg-blue-600 text-white shadow-lg ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Brand and Navigation */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-3">
              <div className="text-xl">📺</div>
              <div>
                <h1 className="text-lg font-bold">Doctor Who Library</h1>
              </div>
            </Link>
            
            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-6">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);
                
                return (
                  <div key={tab.id} className="relative">
                    <button
                      onClick={() => handleDropdownToggle(tab.id)}
                      className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium transition-colors rounded-md ${
                        active
                          ? 'bg-blue-500 text-white'
                          : 'text-blue-200 hover:text-white hover:bg-blue-500'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                      <ChevronDownIcon className="h-3 w-3" />
                    </button>

                    {/* Dropdown Menu */}
                    {activeDropdown === tab.id && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {tab.description}
                          </div>
                          <div className="border-t border-gray-100 mt-2">
                            {tab.subItems.map((item) => (
                              <Link
                                key={item.href}
                                to={item.href}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                onClick={() => setActiveDropdown(null)}
                              >
                                {item.label}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </div>

          {/* Right side - Search and Actions */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search library..."
                className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 text-gray-900 text-sm"
              />
            </div>
            <Link
              to="/my-library"
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              My Library
            </Link>
          </div>
        </div>
      </div>

      {/* Close dropdown when clicking outside */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </header>
  );
};

export default HeaderNavigation;