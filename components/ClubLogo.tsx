import React from 'react';
import * as Icons from 'lucide-react';
import { ClubLogoData } from '../types';

interface ClubLogoProps {
  logo?: ClubLogoData;
  size?: number;
  className?: string;
}

const ClubLogo: React.FC<ClubLogoProps> = ({ logo, size = 48, className = '' }) => {

  const IconComponent = logo?.icon ? (Icons[logo.icon as keyof typeof Icons] as React.ElementType) : Icons.Shield;

  const renderShape = () => {
    const iconSize = size * 0.6;
    const primaryColor = logo?.primaryColor || '#2563eb'; // blue-600
    const secondaryColor = logo?.secondaryColor || '#ffffff'; // white

    switch (logo?.shape) {
      case 'circle':
        return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
            <circle cx={size/2} cy={size/2} r={size/2} fill={primaryColor} />
            <IconComponent color={secondaryColor} size={iconSize} x={(size - iconSize) / 2} y={(size - iconSize) / 2} />
          </svg>
        );
      case 'square':
         return (
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
            <rect width={size} height={size} fill={primaryColor} />
            <IconComponent color={secondaryColor} size={iconSize} x={(size - iconSize) / 2} y={(size - iconSize) / 2} />
          </svg>
        );
      case 'hexagon':
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
                <path 
                    d="M50 0 L93.3 25 L93.3 75 L50 100 L6.7 75 L6.7 25 Z" 
                    fill={primaryColor} 
                />
                <IconComponent 
                    color={secondaryColor} 
                    size={50} 
                    x={25} 
                    y={25}
                />
            </svg>
        );
      case 'heptagon':
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
                <path 
                    d="M50 0 L87.8 19.1 L97.6 62.2 L72.2 95.1 L27.8 95.1 L2.4 62.2 L12.2 19.1 Z" 
                    fill={primaryColor} 
                />
                <IconComponent 
                    color={secondaryColor} 
                    size={50} 
                    x={25} 
                    y={25}
                />
            </svg>
        );
      case 'shield':
      default:
        return (
            <svg width={size} height={size} viewBox="0 0 100 100" className={className}>
                <path 
                    d="M50 0 C50 0 95 10 95 50 C95 80 50 100 50 100 C50 100 5 80 5 50 C5 10 50 0 50 0 Z" 
                    fill={primaryColor} 
                />
                <IconComponent 
                    color={secondaryColor} 
                    size={50} 
                    x={25} 
                    y={20} // Adjusted for better shield centering
                />
            </svg>
        );
    }
  }

  return renderShape();
};

export default ClubLogo;
