/**
 * Main Entry Point for Doctor Who Library
 * 
 * React application entry point that initializes the root component
 * Features:
 * - Strict Mode for development safety
 * - React 18 concurrent features
 * - CSS imports for styling
 * - App component rendering
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
