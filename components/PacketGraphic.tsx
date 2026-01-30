import React from 'react';

interface PacketGraphicProps {
  sizeClass: 'small' | 'medium' | 'large';
  tp: number;
}

export const PacketGraphic: React.FC<PacketGraphicProps> = ({ sizeClass, tp }) => {
  const themes = {
    small: { 
      base: '#1E293B', 
      accent: '#38BDF8', 
      textShadow: 'rgba(56, 189, 248, 0.5)',
      label: 'POINTS' 
    },
    medium: { 
      base: '#4C1D95', 
      accent: '#C084FC', 
      textShadow: 'rgba(192, 132, 252, 0.5)',
      label: 'PRO PACK' 
    },
    large: { 
      base: '#881337', 
      accent: '#FB7185', 
      textShadow: 'rgba(251, 113, 133, 0.5)',
      label: 'ELITE PACK' 
    },
  };

  const theme = themes[sizeClass];

  const renderContent = (scale: number, fontSize: number) => (
    <>
      <defs>
        {/* Kristall-Verlauf (Edler als der Blitz-Gelbton) */}
        <linearGradient id={`crystal_grad_${sizeClass}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor={theme.accent} />
          <stop offset="100%" stopColor={theme.base} />
        </linearGradient>
        
        {/* Glow Effekt */}
        <filter id={`glow_${sizeClass}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        <filter id={`text_glow_${sizeClass}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={theme.textShadow} />
        </filter>
      </defs>

      {/* Hintergrund & Rahmen */}
      <rect width="140" height="200" rx="24" fill={theme.base} />
      <rect width="136" height="196" x="2" y="2" rx="22" stroke="white" strokeOpacity="0.15" strokeWidth="1.5" />

      {/* Textelemente */}
      <g filter={`url(#text_glow_${sizeClass})`}>
        <text 
          x="70" 
          y="60" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize={fontSize} 
          fontWeight="900" 
          fill="white"
        >
          {tp}
        </text>
        <text 
          x="70" 
          y="82" 
          textAnchor="middle" 
          fontFamily="system-ui, -apple-system, sans-serif" 
          fontSize="10" 
          fontWeight="800" 
          fill={theme.accent} 
          style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}
        >
          {theme.label}
        </text>
      </g>

      {/* Kristall Icon (Statt Blitz) */}
      <g transform={`translate(${70 - 70 * scale}, ${135 - 135 * scale}) scale(${scale})`}>
        {/* Äußerer Kristallkörper */}
        <path
          d="M70 100L100 125L70 175L40 125L70 100Z"
          fill={`url(#crystal_grad_${sizeClass})`}
          filter={`url(#glow_${sizeClass})`}
        />
        {/* Lichtkante für mehr Tiefe */}
        <path
          d="M70 100V175L100 125L70 100Z"
          fill="white"
          fillOpacity="0.3"
        />
        {/* Innere Facette */}
        <path
          d="M70 115L85 125L70 155L55 125L70 115Z"
          fill="white"
          fillOpacity="0.5"
        />
      </g>
    </>
  );

  return (
    <svg 
      width="140" 
      height="200" 
      viewBox="0 0 140 200" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.3))' }}
    >
      {sizeClass === 'small' && renderContent(0.8, 30)}
      {sizeClass === 'medium' && renderContent(1, 34)}
      {sizeClass === 'large' && (
        <>
          {/* Zusätzlicher Aura-Glow für Elite */}
          <circle cx="70" cy="135" r="40" fill={theme.accent} fillOpacity="0.25" filter="blur(25px)" />
          {renderContent(1.2, 40)}
        </>
      )}
    </svg>
  );
};