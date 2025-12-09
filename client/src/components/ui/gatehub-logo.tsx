import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const GateHubLogo: React.FC<LogoProps> = ({ 
  className = "", 
  width = 120, 
  height = 44 
}) => {
  return (
    <img 
      src="/images/gatehub-logo.png" 
      alt="GateHub Logo"
      width={width} 
      height={height}
      className={className}
    />
  );
};

export default GateHubLogo;
