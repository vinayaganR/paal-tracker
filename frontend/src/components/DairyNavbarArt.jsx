import React from 'react';
import cowImg from '../assets/cow-transparent.png';

/**
 * DairyNavbarArt
 * Premium animated dairy-themed navbar background inspired by classic Hatsun / Arokya commercials.
 * Features:
 * - Flowing multi-layer satin green ribbons with smooth curved motion.
 * - Realistic Holstein Friesian cow on fresh green grass mound.
 * - Swaying SVG grass blades beneath the cow.
 * - Subtle floating pearlescent milk droplets & gentle splash effect.
 * - 100% pointer-events-none with strict z-index layering so navigation is never blocked.
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
              <stop offset="0%" stopColor="#14532d" stopOpacity="0.12" />
              <stop offset="25%" stopColor="#166534" stopOpacity="0.22" />
              <stop offset="55%" stopColor="#15803d" stopOpacity="0.18" />
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
              <stop offset="0%" stopColor="#052e16" stopOpacity="0.15" />
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

      {/* Layer 2: Decorative Holstein Cow & Grass Patch */}
      {/* Positioned beside the brand info (left side, right next to the title area) */}
      <div className="absolute left-[185px] sm:left-[240px] md:left-[275px] bottom-1 sm:bottom-1.5 flex items-end cow-entrance-anim">
        {/* Grass Mound & Swaying Blades underneath */}
        <div className="relative flex items-end">
          
          {/* Green Grass Mound Base */}
          <div className="absolute -bottom-1 -left-3 -right-3 h-3 bg-gradient-to-t from-emerald-600/40 via-green-500/25 to-transparent rounded-full blur-[2px]" />

          {/* SVG Animated Swaying Grass Blades */}
          <svg 
            className="absolute -bottom-0.5 -left-2 w-14 h-4 text-emerald-600/70 overflow-visible"
            viewBox="0 0 56 16" 
            fill="none"
          >
            {/* Blade 1 (sways left-right) */}
            <path 
              className="grass-blade-1"
              d="M4 16 C 5 11, 2 6, 1 2 C 4 6, 6 11, 7 16 Z" 
              fill="#15803d" 
            />
            {/* Blade 2 */}
            <path 
              className="grass-blade-2"
              d="M10 16 C 11 9, 14 4, 16 1 C 15 6, 13 11, 12 16 Z" 
              fill="#22c55e" 
            />
            {/* Blade 3 */}
            <path 
              className="grass-blade-1"
              d="M20 16 C 19 10, 17 6, 15 3 C 19 7, 21 11, 22 16 Z" 
              fill="#166534" 
            />
            {/* Blade 4 */}
            <path 
              className="grass-blade-3"
              d="M32 16 C 33 11, 36 6, 38 2 C 36 7, 34 11, 33 16 Z" 
              fill="#15803d" 
            />
            {/* Blade 5 */}
            <path 
              className="grass-blade-2"
              d="M44 16 C 43 10, 40 5, 39 3 C 42 7, 44 11, 45 16 Z" 
              fill="#22c55e" 
            />
          </svg>

          {/* The Authentic Black-and-White Holstein Cow */}
          <div className="relative group">
            <img
              src={cowImg}
              alt="Dairy Cow"
              className="h-10 sm:h-12 md:h-14 w-auto object-contain drop-shadow-sm filter contrast-[1.02] brightness-[1.01]"
              loading="eager"
            />
          </div>

          {/* Right Grass Tufts */}
          <svg 
            className="absolute -bottom-0.5 -right-3 w-10 h-3.5 text-emerald-500/70 overflow-visible"
            viewBox="0 0 40 14" 
            fill="none"
          >
            <path 
              className="grass-blade-2"
              d="M4 14 C 5 9, 8 4, 11 1 C 9 6, 7 10, 6 14 Z" 
              fill="#22c55e" 
            />
            <path 
              className="grass-blade-1"
              d="M16 14 C 15 8, 12 5, 9 2 C 14 5, 16 9, 18 14 Z" 
              fill="#166534" 
            />
          </svg>
        </div>
      </div>

      {/* Layer 3: Floating Pearlescent Milk Droplets & Gentle Splash */}
      {/* Droplet 1: Floating gently above the ribbon near center */}
      <div className="absolute left-[330px] sm:left-[390px] top-3.5 sm:top-4 milk-droplet-float1 hidden md:block">
        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-br from-white via-slate-50 to-emerald-100 shadow-[0_0_8px_rgba(255,255,255,0.9)] border border-emerald-100/50 relative">
          {/* Specular White Highlight */}
          <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full" />
        </div>
      </div>

      {/* Droplet 2: Smaller droplet floating toward the right */}
      <div className="absolute left-[440px] sm:left-[510px] top-6 sm:top-7 milk-droplet-float2 hidden lg:block">
        <div className="w-2 h-2 rounded-full bg-white/95 shadow-[0_0_6px_rgba(255,255,255,0.85)] border border-emerald-100/40 relative">
          <div className="absolute top-0.5 left-0.5 w-0.5 h-0.5 bg-white rounded-full" />
        </div>
      </div>

      {/* Droplet 3 + Mini Milk Bottle Splash: Near cow's right side */}
      <div className="absolute left-[360px] sm:left-[430px] bottom-2 hidden xl:flex items-end space-x-1 opacity-80">
        {/* Tiny Classic Glass Milk Bottle */}
        <div className="relative w-3 h-5 border border-emerald-300/60 rounded-t-sm rounded-b-md bg-white/40 backdrop-blur-[1px] flex flex-col justify-end p-0.5 shadow-sm">
          {/* Milk level */}
          <div className="w-full h-3 bg-gradient-to-t from-white via-white/90 to-emerald-50 rounded-b-sm" />
          {/* Bottle neck line */}
          <div className="absolute top-1 left-0.5 right-0.5 h-px bg-emerald-200/50" />
        </div>

        {/* Falling Milk Droplet with subtle ripple */}
        <div className="milk-droplet-drip -ml-2.5 mb-1">
          <div className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_5px_rgba(255,255,255,0.9)]" />
        </div>
      </div>

      {/* Layer 4: Subtle satin light sheen sweep */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
