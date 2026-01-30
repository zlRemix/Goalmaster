import React from 'react';

interface InfrastructureIconProps {
  seed: string; // This will be the InfrastructureType enum
}

const InfrastructureIcon: React.FC<InfrastructureIconProps> = ({ seed }) => {
  const size = 50;

  const getColors = () => {
      switch(seed) {
          case 'stadium': return { primary: '#4A90E2', secondary: '#3B73B5' };
          case 'training_ground': return { primary: '#F5A623', secondary: '#C4851C' };
          case 'medical_center': return { primary: '#50E3C2', secondary: '#40B59B' };
          case 'marketing_department': return { primary: '#9013FE', secondary: '#730FAE' };
          default: return { primary: '#555', secondary: '#333' };
      }
  }

  const { primary: primaryColor, secondary: secondaryColor } = getColors();


  const renderIcon = () => {
    switch (seed) {
      case 'stadium':
        return (
          <svg width={size} height={size} viewBox="0 0 50 50">
            <rect width="50" height="50" rx="8" fill={primaryColor} />
            <path d="M5 45 V 20 L 25 10 L 45 20 V 45 H 5 Z M 15 45 V 25 M 25 45 V 20 M 35 45 V 25" stroke={secondaryColor} strokeWidth="3" fill="none" />
             <path d="M10 20 A 15 8 0 0 0 40 20"  stroke="white" strokeWidth="2" fill="none" />
          </svg>
        );
      case 'training_ground':
        return (
          <svg width={size} height={size} viewBox="0 0 50 50">
            <rect width="50" height="50" rx="8" fill={primaryColor} />
            <rect x="10" y="30" width="30" height="10" fill={secondaryColor} />
            <path d="M15 30 L 25 20 L 35 30" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="25" cy="15" r="4" fill="white" />
          </svg>
        );
      case 'medical_center':
        return (
          <svg width={size} height={size} viewBox="0 0 50 50">
            <rect width="50" height="50" rx="8" fill={primaryColor} />
            <path d="M25 12 V 38 M 12 25 H 38" stroke="white" strokeWidth="6" strokeLinecap="round" />
          </svg>
        );
      case 'marketing_department':
        return (
          <svg width={size} height={size} viewBox="0 0 50 50">
            <rect width="50" height="50" rx="8" fill={primaryColor} />
            <path d="M10 40 L 20 20 L 30 30 L 40 10" stroke="white" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      default:
        return (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <rect width={size} height={size} fill="#555" rx="8"/>
                <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="12">?</text>
            </svg>
        );
    }
  };

  return (
    <div className="rounded-lg overflow-hidden shadow-md">
      {renderIcon()}
    </div>
  );
};

export default InfrastructureIcon;
