import React from 'react';

interface LogoProps {
  className?: string;
}

const SiteForgeLogo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <a
      href="/"
      className={`flex items-center gap-3 h-16 justify-center ${className}`}
      aria-label="SiteForge AI home"
    >
      {/* Icon: complex geometric neural network cube */}
      <svg
        className="h-10 w-10"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="siteForgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#3B82F6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Cube frame */}
        <path
          d="M16 20 L32 12 L48 20 L48 44 L32 52 L16 44 Z"
          stroke="url(#siteForgeGradient)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
        />
        <path
          d="M16 20 L16 44 M32 12 L32 52 M48 20 L48 44"
          stroke="url(#siteForgeGradient)"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* Internal neural links */}
        <line x1="16" y1="20" x2="32" y2="32" stroke="url(#siteForgeGradient)" strokeWidth="1.2" />
        <line x1="32" y1="32" x2="48" y2="20" stroke="url(#siteForgeGradient)" strokeWidth="1.2" />
        <line x1="16" y1="44" x2="32" y2="32" stroke="url(#siteForgeGradient)" strokeWidth="1.2" />
        <line x1="48" y1="44" x2="32" y2="32" stroke="url(#siteForgeGradient)" strokeWidth="1.2" />

        {/* Node points */}
        {[
          [16, 20],
          [32, 12],
          [48, 20],
          [16, 44],
          [32, 52],
          [48, 44],
          [32, 32],
        ].map(([cx, cy], index) => (
          <circle
            key={index}
            cx={cx}
            cy={cy}
            r="2.2"
            fill="url(#siteForgeGradient)"
            stroke="#ffffff"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Text */}
      <div className="flex items-center gap-2">
        <span
          className="text-3xl font-extrabold tracking-tighter font-[Inter,Helvetica,Arial,sans-serif]"
          style={{
            background: 'linear-gradient(90deg, #A855F7 0%, #3B82F6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          SiteForge
        </span>

        <span className="px-2 py-0.5 text-xs uppercase font-semibold rounded-full border border-purple-400/30 text-purple-100 bg-purple-500/10 shadow-[0_0_12px_rgba(168,85,247,0.35)]">
          AI
        </span>
      </div>
    </a>
  );
};

export default SiteForgeLogo;