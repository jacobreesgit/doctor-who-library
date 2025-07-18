/**
 * Footer Component
 * 
 * Site footer with API documentation link and basic information
 */

import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-8 mt-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Left side - Brand */}
          <div className="flex items-center space-x-3 mb-4 md:mb-0">
            <div className="text-xl">📺</div>
            <div>
              <h3 className="text-lg font-bold">Doctor Who Library</h3>
              <p className="text-gray-400 text-sm">Comprehensive Doctor Who content browser</p>
            </div>
          </div>

          {/* Right side - Links */}
          <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-6">
            <Link
              to="/api-docs"
              className="text-gray-300 hover:text-white text-sm font-medium transition-colors"
            >
              API Documentation
            </Link>
            <span className="text-gray-500 text-sm">
              Powered by TARDIS Wiki
            </span>
            <div className="text-center md:text-right">
              <p className="text-gray-400 text-xs">
                Data from{' '}
                <a 
                  href="https://x.com/chrisvobe1?s=11" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  Chris Vobe's
                </a>{' '}
                <a 
                  href="https://docs.google.com/spreadsheets/d/16MD-lAKM21jnXsa6XPtUdNRCmrY1uhBVg--itaH5_X4/edit?usp=sharing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline"
                >
                  chronology work
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;