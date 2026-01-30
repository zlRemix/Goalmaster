
import React from 'react';

interface PacketGraphicProps {
  sizeClass: 'small' | 'medium' | 'large';
  tp: number;
}

export const PacketGraphic: React.FC<PacketGraphicProps> = ({ sizeClass, tp }) => {

  const SVGs = {
    small: (
      <svg width="140" height="200" viewBox="0 0 140 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="200" rx="12" fill="url(#small_gradient)"/>
        <rect width="140" height="200" rx="12" fill="url(#small_pattern)" opacity="0.1"/>
        <g filter="url(#lightning_shadow)">
          <path d="M70 80 L85 120 H55 L70 80Z" fill="#FBBF24"/>
          <path d="M62 120 L70 140 L78 120 H62Z" fill="#FBBF24"/>
        </g>
        <text x="70" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="36" fontWeight="bold" fill="white" filter="url(#text_shadow)">+{tp}</text>
        <text x="70" y="70" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="white" fillOpacity={0.8}>TP</text>
        <defs>
          <filter id="text_shadow" x="0" y="0" width="200%" height="200%">
             <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity={0.5}/>
          </filter>
          <filter id="lightning_shadow" x="45" y="75" width="50" height="75" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
            <feDropShadow dx="0" dy="2" stdDeviation="5" floodColor="#FBBF24" floodOpacity={0.7}/>
          </filter>
          <linearGradient id="small_gradient" x1="70" y1="0" x2="70" y2="200" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2A3A8A"/>
            <stop offset="1" stopColor="#1E2964"/>
          </linearGradient>
          <pattern id="small_pattern" patternContentUnits="objectBoundingBox" width="0.1" height="0.1">
            <path d="M-1 1 l2 -2 M0 10 l10 -10 M9 11 l2 -2" stroke="white" strokeWidth="0.5"/>
          </pattern>
        </defs>
      </svg>
    ),
    medium: (
        <svg width="140" height="200" viewBox="0 0 140 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="200" rx="12" fill="url(#medium_gradient)"/>
        <rect width="140" height="200" rx="12" fill="url(#medium_pattern)" opacity="0.1"/>
        <g filter="url(#lightning_shadow)">
          <path d="M70 75L90 115H50L70 75Z" fill="#FBBF24"/>
          <path d="M60 115L70 140L80 115H60Z" fill="#FBBF24"/>
          <path d="M70 140L80 165H60L70 140Z" fill="#FDE047" opacity="0.8"/>
        </g>
        <text x="70" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="36" fontWeight="bold" fill="white" filter="url(#text_shadow)">+{tp}</text>
        <text x="70" y="70" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="white" fillOpacity={0.8}>TP</text>
        <defs>
            <filter id="text_shadow" x="0" y="0" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity={0.5}/>
            </filter>
            <filter id="lightning_shadow" x="40" y="70" width="60" height="105" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="3" stdDeviation="6" floodColor="#FBBF24" floodOpacity={0.7}/>
            </filter>
            <linearGradient id="medium_gradient" x1="70" y1="0" x2="70" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#4A1D96"/>
                <stop offset="1" stopColor="#3C167A"/>
            </linearGradient>
            <pattern id="medium_pattern" patternContentUnits="objectBoundingBox" width="0.1" height="0.1">
                <path d="M-1 1 l2 -2 M0 10 l10 -10 M9 11 l2 -2" stroke="white" strokeWidth="0.5"/>
            </pattern>
        </defs>
      </svg>
    ),
    large: (
        <svg width="140" height="200" viewBox="0 0 140 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="140" height="200" rx="12" fill="url(#large_gradient)"/>
        <rect width="140" height="200" rx="12" fill="url(#large_pattern)" opacity="0.1"/>
        <g filter="url(#lightning_shadow)">
          <path d="M80 70L110 125H50L80 70Z" fill="#F59E0B" transform="translate(-10, 0)"/>
          <path d="M65 125L80 155L95 125H65Z" fill="#FBBF24" transform="translate(-10, 0)"/>
          <path d="M80 155L95 185H65L80 155Z" fill="#FDE047" transform="translate(-10, 0)"/>
        </g>
        <text x="70" y="50" textAnchor="middle" fontFamily="sans-serif" fontSize="36" fontWeight="bold" fill="white" filter="url(#text_shadow)">+{tp}</text>
        <text x="70" y="70" textAnchor="middle" fontFamily="sans-serif" fontSize="14" fill="white" fillOpacity={0.8}>TP</text>
        <defs>
            <filter id="text_shadow" x="0" y="0" width="200%" height="200%">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity={0.5}/>
            </filter>
            <filter id="lightning_shadow" x="30" y="65" width="100" height="130" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#F59E0B" floodOpacity={0.8}/>
            </filter>
            <linearGradient id="large_gradient" x1="70" y1="0" x2="70" y2="200" gradientUnits="userSpaceOnUse">
                <stop stopColor="#9F1239"/>
                <stop offset="1" stopColor="#7F0F2D"/>
            </linearGradient>
            <pattern id="large_pattern" patternContentUnits="objectBoundingBox" width="0.1" height="0.1">
                <path d="M-1 1 l2 -2 M0 10 l10 -10 M9 11 l2 -2" stroke="white" strokeWidth="0.5"/>
            </pattern>
        </defs>
      </svg>
    ),
  };

  return SVGs[sizeClass] || null;
};
