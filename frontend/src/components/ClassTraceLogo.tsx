'use client';

import React from 'react';

interface ClassTraceLogoProps {
  variant?: 'full' | 'mark' | 'compact';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  sparkColor?: string;
}

export const ClassTraceLogo: React.FC<ClassTraceLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  sparkColor = '#FFFFFF',
}) => {
  const sizeMap = {
    xs: { mark: 22, text: 'text-sm', badge: 'text-[9px]' },
    sm: { mark: 28, text: 'text-base', badge: 'text-[10px]' },
    md: { mark: 36, text: 'text-lg', badge: 'text-[11px]' },
    lg: { mark: 48, text: 'text-2xl', badge: 'text-xs' },
    xl: { mark: 64, text: 'text-4xl', badge: 'text-sm' },
  };

  const { mark: markSize, text: textSize, badge: badgeSize } = sizeMap[size];

  // The Iconic ClassTrace Mark:
  // Concentric acoustic wave arcs that track into an ultra-sharp diamond focal needle,
  // symbolizing sound being indexed and traced directly to the exact millisecond moment.
  const MarkIcon = (
    <div
      style={{ width: markSize, height: markSize }}
      className="relative shrink-0 flex items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.16] shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_8px_20px_-4px_rgba(0,0,0,0.5)] backdrop-blur-xl group-hover:border-white/40 group-hover:bg-white/[0.1] transition-all duration-300"
    >
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-[72%] h-[72%] transition-transform duration-300 group-hover:scale-105"
      >
        <defs>
          {/* Crystal caustics linear gradient */}
          <linearGradient id="ct-beam-grad" x1="4" y1="4" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#E2E8F0" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.4" />
          </linearGradient>

          {/* Liquid glass specular sheen */}
          <linearGradient id="ct-sheen" x1="18" y1="2" x2="18" y2="34" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
          </linearGradient>

          <radialGradient id="ct-center-glow" cx="18" cy="18" r="9" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="60%" stopColor="#E2E8F0" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Center Glow */}
        <circle cx="18" cy="18" r="8" fill="url(#ct-center-glow)" />

        {/* Outer Acoustic Pulse Arc (The "Class" sonic envelope) */}
        <path
          d="M 12 7 C 6 10 3 17 4 23 C 5 29 10 33 16 33.5"
          stroke="url(#ct-beam-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />

        {/* Outer Right Echo Wave */}
        <path
          d="M 24 7 C 30 10 33 17 32 23 C 31 29 26 33 20 33.5"
          stroke="url(#ct-beam-grad)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeOpacity="0.65"
        />

        {/* Inner Acoustic Compression Ring */}
        <path
          d="M 14 12 C 10 14 9 19 11 23 C 12 25 14 26.5 17 27"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M 22 12 C 26 14 27 19 25 23 C 24 25 22 26.5 19 27"
          stroke="#FFFFFF"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Precision Vertical Trace Needle (The "T" axis) */}
        <line
          x1="18"
          y1="5"
          x2="18"
          y2="31"
          stroke="url(#ct-sheen)"
          strokeWidth="2.2"
          strokeLinecap="round"
        />

        {/* Horizontal Reticle Crossbar */}
        <line
          x1="9"
          y1="18"
          x2="27"
          y2="18"
          stroke="url(#ct-sheen)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.5"
        />

        {/* The Exact Moment Focal Target — A 4-Point Diamond Spark */}
        <path
          d="M 18 13.5 L 19.3 16.7 L 22.5 18 L 19.3 19.3 L 18 22.5 L 16.7 19.3 L 13.5 18 L 16.7 16.7 Z"
          fill="#FFFFFF"
          className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
        />

        {/* Tiny Precision Core Point */}
        <circle cx="18" cy="18" r="1.3" fill="#030407" />
      </svg>
    </div>
  );

  if (variant === 'mark') {
    return <div className={`inline-flex items-center ${className}`}>{MarkIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 select-none group ${className}`}>
      {MarkIcon}

      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-display font-extrabold tracking-tight text-white ${textSize}`}>
            Class<span className="text-white/80 font-normal">Trace</span>
          </span>

          {variant === 'full' && (
            <span
              className={`font-mono uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.12] text-white/70 ml-1 ${badgeSize}`}
            >
              AI
            </span>
          )}
        </div>

        {variant === 'full' && size !== 'xs' && (
          <span className="text-[10px] font-mono tracking-tight text-white/40 mt-0.5 hidden sm:block">
            Voice-First Lecture Intelligence
          </span>
        )}
      </div>
    </div>
  );
};

export default ClassTraceLogo;

