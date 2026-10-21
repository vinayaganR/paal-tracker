import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dairyService } from '../services/dairyService';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  QrCode, 
  Clock, 
  MapPin, 
  PauseCircle, 
  Sparkles,
  ChevronDown,
  AlertCircle
} from 'lucide-react';
import UPIPaymentModal from './UPIPaymentModal';

export default function CustomerPortal() {
  const { t, lang } = useLanguage();
  const { activeCustomerId, setActiveCustomerId, dairyInfo } = useAuth();
  
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [customers, setCustomers] = useState([]);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Vacation form state
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [vacationFrom, setVacationFrom] = useState(tomorrowStr);
  const [vacationTo, setVacationTo] = useState(tomorrowStr);
  const [vacationReason, setVacationReason] = useState('வெளியூர் செல்கிறோம் (Out of town)');

  // Extra milk form state
  const [extraDate, setExtraDate] = useState(tomorrowStr);
  const [extraShift, setExtraShift] = useState('MORNING');
  const [extraLitres, setExtraLitres] = useState(1.0);
  const [extraReason, setExtraReason] = useState('விருந்தினர் வருகை (Guests visiting)');

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  const loadData = () => {
    const custList = dairyService.getCustomers();
    setCustomers(custList);

    const monthLedger = dairyService.getMonthLedger(selectedMonth);
    const active = monthLedger.find(item => item.customer.id === activeCustomerId);
    setLedgerItem(active || null);
  };

  useEffect(() => {
    loadData();
  }, [activeCustomerId, selectedMonth]);

  const activeCustomer = customers.find(c => c.id === activeCustomerId);

  // Handle vacation submit
  const handleVacationSubmit = (e) => {
    e.preventDefault();
    dairyService.addVacation(activeCustomerId, vacationFrom, vacationTo, vacationReason);
    setShowVacationModal(false);
    showToast(t('vacationSuccess'));
    loadData();
  };

  // Handle extra milk submit
  const handleExtraSubmit = (e) => {
    e.preventDefault();
    dairyService.requestExtraMilk(activeCustomerId, extraDate, extraShift, extraLitres, extraReason);
    setShowExtraModal(false);
    showToast(t('extraSuccess'));
    loadData();
  };

  if (!activeCustomer) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl p-6">
        <p className="text-slate-500 font-bold">வாடிக்கையாளர் தேர்ந்தெடுக்கப்படவில்லை</p>
      </div>
    );
  }

  // Today's delivery status for this customer
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMorningSheet = dairyService.getDailyDeliverySheet(todayStr, 'MORNING');
  const todayRecord = todayMorningSheet.find(r => r.customer.id === activeCustomerId);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Switcher for testing different customers */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <span className="text-xs font-bold text-slate-500">
          வாடிக்கையாளர் கணக்கு:
        </span>
        <div className="relative">
          <select
            value={activeCustomerId}
            onChange={(e) => setActiveCustomerId(e.target.value)}
            className="text-xs font-extrabold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 outline-none pr-7 cursor-pointer"
          >
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.houseNo})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
        </div>
      </div>

      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-800 to-green-700 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-emerald-100 border border-white/20">
              Door: {activeCustomer.houseNo}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              வணக்கம், {activeCustomer.name}!
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {activeCustomer.street}
            </p>
          </div>

          {/* Quick Pay Button */}
          <div className="text-left sm:text-right bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-500/30">
            <span className="text-[11px] text-emerald-300 font-medium block">
              இந்த மாத கட்டணம் (Bill)
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
              ₹{ledgerItem ? ledgerItem.balanceDue : 0}
            </span>
            <button
              onClick={() => setShowQrModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('payUPI')}</span>
            </button>
          </div>
        </div>

        {/* Today's Delivery Status Card */}
        <div className="mt-5 bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/15 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg ${
              todayRecord?.status === 'DELIVERED'
                ? 'bg-emerald-400 text-slate-900'
                : todayRecord?.status === 'SKIPPED'
                ? 'bg-slate-400 text-white'
                : 'bg-amber-300 text-slate-900 animate-pulse'
            }`}>
              {todayRecord?.status === 'DELIVERED' ? '✓' : todayRecord?.status === 'SKIPPED' ? '⏸' : '⏳'}
            </div>
            <div>
              <span className="text-xs font-black block">
                இன்றைய காலை பால்: {todayRecord?.status === 'DELIVERED' ? 'போட்டாச்சு (Delivered)' : todayRecord?.status === 'SKIPPED' ? 'விடுப்பு (Skipped)' : 'விநியோகம் விரைவில்'}
              </span>
              <span className="text-[11px] text-emerald-200">
                அளவு: {todayRecord?.litres || activeCustomer.defaultMorningQty}L {todayRecord?.deliveredTime ? `• நேரம்: ${todayRecord.deliveredTime}` : ''}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
            இன்று
          </span>
        </div>
      </div>

      {/* Customer Quick Actions: Pause / Extra Milk */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowVacationModal(true)}
          className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition text-slate-800"
        >
          <PauseCircle className="w-5 h-5 text-amber-600" />
          <div className="text-left">
            <span className="text-xs font-extrabold block">{t('pauseDelivery')}</span>
            <span className="text-[10px] text-slate-500">பால் நிறுத்த லீவு பதிவு</span>
          </div>
        </button>

        <button
          onClick={() => setShowExtraModal(true)}
          className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-500 hover:shadow-md transition text-slate-800"
        >
          <PlusCircle className="w-5 h-5 text-emerald-600" />
          <div className="text-left">
            <span className="text-xs font-extrabold block">{t('requestExtra')}</span>
            <span className="text-[10px] text-slate-500">+1L அல்லது +0.5L கேட்க</span>
          </div>
        </button>
      </div>

      {/* Monthly Passbook / Calendar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              மாதாந்திர பாஸ்புக் (Delivery Passbook)
            </h3>
          </div>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-xl outline-none"
          />
        </div>

        {/* Monthly Summary Pills */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold block">மொத்த பால்</span>
            <span className="text-base font-black text-slate-900">{ledgerItem?.totalLitres || 0} L</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold block">வாங்கின நாட்கள்</span>
            <span className="text-base font-black text-emerald-700">{ledgerItem?.deliveredDays || 0} நாட்கள்</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold block">விடுப்பு</span>
            <span className="text-base font-black text-slate-500">{ledgerItem?.skippedDays || 0} நாட்கள்</span>
          </div>
        </div>

        {/* Date-wise Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {ledgerItem?.dailyBreakdown.map((day) => {
            const isDelivered = day.status === 'DELIVERED';
            const isSkipped = day.status === 'SKIPPED';

            return (
              <div
                key={day.date}
                className={`p-2 rounded-xl text-center border transition flex flex-col justify-between min-h-[56px] ${
                  isDelivered
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                    : isSkipped
                    ? 'bg-slate-100 border-slate-200 text-slate-400'
                    : 'bg-slate-50/50 border-slate-100 text-slate-400'
                }`}
              >
                <span className="text-[10px] font-bold block opacity-70">
                  {day.day}
                </span>

                <div className="my-0.5">
                  {isDelivered && (
                    <span className="text-xs font-black block text-emerald-800">
                      {day.litres}L
                    </span>
                  )}
                  {isSkipped && (
                    <span className="text-[9px] font-bold block text-slate-500">
                      லீவு
                    </span>
                  )}
                  {!isDelivered && !isSkipped && (
                    <span className="text-[9px] block text-slate-300">-</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t">
          <div className="flex items-center space-x-3">
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> போட்ட பால்</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1"></span> லீவு நாள்</span>
          </div>
          <span className="font-semibold">லிட்டர் ₹{activeCustomer.ratePerLitre || 56}</span>
        </div>
      </div>

      {/* Vacation / Pause Request Modal */}
      {showVacationModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {t('pauseDelivery')}
              </h3>
              <button onClick={() => setShowVacationModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              நீங்கள் லீவு பதிவு செய்தால் அந்த நாட்களில் பால் விநியோகம் நிறுத்தப்பட்டு, மாதாந்திர பில்லில் கட்டணம் சேர்க்கப்படாது.
            </p>

            <form onSubmit={handleVacationSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  தொடக்க நாள் (From Date)
                </label>
                <input
                  type="date"
                  required
                  value={vacationFrom}
                  onChange={(e) => setVacationFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  முடிவு நாள் (To Date)
                </label>
                <input
                  type="date"
                  required
                  value={vacationTo}
                  onChange={(e) => setVacationTo(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  காரணம் (Reason)
                </label>
                <input
                  type="text"
                  value={vacationReason}
                  onChange={(e) => setVacationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVacationModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  ரத்து செய்க
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black shadow"
                >
                  லீவு பதிவு செய் ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Extra Milk Request Modal */}
      {showExtraModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {t('requestExtra')}
              </h3>
              <button onClick={() => setShowExtraModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={handleExtraSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  தேதி (Date)
                </label>
                <input
                  type="date"
                  required
                  value={extraDate}
                  onChange={(e) => setExtraDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ஷிப்ட்
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraShift('MORNING')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      extraShift === 'MORNING' ? 'bg-amber-400 text-slate-900 border-amber-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    காலை (Morning)
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraShift('EVENING')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      extraShift === 'EVENING' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    மாலை (Evening)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  கூடுதல் அளவு (Litres)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 1.0, 2.0].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setExtraLitres(amt)}
                      className={`py-2 rounded-xl text-xs font-black border ${
                        extraLitres === amt ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      +{amt} L
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtraModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  ரத்து செய்க
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow"
                >
                  கோரிக்கை அனுப்பு ✅
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI QR Modal */}
      {showQrModal && (
        <UPIPaymentModal
          customer={activeCustomer}
          amount={ledgerItem?.balanceDue || ledgerItem?.totalAmount || 0}
          monthStr={selectedMonth}
          dairyInfo={dairyInfo}
          onClose={() => setShowQrModal(false)}
        />
      )}

    </div>
  );
}
