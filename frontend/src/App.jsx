import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth, ROLES } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import DeliveryRunner from './components/DeliveryRunner';
import CustomerDirectory from './components/CustomerDirectory';
import BillingLedger from './components/BillingLedger';
import CustomerPortal from './components/CustomerPortal';
import MilkYieldTracker from './components/MilkYieldTracker';
import { 
  Bike, 
  Users, 
  Receipt, 
  Milk, 
  Home, 
  Settings, 
  CheckCircle,
  HelpCircle,
  X
} from 'lucide-react';

function MainLayout() {
  const { t, lang } = useLanguage();
  const { currentRole, dairyInfo, updateDairyInfo } = useAuth();

  // Today's date YYYY-MM-DD
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedShift, setSelectedShift] = useState('MORNING');
  const [activeTab, setActiveTab] = useState('runner'); // 'runner' | 'customers' | 'billing' | 'milking' | 'customer_portal'
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsForm, setSettingsForm] = useState(dairyInfo);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateDairyInfo(settingsForm);
    setShowSettingsModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        {/* Top Navbar */}
        <Navbar
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          selectedShift={selectedShift}
          setSelectedShift={setSelectedShift}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Navigation Tabs (Desktop / Tablet) */}
        {currentRole !== ROLES.CUSTOMER && (
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto py-2.5 no-scrollbar">
                <button
                  onClick={() => setActiveTab('runner')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                    activeTab === 'runner'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Bike className="w-4 h-4" />
                  <span>{t('routeRunner')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('customers')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                    activeTab === 'customers'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>{t('customers')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('billing')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                    activeTab === 'billing'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>{t('billing')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('milking')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                    activeTab === 'milking'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Milk className="w-4 h-4" />
                  <span>{t('milkingStock')}</span>
                </button>

                <button
                  onClick={() => setActiveTab('customer_portal')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition whitespace-nowrap ${
                    activeTab === 'customer_portal'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <Home className="w-4 h-4" />
                  <span>{t('customerPortal')}</span>
                </button>

                <div className="flex-1"></div>

                <button
                  onClick={() => {
                    setSettingsForm(dairyInfo);
                    setShowSettingsModal(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                  title="Dairy Settings & UPI Config"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">அமைப்புகள்</span>
                </button>
              </nav>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-5 pb-24 sm:pb-12">
          {activeTab === 'runner' && (
            <DeliveryRunner selectedDate={selectedDate} selectedShift={selectedShift} />
          )}

          {activeTab === 'customers' && (
            <CustomerDirectory />
          )}

          {activeTab === 'billing' && (
            <BillingLedger />
          )}

          {activeTab === 'milking' && (
            <MilkYieldTracker selectedDate={selectedDate} />
          )}

          {activeTab === 'customer_portal' && (
            <CustomerPortal />
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar (Thumb Friendly) */}
      {currentRole !== ROLES.CUSTOMER && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-2 flex items-center justify-around shadow-lg">
          <button
            onClick={() => setActiveTab('runner')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              activeTab === 'runner' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Bike className="w-5 h-5 mb-0.5" />
            <span>டெலிவரி</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              activeTab === 'customers' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Users className="w-5 h-5 mb-0.5" />
            <span>வீடுகள்</span>
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              activeTab === 'billing' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Receipt className="w-5 h-5 mb-0.5" />
            <span>பில்</span>
          </button>

          <button
            onClick={() => setActiveTab('milking')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              activeTab === 'milking' ? 'text-emerald-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Milk className="w-5 h-5 mb-0.5" />
            <span>கரவை</span>
          </button>

          <button
            onClick={() => setActiveTab('customer_portal')}
            className={`flex flex-col items-center py-1 px-2.5 rounded-xl text-[10px] font-bold ${
              activeTab === 'customer_portal' ? 'text-blue-700 font-extrabold' : 'text-slate-500'
            }`}
          >
            <Home className="w-5 h-5 mb-0.5" />
            <span>வாடிக்கையாளர்</span>
          </button>
        </nav>
      )}

      {/* Footer info */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">
          🥛 {dairyInfo.farmName} • {dairyInfo.address}
        </p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Pure Farm-to-Home Milk Delivery Platform • Built with React, Java & Firebase
        </p>
      </footer>

      {/* Dairy Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">
                பண்ணை அமைப்புகள் (Dairy Settings)
              </h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  பண்ணை பெயர் (Farm / Brand Name)
                </label>
                <input
                  type="text"
                  required
                  value={settingsForm.farmName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, farmName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  உரிமையாளர் பெயர் (Owner / Appa Name)
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
                  UPI ID (GPay / PhonePe QR பணம் வர)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9842154321@okaxis or dairy@upi"
                  value={settingsForm.upiId}
                  onChange={(e) => setSettingsForm({ ...settingsForm, upiId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold font-mono text-emerald-800"
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  வாடிக்கையாளர்கள் ஸ்கேன் செய்து பணம் அனுப்ப இந்த UPI ஐடி பயன்படுத்தப்படும்.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  தொலைபேசி எண் (Phone)
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
                  முகவரி (Address)
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
                  ரத்து செய்க
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  சேமிக்க ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
