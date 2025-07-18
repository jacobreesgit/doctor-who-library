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

import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  BookOpenIcon,
  SparklesIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { getSectionSlug } from "../../utils/sections";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderNavigationProps {
  className?: string;
}

const HeaderNavigation: React.FC<HeaderNavigationProps> = ({
  className = "",
}) => {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signInWithGoogle, signOut, loading } = useAuth();

  const mainTabs = [
    {
      id: "browse",
      label: "Browse All",
      icon: BookOpenIcon,
      href: "/collections",
      description: "Browse all Doctor Who content",
      subItems: [
        { label: "All Collections", href: "/collections" },
        { label: "TV Stories", href: "/collections?type=TV" },
        { label: "Audio Stories", href: "/collections?type=Audio" },
        { label: "Comic Stories", href: "/collections?type=Comic" },
        { label: "Documentaries", href: `/collections/${getSectionSlug("Documentaries")}` },
      ],
    },
    {
      id: "doctors",
      label: "Doctors",
      icon: BookOpenIcon,
      href: "/doctors",
      description: "Browse by Doctor era and incarnation",
      subItems: [
        { label: "1st Doctor", href: `/collections/${getSectionSlug("1st Doctor")}` },
        { label: "4th Doctor", href: `/collections/${getSectionSlug("4th Doctor")}` },
        { label: "8th Doctor", href: `/collections/${getSectionSlug("8th Doctor")}` },
        { label: "10th Doctor", href: `/collections/${getSectionSlug("10th Doctor")}` },
        { label: "11th Doctor", href: `/collections/${getSectionSlug("11th Doctor")}` },
        { label: "War Doctor", href: `/collections/${getSectionSlug("War Doctor")}` },
      ],
    },
    {
      id: "spinoffs",
      label: "Spin-offs",
      icon: SparklesIcon,
      href: "/spinoffs",
      description: "Expanded universe shows and characters",
      subItems: [
        { label: "Torchwood", href: `/collections/${getSectionSlug("Torchwood and Captain Jack")}` },
        { label: "Sarah Jane Smith", href: `/collections/${getSectionSlug("Sarah Jane Smith")}` },
        { label: "Class", href: `/collections/${getSectionSlug("Class")}` },
        { label: "K-9", href: `/collections/${getSectionSlug("K-9")}` },
        { label: "UNIT", href: `/collections/${getSectionSlug("UNIT")}` },
      ],
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
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setActiveDropdown(null);
  };

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

            {/* Desktop Search and Auth */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search library..."
                  className="pl-9 pr-4 py-1.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48 text-gray-900 text-sm"
                />
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
                    <div className="absolute top-full right-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
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
                  className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 text-sm"
                />
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="space-y-2">
              {mainTabs.map((tab) => {
                const Icon = tab.icon;
                const active = isActive(tab.href);

                return (
                  <div key={tab.id}>
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

                    {/* Mobile Dropdown */}
                    {activeDropdown === tab.id && (
                      <div className="mt-2 ml-4 space-y-1">
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
          }}
        />
      )}
    </header>
  );
};

export default HeaderNavigation;
