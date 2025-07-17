/**
 * Design System Theme
 * 
 * Doctor Who themed design system with consistent colors, spacing, and typography
 * Features:
 * - Doctor Who universe colors
 * - Accessible color contrasts
 * - Responsive breakpoints
 * - Consistent spacing scale
 * - Typography system
 */

export const colors = {
  // Doctor Who Universe Colors
  tardis: {
    blue: '#003B6D',
    light: '#0056A3',
    dark: '#002A4D'
  },
  gallifrey: {
    gold: '#FFD700',
    orange: '#FF8C00',
    red: '#DC143C'
  },
  cyberman: {
    silver: '#C0C0C0',
    steel: '#708090',
    dark: '#2F4F4F'
  },
  dalek: {
    bronze: '#CD7F32',
    gold: '#DAA520',
    black: '#1C1C1C'
  },
  vortex: {
    purple: '#663399',
    blue: '#0066CC',
    green: '#009966'
  },
  
  // Semantic Colors
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  
  // Enrichment Status Colors
  enrichment: {
    pending: {
      bg: '#fef3c7',
      text: '#92400e',
      border: '#fbbf24'
    },
    enriched: {
      bg: '#d1fae5',
      text: '#065f46',
      border: '#34d399'
    },
    failed: {
      bg: '#fee2e2',
      text: '#991b1b',
      border: '#f87171'
    },
    skipped: {
      bg: '#f3f4f6',
      text: '#374151',
      border: '#9ca3af'
    }
  },
  
  // Confidence Levels
  confidence: {
    low: '#ef4444',
    medium: '#f59e0b',
    high: '#10b981',
    premium: '#8b5cf6'
  },
  
  // Grayscale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827'
  }
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
  40: '10rem',
  48: '12rem',
  56: '14rem',
  64: '16rem'
};

export const typography = {
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
    '8xl': '6rem',
    '9xl': '8rem'
  },
  
  fontWeights: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900'
  },
  
  lineHeights: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2'
  },
  
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em'
  }
};

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none'
};

export const borderRadius = {
  none: '0',
  sm: '0.125rem',
  DEFAULT: '0.25rem',
  md: '0.375rem',
  lg: '0.5rem',
  xl: '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full: '9999px'
};

export const breakpoints = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px'
};

export const animations = {
  spin: 'spin 1s linear infinite',
  ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
  pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
  bounce: 'bounce 1s infinite',
  
  // Doctor Who specific animations
  materialization: 'materialization 2s ease-in-out',
  vortex: 'vortex 3s linear infinite',
  regeneration: 'regeneration 1s ease-in-out'
};

export const theme = {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  breakpoints,
  animations
};

export default theme;