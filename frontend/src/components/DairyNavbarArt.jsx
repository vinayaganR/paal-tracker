import React from 'react';

/**
 * DairyNavbarArt
 * Premium animated dairy-themed navbar background inspired by classic Hatsun / Arokya commercials.
 * Features:
 * - Flowing multi-layer satin green ribbons with smooth curved motion across the background.
 * - Subtle floating pearlescent milk droplets & gentle splash effect on the ribbon path.
 * - 100% pointer-events-none with strict z-0 layering so navigation is never blocked.
 * - Mobile responsive and respects prefers-reduced-motion.
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
              <stop offset="0%" stopColor="#14532d" stopOpacity="0.10" />
              <stop offset="25%" stopColor="#166534" stopOpacity="0.18" />
              <stop offset="55%" stopColor="#15803d" stopOpacity="0.16" />
              <stop offset="85%" stopColor="#22c55e" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.04" />
            </linearGradient>

            {/* Satin Sheen Highlight Gradient */}
            <linearGradient id="dairyRibbonSheen" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#86efac" stopOpacity="0" />
              <stop offset="30%" stopColor="#86efac" stopOpacity="0.40" />
              <stop offset="60%" stopColor="#4ade80" stopOpacity="0.25" />
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
            strokeOpacity="0.20"
            strokeWidth="1.5"
            strokeDasharray="160 40"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 2: Floating Pearlescent Milk Droplets along the Ribbon in open spaces */}
      {/* Droplet 1: Floating in open space between center and right */}
      <div className="absolute left-[48%] top-3 milk-droplet-float1 hidden md:block">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-white via-slate-50 to-emerald-100 shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-emerald-100/50 relative">
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      {/* Droplet 2: Smaller droplet floating toward right controls */}
      <div className="absolute right-[28%] top-6 milk-droplet-float2 hidden lg:block">
        <div className="w-2 h-2 rounded-full bg-white/95 shadow-[0_0_6px_rgba(255,255,255,0.85)] border border-emerald-100/40 relative">
          <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
        </div>
      </div>

      {/* Droplet 3 + Mini Milk Bottle: In far open space */}
      <div className="absolute left-[62%] bottom-2 hidden xl:flex items-end space-x-1 opacity-70">
        <div className="relative w-3 h-5 border border-emerald-300/60 rounded-t-sm rounded-b-md bg-white/40 backdrop-blur-[1px] flex flex-col justify-end p-0.5 shadow-sm">
          <div className="w-full h-3 bg-gradient-to-t from-white via-white/90 to-emerald-50 rounded-b-sm" />
          <div className="absolute top-1 left-0.5 right-0.5 h-px bg-emerald-200/50" />
        </div>
        <div className="milk-droplet-drip -ml-2.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      {/* Layer 3: Subtle satin light sheen sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
