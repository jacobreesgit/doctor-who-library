/**
 * Main Navigation component implementing hybrid navigation strategy
 * Stories/Universe/Explore/Recent tabs with contextual sub-navigation
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BookOpenIcon, 
  GlobeAltIcon, 
  SparklesIcon, 
  ClockIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

interface NavigationProps {
  className?: string;
}

const Navigation: React.FC<NavigationProps> = ({ className = '' }) => {
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
      id: 'universe',
      label: 'Universe',
      icon: GlobeAltIcon,
      href: '/universe',
      description: 'Spin-offs and expanded content',
      subItems: [
        { label: 'Main Shows', href: '/universe/shows' },
        { label: 'Audio Universe', href: '/universe/audio' },
        { label: 'Documentaries', href: '/universe/documentaries' },
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
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Main Navigation Tabs */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActive(tab.href);
              
              return (
                <div key={tab.id} className="relative">
                  <button
                    onClick={() => handleDropdownToggle(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-2 text-sm font-medium transition-colors border-b-2 ${
                      active
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    <ChevronDownIcon className="h-4 w-4" />
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
          </div>

          {/* Search Bar */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search library..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-64"
              />
            </div>
            <Link
              to="/my-library"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
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
    </nav>
  );
};

export default Navigation;