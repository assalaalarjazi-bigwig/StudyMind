import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-10 h-10', size = 40 }) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 rounded-xl overflow-hidden shadow-sm ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 512 512"
        width="100%"
        height="100%"
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="brandBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e1b4b" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="brandGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>

        {/* Squircle Background */}
        <rect width="512" height="512" rx="128" fill="url(#brandBgGrad)" />
        <rect x="14" y="14" width="484" height="484" rx="114" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="6" />

        {/* Emblem */}
        <g transform="translate(0, 8)">
          {/* Left Page */}
          <path
            d="M256 360 C210 320 140 320 100 334 C94 336 90 342 90 348 L90 200 C90 192 96 186 104 184 C146 172 210 176 256 216 Z"
            fill="#ffffff"
            fillOpacity="0.95"
          />
          {/* Right Page */}
          <path
            d="M256 360 C302 320 372 320 412 334 C418 336 422 342 422 348 L422 200 C422 192 416 186 408 184 C366 172 302 176 256 216 Z"
            fill="#ffffff"
            fillOpacity="0.95"
          />

          {/* Spine & Neural Lines */}
          <line x1="256" y1="365" x2="256" y2="185" stroke="#38bdf8" strokeWidth="8" strokeLinecap="round" />
          <circle cx="256" cy="180" r="14" fill="#38bdf8" />
          <circle cx="190" cy="130" r="11" fill="#a5b4fc" />
          <circle cx="322" cy="130" r="11" fill="#a5b4fc" />
          <line x1="256" y1="180" x2="190" y2="130" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />
          <line x1="256" y1="180" x2="322" y2="130" stroke="#38bdf8" strokeWidth="6" strokeLinecap="round" />

          {/* Star Spark of Knowledge */}
          <path d="M256 65 L263 82 L280 89 L263 96 L256 113 L249 96 L232 89 L249 82 Z" fill="url(#brandGoldGrad)" />
          <circle cx="256" cy="89" r="4" fill="#ffffff" />
        </g>
      </svg>
    </div>
  );
};
