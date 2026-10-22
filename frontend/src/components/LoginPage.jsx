import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dairyService } from '../services/dairyService';
import { 
  Lock, 
  Phone, 
  UserCheck, 
  ShieldCheck, 
  Home, 
  Languages, 
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

export default function LoginPage() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { loginAsOwner, loginAsCustomer, dairyInfo } = useAuth();

  const [activeTab, setActiveTab] = useState('OWNER'); // 'OWNER' | 'CUSTOMER'
  const [pin, setPin] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const registeredCustomers = dairyService.getCustomers();

  const handleOwnerSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginAsOwner(pin);
    if (!res.success) {
      setErrorMsg(t('invalidPin'));
    }
  };

  const handleCustomerSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = loginAsCustomer(phone);
    if (!res.success) {
      setErrorMsg(t('customerNotFound'));
    }
  };

  const handleQuickCustomerLogin = (cust) => {
    loginAsCustomer(cust.id);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100">
      
      {/* Top Header with Language Toggle */}
      <div className="max-w-xl w-full mx-auto flex items-center justify-between pt-2 pb-6">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center overflow-hidden">
            {dairyInfo?.logoUrl ? (
              <img 
                src={dairyInfo.logoUrl} 
                alt="Logo" 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="text-2xl">{dairyInfo?.logoEmoji || '🥛'}</span>
            )}
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight text-white">
              {dairyInfo?.appName || t('appName')}
            </h1>
            <p className="text-[11px] text-emerald-300 font-medium">
              {dairyInfo?.farmName || 'dheena dhinesh farming'}
            </p>
          </div>
        </div>

        <button
          onClick={toggleLanguage}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-white/20 text-xs font-bold bg-white/10 hover:bg-white/20 transition shadow-sm text-white"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'ta' ? 'English' : 'தமிழ்'}</span>
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
        
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {t('loginTitle')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Role Selector Tabs (Appa vs Customer) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('OWNER');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'OWNER'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('iAmOwner')}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('CUSTOMER');
              setErrorMsg('');
            }}
            className={`flex items-center justify-center space-x-1.5 py-3 rounded-xl text-xs font-black transition-all ${
              activeTab === 'CUSTOMER'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>{t('iAmCustomer')}</span>
          </button>
        </div>

        {/* Error notification */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-200">
            ⚠️ {errorMsg}
          </div>
        )}

        {/* Tab 1: Owner / Appa Login */}
        {activeTab === 'OWNER' && (
          <form onSubmit={handleOwnerSubmit} className="space-y-4">
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
              <span className="font-bold block">👨‍🌾 பண்ணையாளர் கட்டுப்பாட்டு தளம்:</span>
              <span className="text-[11px] text-emerald-800">
                5:00 AM ரூட் டெலிவரி, வாடிக்கையாளர்கள், மாதாந்திர பில், கரவை இருப்பு கணக்கு.
              </span>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('ownerPinLabel')}
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={6}
                  placeholder={t('enterPin')}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition active:scale-98 flex items-center justify-center space-x-1.5"
            >
              <span>{t('loginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Demo Login Button */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => loginAsOwner('1234')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('quickDemoLogin')} (PIN: 1234)</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Customer Login */}
        {activeTab === 'CUSTOMER' && (
          <div className="space-y-4">
            <div className="bg-blue-50/70 p-3 rounded-2xl border border-blue-100 text-xs text-blue-900">
              <span className="font-bold block">🏡 வாடிக்கையாளர் சுய-சேவை தளம்:</span>
              <span className="text-[11px] text-blue-800">
                இன்றைய பால் வந்த நேரம், மாதாந்திர பாஸ்புக், ஊருக்கு போனால் லீவு பதிவு, UPI பில் கட்டணம்.
              </span>
            </div>

            <form onSubmit={handleCustomerSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('customerPhoneLabel')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder={t('enterPhone')}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-200 transition active:scale-98 flex items-center justify-center space-x-1.5"
              >
                <span>{t('loginBtn')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Direct Quick Pick Customer for Demo */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                {t('orPickCustomer')}
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {registeredCustomers.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleQuickCustomerLogin(c)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 transition flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-extrabold text-slate-900 block">{c.name}</span>
                      <span className="text-[10px] text-slate-500">Door: {c.houseNo} • {c.phone}</span>
                    </div>
                    <span className="text-[10px] font-black text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                      உள்நுழை →
                    </span>
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500 max-w-md mx-auto pt-4">
        {dairyInfo.farmName} • {dairyInfo.address}
      </div>

    </div>
  );
}
