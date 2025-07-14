/**
 * Header component for Doctor Who Library
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Header: React.FC = () => {
  return (
    <header className="bg-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="text-2xl">📺</div>
            <div>
              <h1 className="text-xl font-bold">Doctor Who Library</h1>
              <p className="text-xs text-blue-200">
                Your comprehensive guide to the Whoniverse
              </p>
            </div>
          </Link>
          
          <nav className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-blue-200 hover:text-white transition-colors"
            >
              Home
            </Link>
            <a 
              href="/docs" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-200 hover:text-white transition-colors"
            >
              API Docs
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;