import React from 'react';

/**
 * DairyNavbarArt
 * Flowing animated satin green ribbon background across the entire navbar.
 * Inspired by classic Hatsun / Arokya dairy commercials.
 * Features:
 * - Multi-layer satin curved wave with rich forest and dairy green gradients.
 * - Glossy lime/emerald satin highlight wave that flows continuously.
 * - 100% pointer-events-none and z-0 behind all navbar controls.
 * - Respects prefers-reduced-motion.
 */
export default function DairyNavbarArt() {
  return (
    <div 
      className="dairy-navbar-art absolute inset-0 pointer-events-none select-none overflow-hidden z-0" 
      aria-hidden="true"
    >
      {/* Layer 1: Elegant Green Satin Ribbon Wave Background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden opacity-90">
        <svg
          className="ribbon-svg absolute left-0 bottom-0 w-[140%] sm:w-[120%] lg:w-full h-full"
          viewBox="0 0 1440 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            {/* Rich Dairy Forest Gradient */}
            <linearGradient id="dairyRibbonGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#14532d" stopOpacity="0.12" />
              <stop offset="25%" stopColor="#166534" stopOpacity="0.20" />
              <stop offset="55%" stopColor="#15803d" stopOpacity="0.16" />
              <stop offset="85%" stopColor="#22c55e" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>

            {/* Satin Sheen Highlight Gradient */}
            <linearGradient id="dairyRibbonSheen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0" />
              <stop offset="30%" stopColor="#86efac" stopOpacity="0.45" />
              <stop offset="60%" stopColor="#4ade80" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
            </linearGradient>

            {/* Deep Under-Curve Shadow for depth */}
            <linearGradient id="dairyRibbonDepth" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#052e16" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#15803d" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Deep Underlying Ribbon Curve */}
          <path
            className="ribbon-flow-slow"
            d="M-20 80 C 180 85, 240 38, 480 44 C 720 50, 880 20, 1140 35 C 1320 46, 1420 28, 1480 32 L 1480 80 Z"
            fill="url(#dairyRibbonGrad1)"
          />

          {/* Satin Highlight Ribbon with Wave Motion */}
          <path
            className="ribbon-flow-fast"
            d="M-40 68 C 160 72, 280 24, 520 30 C 760 36, 920 12, 1180 26 C 1360 36, 1440 22, 1480 25"
            stroke="url(#dairyRibbonSheen)"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />

          {/* Subtle Secondary Satin Accent Line */}
          <path
            className="ribbon-flow-slow"
            d="M-20 74 C 200 78, 320 32, 560 38 C 800 44, 960 22, 1220 34 C 1380 42, 1460 30, 1480 32"
            stroke="#86efac"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeDasharray="160 40"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 2: Subtle satin light sheen sweep across entire navbar */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
