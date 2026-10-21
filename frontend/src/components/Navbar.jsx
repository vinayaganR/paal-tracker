import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sun, 
  Moon, 
  Languages, 
  LogOut, 
  Settings,
  HelpCircle
} from 'lucide-react';

export default function Navbar({ 
  selectedDate, 
  setSelectedDate, 
  selectedShift, 
  setSelectedShift, 
  onOpenSettings,
  onOpenTour
}) {
  const { t, lang, toggleLanguage } = useLanguage();
  const { currentUser, isAdmin, isCustomer, activeCustomer, logout, dairyInfo } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-200">
              <span className="text-2xl">🥛</span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="font-extrabold text-lg sm:text-xl text-slate-900 tracking-tight flex items-center">
                  {t('appName')}
                  <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                    Live
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-500 font-medium hidden sm:block">
                {dairyInfo.farmName}
              </p>
            </div>
          </div>

          {/* Center: Shift & Date Selector (ONLY for Admin / Appa) */}
          {isAdmin && (
            <div 
              id="tour-shift-selector"
              className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner"
            >
              <button
                onClick={() => setSelectedShift('MORNING')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedShift === 'MORNING'
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-900" />
                <span>{t('morning')}</span>
              </button>

              <button
                onClick={() => setSelectedShift('EVENING')}
                className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  selectedShift === 'EVENING'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{t('evening')}</span>
              </button>

              <div className="h-4 w-px bg-slate-300 mx-1 hidden md:block"></div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="hidden md:inline-block bg-transparent text-xs font-medium text-slate-700 px-2 py-1 outline-none cursor-pointer"
              />
            </div>
          )}

          {/* Right Controls: Tour Help, Language, User Badge & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            
            {/* Visual Guide Tour Trigger Button */}
            {onOpenTour && (
              <button
                id="tour-help-btn"
                onClick={onOpenTour}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-extrabold transition shadow-sm"
                title={t('tourHelpBtn')}
              >
                <span className="text-sm">💡</span>
                <span className="hidden md:inline">{t('tourHelpBtn')}</span>
              </button>
            )}

            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'EN' : 'தமிழ்'}</span>
            </button>

            {/* Current Logged In Badge */}
            <div className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
              isAdmin 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <span>{isAdmin ? '👨‍🌾' : '🏡'}</span>
              <span className="max-w-[120px] truncate">
                {isAdmin ? dairyInfo.ownerName : activeCustomer?.name}
              </span>
            </div>

            {/* Dairy Settings button for Appa */}
            {isAdmin && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition"
                title={t('settings')}
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={logout}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition border border-slate-200"
              title={t('logout')}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logout')}</span>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
}
