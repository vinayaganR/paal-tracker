import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Smartphone, Download, X } from 'lucide-react';

export default function InstallAppBanner() {
  const { lang } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Check if already in standalone app mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) {
      return; // Already running as installed app!
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('paal_vandi_pwa_dismissed');
    if (dismissedAt && Date.now() - Number(dismissedAt) < 24 * 60 * 60 * 1000) {
      // Don't disturb user for 24 hours if dismissed
      return;
    }

    // iOS detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    if (isIosDevice) {
      // On iOS, show banner after 2 seconds
      const timer = setTimeout(() => setShowBanner(true), 2000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: capture beforeinstallprompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem('paal_vandi_pwa_dismissed', String(Date.now()));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Floating Bottom App Install Bar */}
      <div className="fixed bottom-20 sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-3.5 sm:p-4 rounded-3xl shadow-2xl border border-emerald-500/30 ring-4 ring-emerald-500/10 flex items-center justify-between gap-3 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 p-1 flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/50">
            <img src="/cow-transparent.png" alt="PaalVandi" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm text-white">PaalVandi App</span>
              <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                Alpha
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {lang === 'ta' ? 'மொபைலில் ஆப்பாக இன்ஸ்டால் செய்ய' : 'Install as a mobile app'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 flex-shrink-0">
          <button
            onClick={handleInstallClick}
            className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:from-emerald-400 hover:to-green-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/30 active:scale-95 transition"
            title="Install App"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'இன்ஸ்டால்' : 'Install'}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base">iPhone / iPad Install</h3>
              <button onClick={() => setShowIOSGuide(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <ol className="text-xs space-y-2 text-slate-700 font-semibold list-decimal list-inside">
              <li>Tap the <strong>Share button</strong> (square with up arrow ⎋) at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong> (முகப்புத் திரையில் சேர்).</li>
              <li>Tap <strong>"Add"</strong> in the top right corner.</li>
            </ol>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs shadow-md"
            >
              OK, Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
