import React from 'react';
import logo from '@/assets/logo.svg';

interface LogoProps {
  className?: string;
}

const SiteForgeLogo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <a
      href="/"
      className={`flex items-center ${className}`}
      aria-label="SiteForge AI home"
    >
      <img
        src={logo}
        alt="SiteForge"
        style={{ height: '48px', width: 'auto', display: 'block' }}
      />
    </a>
  );
};

export default SiteForgeLogo;