import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth, ROLES } from '../contexts/AuthContext';
import { 
  Sun, 
  Moon, 
  Calendar, 
  UserCheck, 
  ShieldCheck, 
  Languages, 
  Milk,
  Smartphone,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ selectedDate, setSelectedDate, selectedShift, setSelectedShift, activeTab, setActiveTab }) {
  const { t, lang, toggleLanguage } = useLanguage();
  const { currentRole, setCurrentRole, activeCustomerId, setActiveCustomerId, dairyInfo } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('runner')}>
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

          {/* Center: Shift & Date Selector (for Admin & Runner) */}
          {currentRole !== ROLES.CUSTOMER && (
            <div className="flex items-center bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 shadow-inner">
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

          {/* Right Controls: Role Switch & Language Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            
            {/* Language Switch Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-sm"
              title="Change Language"
            >
              <Languages className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'ta' ? 'தமிழ்' : 'EN'}</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <select
                value={currentRole}
                onChange={(e) => {
                  const role = e.target.value;
                  setCurrentRole(role);
                  if (role === ROLES.CUSTOMER) {
                    setActiveTab('customer_portal');
                  } else {
                    setActiveTab('runner');
                  }
                }}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border appearance-none pr-7 cursor-pointer transition shadow-sm ${
                  currentRole === ROLES.ADMIN
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : 'bg-blue-50 border-blue-300 text-blue-900'
                }`}
              >
                <option value={ROLES.ADMIN}>👨‍🌾 {t('adminMode')}</option>
                <option value={ROLES.CUSTOMER}>🏡 {t('customerMode')}</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>

          </div>
        </div>
      </div>
    </header>
  );
}
