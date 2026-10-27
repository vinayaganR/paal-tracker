import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
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
  Info, 
  Download,
  KeyRound,
  MessageSquare,
  UserPlus,
  CheckCircle2,
  MapPin,
  Clock,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import InstallAppBanner from './InstallAppBanner';

export default function LoginPage() {
  const { t, lang, toggleLanguage } = useLanguage();
  const { currentUser, isAdmin, loginAsOwner, loginAsCustomer, registerCustomer, dairyInfo } = useAuth();
  const navigate = useNavigate();

  // Active top tab: 'OWNER' | 'CUSTOMER'
  const [activeTab, setActiveTab] = useState('OWNER');
  const [copiedLink, setCopiedLink] = useState(false);

  // Owner state
  const [ownerPhone, setOwnerPhone] = useState(dairyInfo?.phone ? dairyInfo.phone.replace(/[^0-9]/g, '').slice(-10) : '9842154321');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [ownerLoginMode, setOwnerLoginMode] = useState('PASSWORD'); // 'PASSWORD' | 'OTP'
  const [ownerOtp, setOwnerOtp] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState(false);

  // Customer state: 'LOGIN' | 'REGISTER'
  const [customerMode, setCustomerMode] = useState('LOGIN');
  const [customerPhone, setCustomerPhone] = useState('');
  const [registeredCustomers, setRegisteredCustomers] = useState(() => dairyService.getCustomers());

  // Sync latest customer directory on load from real database
  useEffect(() => {
    dairyService.syncCustomers().then(list => {
      if (list && Array.isArray(list)) setRegisteredCustomers(list);
    }).catch(() => {});
  }, []);
  
  // Registration form
  const [regForm, setRegForm] = useState({
    name: '',
    phone: '',
    houseNo: '',
    street: '',
    defaultMorningQty: 1.0,
    defaultEveningQty: 0.5,
    ratePerLitre: 56
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Owner Submit (Password or OTP) with server-side authentication
  const handleOwnerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (ownerLoginMode === 'OTP') {
      if (!ownerOtp || ownerOtp.trim().length < 4) {
        setErrorMsg(t('enterOtpLabel'));
        return;
      }
      const res = await loginAsOwner(ownerPhone, ownerOtp, true);
      if (!res.success) {
        setErrorMsg(t('invalidOtp'));
      } else {
        navigate('/runner', { replace: true });
      }
    } else {
      if (!ownerPassword) {
        setErrorMsg(t('enterPin'));
        return;
      }
      const res = await loginAsOwner(ownerPhone, ownerPassword, false);
      if (!res.success) {
        if (res.error === 'INVALID_OWNER_PHONE') {
          setErrorMsg(t('invalidOwnerPhone'));
        } else {
          setErrorMsg(t('invalidPin'));
        }
      } else {
        navigate('/runner', { replace: true });
      }
    }
  };

  // Generate / Send Simulated OTP for Owner
  const handleSendOwnerOtp = () => {
    setOtpSentNotice(true);
    setOwnerOtp('1234'); // Pre-fill with test OTP for convenience
    setSuccessMsg(lang === 'ta' ? '📲 SMS OTP அனுப்பப்பட்டது: 1234 (தானாக நிரப்பப்பட்டது)' : '📲 SMS OTP sent: 1234 (Auto-filled for testing)');
  };

  // Customer Login Submit
  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!customerPhone) {
      setErrorMsg(t('enterPhone'));
      return;
    }

    const res = await loginAsCustomer(customerPhone);
    if (!res.success) {
      setErrorMsg(t('customerNotFound'));
    } else {
      navigate('/portal', { replace: true });
    }
  };

  // Customer Registration Submit
  const handleCustomerRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!regForm.name || !regForm.phone || !regForm.houseNo) {
      setErrorMsg(lang === 'ta' ? 'பெயர், தொலைபேசி மற்றும் கதவு எண் கட்டாயம் உள்ளிட வேண்டும்!' : 'Name, phone, and door number are required!');
      return;
    }

    if (regForm.phone.replace(/[^0-9]/g, '').length < 10) {
      setErrorMsg(t('enterPhone'));
      return;
    }

    const res = await registerCustomer(regForm);
    if (!res.success) {
      setErrorMsg(res.message || t('customerNotFound'));
    } else {
      setSuccessMsg(t('customerRegisteredSuccess'));
      setTimeout(() => {
        navigate('/portal', { replace: true });
      }, 500);
    }
  };

  const handleQuickCustomerLogin = (cust) => {
    loginAsCustomer(cust.id);
    navigate('/portal', { replace: true });
  };

  const handleShareApp = () => {
    const url = `${window.location.origin}/login`;
    const shareText = lang === 'ta'
      ? `🥛 ${dairyInfo?.farmName || 'ஸ்ரீ காமதேனு பால் பண்ணை'} - பால் ஆர்டர், கூடுதல் பால் & விடுப்பு கோரிக்கைகளை எளிதாக பதிவு செய்ய இந்த லிங்கை திறக்கவும்:\n${url}`
      : `🥛 ${dairyInfo?.farmName || 'Kamadhenu Dairy'} - Order milk, request extra milk & leave online:\n${url}`;

    if (navigator.share) {
      navigator.share({
        title: dairyInfo?.farmName || 'PaalVandi Dairy',
        text: shareText,
        url: url
      }).catch(() => {});
    } else {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`, '_blank');
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/login`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }).catch(() => {});
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

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5">
        
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black tracking-tight text-slate-900">
            {t('loginTitle')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('loginSubtitle')}
          </p>
        </div>

        {/* Existing Logged-in Session Banner */}
        {currentUser && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs text-emerald-900 shadow-sm">
            <div>
              <span className="font-bold text-slate-600 block text-[11px]">
                {lang === 'ta' ? 'தற்போது உள்நுழைந்துள்ள கணக்கு:' : 'Currently Active Session:'}
              </span>
              <span className="font-extrabold text-emerald-800 text-xs">
                {isAdmin ? (dairyInfo?.ownerName || 'பண்ணை உரிமையாளர் (Owner)') : (currentUser.customer?.name || 'வாடிக்கையாளர்')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(isAdmin ? '/runner' : '/portal')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-sm transition active:scale-95"
            >
              {lang === 'ta' ? 'டாஷ்போர்டு ➔' : 'Dashboard ➔'}
            </button>
          </div>
        )}

        {/* Role Selector Tabs (Appa vs Customer) */}
        <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
          <button
            onClick={() => {
              setActiveTab('OWNER');
              setErrorMsg('');
              setSuccessMsg('');
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
              setSuccessMsg('');
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

        {/* Alert Notifications */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-700 text-xs font-bold p-3 rounded-xl border border-rose-200">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="bg-emerald-50 text-emerald-800 text-xs font-bold p-3 rounded-xl border border-emerald-200 flex items-center space-x-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: OWNER / APPA LOGIN WITH PHONE + PASSWORD OR OTP */}
        {activeTab === 'OWNER' && (
          <form onSubmit={handleOwnerSubmit} className="space-y-4">
            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-100 text-xs text-emerald-900">
              <span className="font-bold block">👨‍🌾 பண்ணையாளர் பாதுகாப்பு உள்நுழைவு:</span>
              <span className="text-[11px] text-emerald-800">
                பதிவு செய்த மொபைல் எண் மற்றும் கடவுச்சொல் / OTP மூலம் உள்நுழையவும்.
              </span>
            </div>

            {/* Owner Phone Input */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('ownerPhoneLabel')}
              </label>
              <div className="relative">
                <input
                  type="tel"
                  placeholder="9842154321"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Mode Toggle: Password vs OTP */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setOwnerLoginMode('PASSWORD');
                  setErrorMsg('');
                }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  ownerLoginMode === 'PASSWORD' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{t('loginWithPassword')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setOwnerLoginMode('OTP');
                  setErrorMsg('');
                }}
                className={`py-1.5 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  ownerLoginMode === 'OTP' ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{t('loginWithOtp')}</span>
              </button>
            </div>

            {/* Mode A: Password / PIN */}
            {ownerLoginMode === 'PASSWORD' && (
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('ownerPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    placeholder={t('enterPin')}
                    value={ownerPassword}
                    onChange={(e) => setOwnerPassword(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}

            {/* Mode B: OTP Input with Get OTP button */}
            {ownerLoginMode === 'OTP' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    {t('enterOtpLabel')}
                  </label>
                  <button
                    type="button"
                    onClick={handleSendOwnerOtp}
                    className="text-xs font-bold text-emerald-700 hover:underline flex items-center space-x-1"
                  >
                    <span>{t('sendOtpBtn')}</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    maxLength={6}
                    placeholder="1234"
                    value={ownerOtp}
                    onChange={(e) => setOwnerOtp(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-base font-black tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center"
                  />
                  <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                {otpSentNotice && (
                  <p className="text-[11px] text-emerald-700 font-bold bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    {t('otpSentMsg')}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition active:scale-98 flex items-center justify-center space-x-1.5"
            >
              <span>{t('loginBtn')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick 1-Click Demo Login */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => {
                  loginAsOwner('1234');
                  navigate('/runner', { replace: true });
                }}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-emerald-700 hover:underline"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t('quickDemoLogin')} (PIN: 1234)</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: CUSTOMER LOGIN & SELF-REGISTRATION */}
        {activeTab === 'CUSTOMER' && (
          <div className="space-y-4">
            
            {/* Customer Sub-Mode Selector: Login vs Register */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('LOGIN');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  customerMode === 'LOGIN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{t('existingCustomerLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode('REGISTER');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className={`py-2 rounded-lg transition-all flex items-center justify-center space-x-1 ${
                  customerMode === 'REGISTER' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('newCustomerRegister')}</span>
              </button>
            </div>

            {/* Sub-Mode 1: Existing Customer Phone Login */}
            {customerMode === 'LOGIN' && (
              <div className="space-y-4">
                <form onSubmit={handleCustomerSubmit} className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('customerPhoneLabel')}
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        placeholder={t('enterPhone')}
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

                {/* Quick Pick Existing Customer */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    {t('orPickCustomer')}
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
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

            {/* Sub-Mode 2: New Customer Self-Registration Form */}
            {customerMode === 'REGISTER' && (
              <form onSubmit={handleCustomerRegister} className="space-y-3">
                <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 text-xs text-blue-900">
                  <span className="font-bold block">✨ பால்வண்டி புதிய வாடிக்கையாளர்:</span>
                  <span className="text-[11px] text-blue-800">
                    உங்கள் முகவரியை உள்ளிட்டு தினசரி புதிய பசும்பால் விநியோகத்தை தொடங்கவும்.
                  </span>
                </div>

                {/* Full Name */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('customerNameLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={lang === 'ta' ? 'வாடிக்கையாளர் முழு பெயர் உள்ளிடவும்' : 'Enter customer full name'}
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('phone')} (10 இலக்கம்) *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder={lang === 'ta' ? '10 இலக்க மொபைல் எண் உள்ளிடவும்' : 'Enter 10-digit mobile number'}
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Door & Street in 2 columns */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('customerDoorLabel')} *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={lang === 'ta' ? 'கதவு எண் உள்ளிடவும்' : 'Enter house / door no'}
                      value={regForm.houseNo}
                      onChange={(e) => setRegForm({ ...regForm, houseNo: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('customerStreetLabel')}
                    </label>
                    <input
                      type="text"
                      placeholder={lang === 'ta' ? 'தெரு அல்லது பகுதி பெயர் உள்ளிடவும்' : 'Enter street or area'}
                      value={regForm.street}
                      onChange={(e) => setRegForm({ ...regForm, street: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Morning & Evening Milk Quantities */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('defaultMorningLabel')}
                    </label>
                    <select
                      value={regForm.defaultMorningQty}
                      onChange={(e) => setRegForm({ ...regForm, defaultMorningQty: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0.5}>0.5 L (அரை)</option>
                      <option value={1.0}>1.0 L (ஒரு)</option>
                      <option value={1.5}>1.5 L (ஒன்றரை)</option>
                      <option value={2.0}>2.0 L (இரண்டு)</option>
                      <option value={0.0}>0.0 L (காலை இல்லை)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {t('defaultEveningLabel')}
                    </label>
                    <select
                      value={regForm.defaultEveningQty}
                      onChange={(e) => setRegForm({ ...regForm, defaultEveningQty: Number(e.target.value) })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={0.0}>0.0 L (மாலை இல்லை)</option>
                      <option value={0.5}>0.5 L (அரை)</option>
                      <option value={1.0}>1.0 L (ஒரு)</option>
                      <option value={1.5}>1.5 L (ஒன்றரை)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-200 transition active:scale-98 flex items-center justify-center space-x-1.5"
                >
                  <span>{t('registerAndLoginBtn')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>
        )}

      </div>

      {/* Mobile Web App Quick Share & Home Screen Info */}
      <div className="max-w-md mx-auto mt-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-4 sm:p-5 border border-emerald-500/30 shadow-xl space-y-3">
        <div className="flex items-center space-x-3 text-left">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 p-1 flex items-center justify-center flex-shrink-0 shadow-md">
            <img src="/cow-transparent.png" alt="PaalVandi" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-black text-sm text-white">
                {lang === 'ta' ? 'மொபைல் வலைத்தளம் (Web App)' : 'Mobile Web App'}
              </span>
              <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
                PWA
              </span>
            </div>
            <p className="text-[11px] text-slate-300 font-medium">
              {lang === 'ta' ? 'எந்த போனிலும் பிரவுசரிலேயே எளிதாக பயன்படுத்தலாம்' : 'Works instantly on any mobile browser without installation'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleShareApp}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition active:scale-95"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{lang === 'ta' ? 'வாட்ஸ்அப் பகிர்வு' : 'Share WhatsApp'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">{lang === 'ta' ? 'நகலெடுக்கப்பட்டது!' : 'Copied!'}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>{lang === 'ta' ? 'இணைப்பை நகலெடு' : 'Copy Link'}</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[10px] text-slate-400 text-center font-medium pt-1">
          💡 {lang === 'ta' 
            ? 'Chrome / Safari-யில் "Add to Home Screen" கொடுத்தால் தனி ஆப் போன்று தோன்றும்!'
            : 'Tap "Add to Home Screen" in Chrome / Safari to use it like a standalone app!'}
        </p>
      </div>

      {/* Footer info */}
      <div className="text-center text-xs text-slate-500 max-w-md mx-auto pt-4">
        {dairyInfo.farmName} • {dairyInfo.address}
      </div>

      {/* Floating PWA Mobile App Install Prompt */}
      <InstallAppBanner />

    </div>
  );
}
