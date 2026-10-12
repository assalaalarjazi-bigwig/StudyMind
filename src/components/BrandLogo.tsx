import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: number;
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = 'w-10 h-10',
  size = 40,
  animated = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl select-none group ${
        animated ? 'transition-all duration-300 hover:scale-105' : ''
      } ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label="StudyMind Emblem"
    >
      {/* Dynamic Multi-Layer Ambient Glow */}
      {animated && (
        <div
          className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 opacity-35 blur-md group-hover:opacity-70 group-hover:blur-lg transition-all duration-500 pointer-events-none"
          aria-hidden="true"
        />
      )}

      {/* Main SVG Vector Emblem */}
      <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/25">
        <svg
          viewBox="0 0 512 512"
          width="100%"
          height="100%"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Deep Cosmic Badge Gradient */}
            <linearGradient id="smBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#0B1120" />
              <stop offset="35%" stopColor="#1E1B4B" />
              <stop offset="70%" stopColor="#1D4ED8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>

            {/* Radiant Core Glow */}
            <radialGradient id="smCoreRadial" cx="50%" cy="45%" r="55%">
              <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#1D4ED8" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0B1120" stopOpacity="0" />
            </radialGradient>

            {/* Specular Rim Gradient */}
            <linearGradient id="smRimLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="40%" stopColor="#93C5FD" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.4" />
            </linearGradient>

            {/* Sculpted Academic Pages Gradient */}
            <linearGradient id="smPageLight" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="65%" stopColor="#E0F2FE" />
              <stop offset="100%" stopColor="#BAE6FD" />
            </linearGradient>

            <linearGradient id="smPageDeep" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
            </linearGradient>

            {/* Golden Star & Mastery Gradient */}
            <linearGradient id="smGoldStar" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFBEB" />
              <stop offset="35%" stopColor="#FDE047" />
              <stop offset="70%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Neural Synapse Gradient */}
            <linearGradient id="smNeuralPulse" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="50%" stopColor="#818CF8" />
              <stop offset="100%" stopColor="#C084FC" />
            </linearGradient>

            {/* Filters */}
            <filter id="smGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="smStarFlare" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Squircle Badge Base */}
          <rect width="512" height="512" rx="120" fill="url(#smBadgeBg)" />
          <rect width="512" height="512" rx="120" fill="url(#smCoreRadial)" />

          {/* Precision Specular Inner Bezel */}
          <rect
            x="12"
            y="12"
            width="488"
            height="488"
            rx="110"
            fill="none"
            stroke="url(#smRimLight)"
            strokeWidth="5"
          />

          {/* Orbital Learning Loops (Spaced Repetition & Cognitive Flow) */}
          <g opacity="0.45" stroke="#38BDF8" strokeWidth="2.5" fill="none">
            <ellipse
              cx="256"
              cy="255"
              rx="185"
              ry="75"
              transform="rotate(-26 256 255)"
              strokeDasharray="8 6"
            />
            <circle cx="106" cy="180" r="4.5" fill="#38BDF8" />
            <circle cx="406" cy="330" r="4.5" fill="#38BDF8" />
          </g>

          {/* Layered Open Book / Academic Knowledge Base */}
          <g transform="translate(0, 16)">
            {/* Under-Page Leaves (Depth / Multiple Chapters) */}
            <path
              d="M256 392 C204 362 136 364 88 382 L96 352 C142 336 206 334 256 362 Z"
              fill="url(#smPageDeep)"
            />
            <path
              d="M256 392 C308 362 376 364 424 382 L416 352 C370 336 306 334 256 362 Z"
              fill="url(#smPageDeep)"
            />

            {/* Left Page (Curved Dimensional Arch) */}
            <path
              d="M256 372 C204 332 128 334 84 352 C78 354 74 348 74 342 L74 212 C74 204 80 198 88 196 C136 182 208 186 256 230 Z"
              fill="url(#smPageLight)"
              filter="drop-shadow(0px 8px 12px rgba(0,0,0,0.35))"
            />

            {/* Left Page Subtle Text Rule Lines (Academic Engraving) */}
            <g stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
              <line x1="112" y1="236" x2="216" y2="242" />
              <line x1="112" y1="266" x2="224" y2="274" />
              <line x1="112" y1="296" x2="204" y2="306" />
            </g>

            {/* Right Page (Curved Dimensional Arch) */}
            <path
              d="M256 372 C308 332 384 334 428 352 C434 354 438 348 438 342 L438 212 C438 204 432 198 424 196 C376 182 304 186 256 230 Z"
              fill="url(#smPageLight)"
              filter="drop-shadow(0px 8px 12px rgba(0,0,0,0.35))"
            />

            {/* Right Page Subtle Text Rule Lines */}
            <g stroke="#93C5FD" strokeWidth="3.5" strokeLinecap="round" opacity="0.6">
              <line x1="400" y1="236" x2="296" y2="242" />
              <line x1="400" y1="266" x2="288" y2="274" />
              <line x1="400" y1="296" x2="308" y2="306" />
            </g>

            {/* Central Book Spine Channel with Luminous Cyan Conduit */}
            <path
              d="M256 378 L256 218"
              stroke="#0284C7"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M256 374 L256 220"
              stroke="#67E8F9"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </g>

          {/* AI Neural Brain Network (The "Mind" Rising from Knowledge) */}
          <g filter="url(#smGlowFilter)">
            {/* Main Brain Synaptic Pathways */}
            <g stroke="url(#smNeuralPulse)" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              {/* Left Hemisphere Circuits */}
              <path d="M256 210 C210 190 170 170 156 126 C144 88 174 54 214 62 C236 66 250 82 256 100" />
              <path d="M204 134 L156 126" />
              <path d="M204 134 L214 62" />
              <path d="M204 134 L256 148" />

              {/* Right Hemisphere Circuits */}
              <path d="M256 210 C302 190 342 170 356 126 C368 88 338 54 298 62 C276 66 262 82 256 100" />
              <path d="M308 134 L356 126" />
              <path d="M308 134 L298 62" />
              <path d="M308 134 L256 148" />

              {/* Central Cognitive Stem */}
              <line x1="256" y1="210" x2="256" y2="148" strokeWidth="7" />
            </g>

            {/* Luminous Synaptic Knowledge Nodes */}
            {/* Core Center Node */}
            <circle cx="256" cy="148" r="9" fill="#FFFFFF" stroke="#38BDF8" strokeWidth="4" />
            <circle cx="256" cy="208" r="7" fill="#67E8F9" />

            {/* Left Hemisphere Synapses */}
            <circle cx="204" cy="134" r="8" fill="#E0E7FF" stroke="#818CF8" strokeWidth="3" />
            <circle cx="156" cy="126" r="7" fill="#38BDF8" />
            <circle cx="214" cy="62" r="7.5" fill="#C084FC" />
            <circle cx="178" cy="80" r="5" fill="#E0F2FE" />

            {/* Right Hemisphere Synapses */}
            <circle cx="308" cy="134" r="8" fill="#E0E7FF" stroke="#818CF8" strokeWidth="3" />
            <circle cx="356" cy="126" r="7" fill="#38BDF8" />
            <circle cx="298" cy="62" r="7.5" fill="#C084FC" />
            <circle cx="334" cy="80" r="5" fill="#E0F2FE" />
          </g>

          {/* Apex Crown: Radiant 8-Pointed Star of Wisdom & Academic Mastery */}
          <g filter="url(#smStarFlare)" transform="translate(256, 46)">
            {/* Outer Diamond Flare */}
            <path
              d="M0 -34 L7 -10 L31 0 L7 10 L0 34 L-7 10 L-31 0 L-7 -10 Z"
              fill="url(#smGoldStar)"
            />
            {/* Diagonal Secondary Spark */}
            <path
              d="M0 -20 L4 -6 L18 0 L4 6 L0 20 L-4 6 L-18 0 L-4 -6 Z"
              fill="#FFFFFF"
              opacity="0.85"
            />
            {/* Core Brilliant Center */}
            <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
          </g>
        </svg>
      </div>
    </div>
  );
};
