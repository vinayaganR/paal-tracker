import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check, 
  Sparkles,
  HelpCircle
} from 'lucide-react';

export default function InteractiveTour({ 
  steps = [], 
  isOpen, 
  onClose, 
  onComplete,
  tourKey = 'default' 
}) {
  const { t } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const step = steps[currentStepIndex];

  // Recalculate target element position
  const updatePosition = () => {
    if (!step || !step.targetId) {
      setTargetRect(null);
      return;
    }
    const el = document.getElementById(step.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
        bottom: rect.bottom,
        right: rect.right,
      });

      // Scroll into view if needed
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setTargetRect(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const timer = setTimeout(updatePosition, 300);
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [isOpen, currentStepIndex, step]);

  if (!isOpen || !step) return null;

  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      if (onComplete) onComplete();
      onClose();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Determine tooltip placement: top or bottom
  const placeAbove = targetRect && targetRect.bottom > window.innerHeight - 280;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      
      {/* Dark backdrop with spotlight hole */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers everything */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black hole cuts out target element */}
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(15, 23, 42, 0.78)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Pulsing ring around spotlight */}
      {targetRect && (
        <div
          className="absolute border-2 border-amber-400 rounded-2xl pointer-events-none transition-all duration-300 shadow-[0_0_25px_rgba(251,191,36,0.8)] animate-pulse"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Floating Tour Guidance Card */}
      <div 
        className="fixed z-50 left-1/2 -translate-x-1/2 w-[92%] max-w-sm transition-all duration-300"
        style={{
          top: targetRect 
            ? placeAbove 
              ? Math.max(16, targetRect.top - 240)
              : Math.min(window.innerHeight - 240, targetRect.bottom + 20)
            : '50%',
          transform: !targetRect ? 'translate(-50%, -50%)' : undefined
        }}
      >
        <div className="bg-white rounded-3xl p-5 shadow-2xl border-2 border-amber-400 space-y-3 relative text-slate-900 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header row: Progress & Close */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
              <Sparkles className="w-3 h-3 mr-1 text-amber-700" />
              {t('tourStepOf')} {currentStepIndex + 1} / {steps.length}
            </span>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              title={t('tourSkip')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Step Title & Content */}
          <div className="space-y-1.5">
            <h3 className="font-black text-base text-slate-900 flex items-center">
              {step.title}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {step.content}
            </p>
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isFirst}
              className={`flex items-center space-x-1 text-xs font-bold px-3 py-2 rounded-xl transition ${
                isFirst 
                  ? 'text-slate-300 cursor-not-allowed' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('tourPrev')}</span>
            </button>

            {/* Step Indicators (Dots) */}
            <div className="flex items-center space-x-1">
              {steps.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStepIndex 
                      ? 'w-5 bg-amber-500' 
                      : 'w-1.5 bg-slate-200'
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="flex items-center space-x-1.5 text-xs font-black px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md shadow-emerald-200 transition active:scale-95"
            >
              <span>{isLast ? t('tourFinish') : t('tourNext')}</span>
              {isLast ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}
