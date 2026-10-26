import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Navbar from './components/Navbar';
import DeliveryRunner from './components/DeliveryRunner';
import CustomerDirectory from './components/CustomerDirectory';
import BillingLedger from './components/BillingLedger';
import CustomerPortal from './components/CustomerPortal';
import MilkYieldTracker from './components/MilkYieldTracker';
import InteractiveTour from './components/InteractiveTour';
import InstallAppBanner from './components/InstallAppBanner';
import { notificationService } from './services/notificationService';
import { dairyService } from './services/dairyService';
import { 
  Bike, 
  Users, 
  Receipt, 
  Milk, 
  Settings, 
  X
} from 'lucide-react';

function MainApp() {
  const { t } = useLanguage();
  const { currentUser, isAdmin, isCustomer, dairyInfo, updateDairyInfo } = useAuth();

  // If nobody is logged in, restrict routing to LoginPage
  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState(dairyInfo);
  const [isTourOpen, setIsTourOpen] = useState(false);

  // Auto-launch interactive tour for first-time visitors
  useEffect(() => {
    if (currentUser) {
      notificationService.init(currentUser);
      dairyService.syncAllRequests();
    }
  }, [currentUser]);

  useEffect(() => {
    if (isAdmin) {
      const seen = localStorage.getItem('paal_vandi_owner_tour_seen');
      if (!seen) {
        const timer = setTimeout(() => setIsTourOpen(true), 600);
        return () => clearTimeout(timer);
      }
    } else if (isCustomer) {
      const seen = localStorage.getItem('paal_vandi_cust_tour_seen');
      if (!seen) {
        const timer = setTimeout(() => setIsTourOpen(true), 600);
        return () => clearTimeout(timer);
      }
    }
  }, [isAdmin, isCustomer]);

  const handleTourComplete = () => {
    if (isAdmin) {
      localStorage.setItem('paal_vandi_owner_tour_seen', 'true');
    } else if (isCustomer) {
      localStorage.setItem('paal_vandi_cust_tour_seen', 'true');
    }
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateDairyInfo(settingsForm);
    setShowSettingsModal(false);
  };

  // Define Village-Friendly Tour Steps for Dairy Owner (Appa)
  const ownerTourSteps = [
    {
      targetId: 'tour-shift-selector',
      title: t('tourShiftTitle'),
      content: t('tourShiftDesc'),
    },
    {
      targetId: 'tour-metrics-banner',
      title: t('tourMetricsTitle'),
      content: t('tourMetricsDesc'),
    },
    {
      targetId: 'tour-mark-delivered',
      title: t('tourMarkDoneTitle'),
      content: t('tourMarkDoneDesc'),
    },
    {
      targetId: 'tour-extra-milk',
      title: t('tourExtraMilkTitle'),
      content: t('tourExtraMilkDesc'),
    },
    {
      targetId: 'tour-skip-leave',
      title: t('tourSkipLeaveTitle'),
      content: t('tourSkipLeaveDesc'),
    },
    {
      targetId: 'tour-tab-billing',
      title: t('tourBillingTitle'),
      content: t('tourBillingDesc'),
    },
    {
      targetId: 'tour-tab-milking',
      title: t('tourMilkingTitle'),
      content: t('tourMilkingDesc'),
    },
  ];

  // Define Village-Friendly Tour Steps for Household Customer
  const customerTourSteps = [
    {
      targetId: 'tour-customer-status',
      title: t('tourCustStatusTitle'),
      content: t('tourCustStatusDesc'),
    },
    {
      targetId: 'tour-customer-pause',
      title: t('tourCustPauseTitle'),
      content: t('tourCustPauseDesc'),
    },
    {
      targetId: 'tour-customer-extra',
      title: t('tourCustExtraTitle'),
      content: t('tourCustExtraDesc'),
    },
    {
      targetId: 'tour-customer-passbook',
      title: t('tourCustPassbookTitle'),
      content: t('tourCustPassbookDesc'),
    },
    {
      targetId: 'tour-customer-upi',
      title: t('tourCustPayTitle'),
      content: t('tourCustPayDesc'),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <Navbar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedShift={selectedShift}
          setSelectedShift={setSelectedShift}
          onOpenSettings={() => {
            setSettingsForm(dairyInfo);
            setShowSettingsModal(true);
          }}
          onOpenTour={() => setIsTourOpen(true)}
        />

        {/* -------------------- 👨‍🌾 DAIRY OWNER / APPA VIEW -------------------- */}
        {isAdmin && (
          <>
            {/* Desktop Navigation Tabs for Appa */}
            <div className="bg-white border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 no-scrollbar">
                  <NavLink
                    to="/runner"
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Bike className="w-4 h-4" />
                    <span>{t('routeRunner')}</span>
                  </NavLink>

                  <NavLink
                    to="/customers"
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Users className="w-4 h-4" />
                    <span>{t('customers')}</span>
                  </NavLink>

                  <NavLink
                    id="tour-tab-billing"
                    to="/billing"
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Receipt className="w-4 h-4" />
                    <span>{t('billing')}</span>
                  </NavLink>

                  <NavLink
                    id="tour-tab-milking"
                    to="/milking"
                    className={({ isActive }) =>
                      `flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                        isActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Milk className="w-4 h-4" />
                    <span>{t('milkingStock')}</span>
                  </NavLink>
                </nav>
              </div>
            </div>

            {/* Appa Main Screen Content with URL-driven Routes */}
            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 sm:pb-12">
              <Routes>
                <Route path="/" element={<Navigate to="/runner" replace />} />
                <Route path="/runner" element={<DeliveryRunner selectedDate={selectedDate} selectedShift={selectedShift} />} />
                <Route path="/customers" element={<CustomerDirectory />} />
                <Route path="/billing" element={<BillingLedger />} />
                <Route path="/milking" element={<MilkYieldTracker selectedDate={selectedDate} />} />
                <Route path="/portal" element={<CustomerPortal />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="*" element={<Navigate to="/runner" replace />} />
              </Routes>
            </main>

            {/* Mobile Bottom Bar for Appa */}
            <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
              <NavLink
                to="/runner"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                    isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }`
                }
              >
                <Bike className="w-5 h-5 mb-0.5" />
                <span>{t('route')}</span>
              </NavLink>

              <NavLink
                to="/customers"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                    isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }`
                }
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span>{t('customers')}</span>
              </NavLink>

              <NavLink
                to="/billing"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                    isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }`
                }
              >
                <Receipt className="w-5 h-5 mb-0.5" />
                <span>{t('billing')}</span>
              </NavLink>

              <NavLink
                to="/milking"
                className={({ isActive }) =>
                  `flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
                    isActive ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
                  }`
                }
              >
                <Milk className="w-5 h-5 mb-0.5" />
                <span>{t('milkingStock')}</span>
              </NavLink>
            </nav>
          </>
        )}

        {/* -------------------- 🏡 CUSTOMER VIEW -------------------- */}
        {isCustomer && (
          <main className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-12">
            <Routes>
              <Route path="/" element={<Navigate to="/portal" replace />} />
              <Route path="/portal" element={<CustomerPortal />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="*" element={<Navigate to="/portal" replace />} />
            </Routes>
          </main>
        )}

      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          🥛 {dairyInfo.farmName} • {dairyInfo.address}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {t('pureCowMilk')} • {t('appSubtitle')}
        </p>
      </footer>

      {/* Interactive Walkthrough Tour for New Users (Village-Friendly) */}
      <InteractiveTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onComplete={handleTourComplete}
        steps={isAdmin ? ownerTourSteps : customerTourSteps}
        tourKey={isAdmin ? 'owner' : 'customer'}
      />

      {/* Dairy Settings Modal (For Appa) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {t('dairySettingsTitle')}
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('brandNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.appName || 'PaalVandi'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, appName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('farmSubtitleLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.farmName || 'dheena dhinesh farming'}
                  onChange={(e) => setSettingsForm({ ...settingsForm, farmName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('ownerNameLabel')}
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.ownerName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('ownerPinLabel')}
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={settingsForm.ownerPin || "1234"}
                  onChange={(e) => setSettingsForm({ ...settingsForm, ownerPin: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold tracking-widest"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('upiIdLabel')}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9842154321@okaxis"
                  value={settingsForm.upiId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-800"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  {t('upiExplain')}
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('phone')}
                </label>
                <input
                  type="text"
                  value={settingsForm.phone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  🌐 கிளவுட் சர்வர் URL (Cloud Server URL for Multi-Phone Sync)
                </label>
                <input
                  type="text"
                  placeholder="https://paal-tracker-frontend-seven.vercel.app"
                  value={settingsForm.serverUrl || localStorage.getItem('paal_vandi_server_url') || ''}
                  onChange={(e) => {
                    setSettingsForm({ ...settingsForm, serverUrl: e.target.value });
                    localStorage.setItem('paal_vandi_server_url', e.target.value);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-emerald-800"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  தனித்தனி மொபைல் போன்களில் இயங்க Vercel லைவ் லிங்க் அல்லது சர்வர் IP உள்ளிடவும்
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('addressLabel')}
                </label>
                <input
                  type="text"
                  value={settingsForm.address}
                  onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  {t('saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating PWA Mobile App Install Banner */}
      <InstallAppBanner />

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
