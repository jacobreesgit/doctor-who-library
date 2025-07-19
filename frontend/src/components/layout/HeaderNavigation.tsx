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

import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { getSectionSlug } from "../../utils/sections";
import { useAuth } from "../../contexts/AuthContext";
import { useSearch } from "../../hooks/useSearch";
import { SECTION_CATEGORIES } from "../../constants/sections";

interface HeaderNavigationProps {
  className?: string;
}

interface SubItem {
  label: string;
  href: string;
}

interface MainTab {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  subItems: SubItem[];
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  className = "",
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signInWithGoogle, signOut, loading, isAdmin } = useAuth();
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Search functionality
  const {
    query,
    results,
    isLoading,
    hasResults,
    selectedIndex,
    setQuery,
    clearSearch,
    selectNext,
    selectPrevious,
    selectResult,
    getSelectedResult
  } = useSearch();
  
  const [showSearchResults, setShowSearchResults] = useState(false);

  const mainTabs: MainTab[] = [
    {
      id: "doctors",
      label: "Doctors",
      icon: BookOpenIcon,
      href: "/doctors",
      description: "Browse by Doctor era and incarnation",
      subItems: SECTION_CATEGORIES['All Doctors'].map(doctor => ({
        label: doctor,
        href: `/collections/${getSectionSlug(doctor)}`
      })),
    },
  ];

  const isActive = (href: string) => {
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const handleDropdownToggle = (tabId: string) => {
    setActiveDropdown(activeDropdown === tabId ? null : tabId);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    setActiveDropdown(null); // Close any open dropdowns when toggling mobile menu
    setShowSearchResults(false); // Close search results
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
    setShowSearchResults(false);
  };
  
  // Search handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSearchResults(value.length > 0);
  };
  
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSearchResults && query.length > 0) {
        setShowSearchResults(true);
      } else {
        selectNext();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectPrevious();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedResult = getSelectedResult();
      if (selectedResult) {
        navigate(`/item/${selectedResult.id}`);
        clearSearch();
        setShowSearchResults(false);
        searchRef.current?.blur();
      }
    } else if (e.key === 'Escape') {
      setShowSearchResults(false);
      clearSearch();
      searchRef.current?.blur();
    }
  };
  
  const handleSearchResultClick = (result: typeof results[0]) => {
    navigate(`/item/${result.id}`);
    clearSearch();
    setShowSearchResults(false);
    searchRef.current?.blur();
  };
  
  const handleSearchFocus = () => {
    if (query.length > 0) {
      setShowSearchResults(true);
    }
  };
  
  const handleSearchBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowSearchResults(false), 200);
  };
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className={`header-navigation bg-blue-600 text-white shadow-lg ${className}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Brand */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-xl">📺</div>
            <div>
              <h1 className="text-lg font-bold">Doctor Who Library</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            {/* Navigation Tabs */}
            <nav className="flex items-center space-x-6">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);

                return (
                  <div key={tab.id} className="relative">
                    {tab.subItems.length > 0 ? (
                      <button
                        onClick={() => handleDropdownToggle(tab.id)}
                        className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium transition-colors rounded-md ${
                          active
                            ? "bg-blue-500 text-white"
                            : "text-blue-200 hover:text-white hover:bg-blue-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                        <ChevronDownIcon className="h-3 w-3" />
                      </button>
                    ) : (
                      <Link
                        to={tab.href}
                        className={`flex items-center space-x-2 py-2 px-3 text-sm font-medium transition-colors rounded-md ${
                          active
                            ? "bg-blue-500 text-white"
                            : "text-blue-200 hover:text-white hover:bg-blue-500"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span>{tab.label}</span>
                      </Link>
                    )}

                    {/* Dropdown Menu */}
                    {activeDropdown === tab.id && (
                      <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
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

            {/* Desktop Search and Auth */}
            <div className="flex items-center space-x-4">
              <div className="relative" ref={searchRef}>
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 text-gray-900 text-sm"
                />
                
                {/* Search Results Dropdown */}
                {showSearchResults && (query.length > 0) && (
                  <div className="absolute top-full left-0 mt-1 w-96 bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Searching...
                      </div>
                    ) : hasResults ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          Search Results
                        </div>
                        {results.map((result, index) => (
                          <button
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            onMouseEnter={() => selectResult(index)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                              index === selectedIndex ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.title || result.story_title || result.episode_title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {result.content_type || 'Unknown'} • {result.section_name || 'Unknown Section'}
                                </p>
                                {result.doctor && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    {result.doctor}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : query.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No results found for "{query}"
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Type at least 2 characters to search
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Authentication */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse"></div>
              ) : user ? (
                <div className="relative">
                  <button
                    onClick={() => handleDropdownToggle('user')}
                    className="flex items-center space-x-2 p-2 rounded-md text-blue-200 hover:text-white hover:bg-blue-500 transition-colors"
                  >
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8" />
                    )}
                    <span className="hidden md:block text-sm font-medium">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDownIcon className="h-4 w-4" />
                  </button>
                  
                  {/* User Dropdown */}
                  {activeDropdown === 'user' && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {user.email}
                        </div>
                        <div className="border-t border-gray-100 mt-2">
                          <Link
                            to="/favorites"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setActiveDropdown(null)}
                          >
                            My Favorites
                          </Link>
                          <Link
                            to="/watch-history"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                            onClick={() => setActiveDropdown(null)}
                          >
                            Watch History
                          </Link>
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-blue-600 hover:bg-gray-50 hover:text-blue-700 font-medium"
                              onClick={() => setActiveDropdown(null)}
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              signOut();
                              setActiveDropdown(null);
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 hover:text-red-700"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="flex items-center space-x-2 px-4 py-2 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={handleMobileMenuToggle}
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-md text-blue-200 hover:text-white hover:bg-blue-500 transition-colors"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-blue-500">
            {/* Mobile Search */}
            <div className="mt-4 mb-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search library..."
                  value={query}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                />
                
                {/* Mobile Search Results */}
                {showSearchResults && (query.length > 0) && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md shadow-lg border border-gray-200 z-50 max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Searching...
                      </div>
                    ) : hasResults ? (
                      <div className="py-2">
                        <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                          Search Results
                        </div>
                        {results.map((result, index) => (
                          <button
                            key={result.id}
                            onClick={() => handleSearchResultClick(result)}
                            onMouseEnter={() => selectResult(index)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                              index === selectedIndex ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {result.title || result.story_title || result.episode_title}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {result.content_type || 'Unknown'} • {result.section_name || 'Unknown Section'}
                                </p>
                                {result.doctor && (
                                  <p className="text-xs text-blue-600 mt-1">
                                    {result.doctor}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : query.length >= 2 ? (
                      <div className="p-4 text-center text-gray-500">
                        <MagnifyingGlassIcon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                        No results found for "{query}"
                      </div>
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        Type at least 2 characters to search
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);

                return (
                  <div key={tab.id}>
                    {tab.subItems.length > 0 ? (
                      <button
                        onClick={() => handleDropdownToggle(tab.id)}
                        className={`w-full flex items-center justify-between py-3 px-4 text-sm font-medium transition-colors rounded-md ${
                          active
                            ? "bg-blue-500 text-white"
                            : "text-blue-200 hover:text-white hover:bg-blue-500"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </div>
                        <ChevronDownIcon 
                          className={`h-4 w-4 transition-transform ${
                            activeDropdown === tab.id ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                    ) : (
                      <Link
                        to={tab.href}
                        onClick={closeMobileMenu}
                        className={`w-full flex items-center py-3 px-4 text-sm font-medium transition-colors rounded-md ${
                          active
                            ? "bg-blue-500 text-white"
                            : "text-blue-200 hover:text-white hover:bg-blue-500"
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                        </div>
                      </Link>
                    )}

                    {/* Mobile Dropdown */}
                    {activeDropdown === tab.id && (
                      <div className="mt-2 ml-4 space-y-1 max-h-64 overflow-y-auto">
                        <div className="px-4 py-2 text-xs font-medium text-blue-300 uppercase tracking-wide">
                          {tab.description}
                        </div>
                        {tab.subItems.map((item) => (
                          <Link
                            key={item.href}
                            to={item.href}
                            className="block px-4 py-2 text-sm text-blue-200 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                            onClick={closeMobileMenu}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>

            {/* Mobile Authentication */}
            <div className="mt-4 pt-4 border-t border-blue-500">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
              ) : user ? (
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 px-4 py-2 text-blue-200">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt={user.user_metadata?.full_name || user.email}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <UserCircleIcon className="h-8 w-8" />
                    )}
                    <div>
                      <p className="font-medium">{user.user_metadata?.full_name || user.email?.split('@')[0]}</p>
                      <p className="text-xs text-blue-300">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/favorites"
                    className="block w-full text-left py-3 px-4 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    My Favorites
                  </Link>
                  <Link
                    to="/watch-history"
                    className="block w-full text-left py-3 px-4 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                    onClick={closeMobileMenu}
                  >
                    Watch History
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="block w-full text-left py-3 px-4 text-sm font-medium text-blue-200 hover:text-white hover:bg-blue-500 rounded-md transition-colors"
                      onClick={closeMobileMenu}
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      signOut();
                      closeMobileMenu();
                    }}
                    className="block w-full text-left py-3 px-4 text-sm font-medium text-red-300 hover:text-red-200 hover:bg-blue-500 rounded-md transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    signInWithGoogle();
                    closeMobileMenu();
                  }}
                  className="w-full px-4 py-3 bg-white text-blue-600 rounded-md font-medium hover:bg-blue-50 transition-colors"
                >
                  Sign in with Google
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close dropdown when clicking outside */}
      {(activeDropdown || mobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setActiveDropdown(null);
            setMobileMenuOpen(false);
            setShowSearchResults(false);
          }}
        />
      )}
    </header>
  );
};

export default HeaderNavigation;
