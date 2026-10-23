import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dairyService } from '../services/dairyService';
import { 
  Calendar as CalendarIcon, 
  PauseCircle, 
  PlusCircle, 
  QrCode, 
  MapPin, 
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  Bell
} from 'lucide-react';
import UPIPaymentModal from './UPIPaymentModal';

export default function CustomerPortal() {
  const { t, lang } = useLanguage();
  const { activeCustomer, dairyInfo } = useAuth();
  
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [ledgerItem, setLedgerItem] = useState(null);
  const [extraRequests, setExtraRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Vacation form state
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [vacationFrom, setVacationFrom] = useState(tomorrowStr);
  const [vacationTo, setVacationTo] = useState(tomorrowStr);
  const [vacationShift, setVacationShift] = useState('BOTH');
  const [vacationReason, setVacationReason] = useState(lang === 'ta' ? 'வெளியூர் செல்கிறோம்' : 'Out of town');

  // Extra milk form state
  const [extraDate, setExtraDate] = useState(tomorrowStr);
  const [extraShift, setExtraShift] = useState('MORNING');
  const [extraLitres, setExtraLitres] = useState(1.0);
  const [extraLitresInput, setExtraLitresInput] = useState('1.0');
  const [extraReason, setExtraReason] = useState(lang === 'ta' ? 'விருந்தினர் வருகை' : 'Guests visiting');

  const handleSelectCustomerExtraPreset = (amt) => {
    setExtraLitres(amt);
    setExtraLitresInput(String(amt));
  };

  const handleManualCustomerExtraChange = (val) => {
    setExtraLitresInput(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      setExtraLitres(parsed);
    } else {
      setExtraLitres(0);
    }
  };

  const handleStepCustomerExtra = (delta) => {
    const current = parseFloat(extraLitresInput) || 0;
    const nextVal = Math.max(0.1, Math.round((current + delta) * 10) / 10);
    setExtraLitres(nextVal);
    setExtraLitresInput(String(nextVal));
  };

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const loadData = () => {
    if (!activeCustomer) return;
    const monthLedger = dairyService.getMonthLedger(selectedMonth);
    const active = monthLedger.find(item => item.customer.id === activeCustomer.id);
    setLedgerItem(active || null);
  };

  const loadRequests = () => {
    if (!activeCustomer) return;
    const allExtra = dairyService.getExtraMilkRequests();
    const myRequests = allExtra.filter(r => r.customerId === activeCustomer.id);
    setExtraRequests(myRequests);

    const allLeaves = dairyService.getLeaveRequests();
    const myLeaves = allLeaves.filter(l => l.customerId === activeCustomer.id);
    setLeaveRequests(myLeaves);
  };

  useEffect(() => {
    loadData();
    loadRequests();

    // Subscribe to real-time notifications from vendor (Accept / Reject)
    const unsubscribe = dairyService.subscribeToNotifications((data) => {
      if (data.type === 'EXTRA_REQUEST_RESPONDED' && data.payload?.customerId === activeCustomer?.id) {
        loadRequests();
        loadData();
        const req = data.payload;
        if (req.status === 'ACCEPTED') {
          showToast(`🎉 ${t('requestAcceptedMsg')}`);
        } else if (req.status === 'REJECTED') {
          showToast(`ℹ️ ${t('requestRejectedMsg')}`);
        }
      }
      if (data.type === 'LEAVE_REQUEST_RESPONDED' && data.payload?.customerId === activeCustomer?.id) {
        loadRequests();
        loadData();
        const req = data.payload;
        if (req.status === 'ACCEPTED') {
          showToast(`🏖️ ${t('leaveAcceptedMsg')}`);
        } else if (req.status === 'REJECTED') {
          showToast(`ℹ️ ${t('leaveRejectedMsg')}`);
        }
      }
      if (data.type === 'EXTRA_REQUEST_CREATED' || data.type === 'LEAVE_REQUEST_CREATED') {
        loadRequests();
      }
    });

    return () => unsubscribe();
  }, [activeCustomer, selectedMonth]);

  // Cut-off check for leave request
  const cutoffCheck = dairyService.checkLeaveCutoff(vacationFrom, vacationShift);

  // Handle vacation submit
  const handleVacationSubmit = async (e) => {
    e.preventDefault();
    if (!cutoffCheck.allowed) {
      alert(cutoffCheck.message);
      return;
    }
    await dairyService.requestLeave(
      activeCustomer,
      vacationFrom,
      vacationTo,
      vacationShift,
      vacationReason
    );
    setShowVacationModal(false);
    showToast(t('leaveSentNotice'));
    loadRequests();
  };

  // Handle extra milk submit
  const handleExtraSubmit = async (e) => {
    e.preventDefault();
    await dairyService.requestExtraMilk(
      activeCustomer,
      extraDate,
      extraShift,
      extraLitres,
      extraReason
    );
    setShowExtraModal(false);
    showToast(t('requestSentNotice'));
    loadRequests();
  };

  if (!activeCustomer) {
    return (
      <div className="text-center py-12 bg-white rounded-3xl p-6">
        <p className="text-slate-500 font-bold">{t('customerNotFound')}</p>
      </div>
    );
  }

  // Today's delivery status for this customer
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMorningSheet = dairyService.getDailyDeliverySheet(todayStr, 'MORNING');
  const todayRecord = todayMorningSheet.find(r => r.customer.id === activeCustomer.id);

  return (
    <div className="space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-bold animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Customer Hero Banner */}
      <div className="bg-gradient-to-br from-blue-800 to-indigo-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-blue-100 border border-white/20">
              {t('door')}: {activeCustomer.houseNo}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              {t('hello')} {activeCustomer.name}!
            </h2>
            <p className="text-xs text-blue-100 mt-0.5 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              {activeCustomer.street}
            </p>
          </div>

          {/* Quick Pay Button */}
          <div className="text-left sm:text-right bg-blue-950/40 p-3.5 rounded-2xl border border-blue-400/30">
            <span className="text-[11px] text-blue-200 font-medium block">
              {t('currentMonthBill')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white block mt-0.5">
              ₹{ledgerItem ? ledgerItem.balanceDue : 0}
            </span>
            <button
              id="tour-customer-upi"
              onClick={() => setShowQrModal(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 text-xs font-black shadow transition active:scale-95"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{t('payUPI')}</span>
            </button>
          </div>
        </div>

        {/* Today's Delivery Status Card */}
        <div 
          id="tour-customer-status"
          className="mt-5 bg-white/10 rounded-2xl p-3.5 backdrop-blur-md border border-white/15 flex items-center justify-between"
        >
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
                {t('todayMorningMilk')} {todayRecord?.status === 'DELIVERED' ? t('markedDone') : todayRecord?.status === 'SKIPPED' ? t('markedSkipped') : t('deliverySoon')}
              </span>
              <span className="text-[11px] text-blue-200">
                {t('quantityLabel')} {todayRecord?.litres || activeCustomer.defaultMorningQty} {t('litres')} {todayRecord?.deliveredTime ? `• ${t('timeLabel')} ${todayRecord.deliveredTime}` : ''}
              </span>
            </div>
          </div>

          <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg">
            {t('today')}
          </span>
        </div>
      </div>

      {/* Customer Quick Actions: Pause / Extra Milk */}
      <div className="grid grid-cols-2 gap-3">
        <button
          id="tour-customer-pause"
          onClick={() => setShowVacationModal(true)}
          className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition text-slate-800"
        >
          <PauseCircle className="w-5 h-5 text-amber-600" />
          <div className="text-left">
            <span className="text-xs font-extrabold block">{t('pauseDelivery')}</span>
            <span className="text-[10px] text-slate-500">{t('pauseMilkDesc')}</span>
          </div>
        </button>

        <button
          id="tour-customer-extra"
          onClick={() => setShowExtraModal(true)}
          className="flex items-center justify-center space-x-2 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition text-slate-800"
        >
          <PlusCircle className="w-5 h-5 text-blue-600" />
          <div className="text-left">
            <span className="text-xs font-extrabold block">{t('requestExtra')}</span>
            <span className="text-[10px] text-slate-500">{t('extraMilkDesc')}</span>
          </div>
        </button>
      </div>

      {/* Customer's Extra Milk Request Status Tracker */}
      {extraRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🥛</span>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {t('extraRequestsTitle')}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {extraRequests.length} {lang === 'ta' ? 'கோரிக்கைகள்' : 'Requests'}
            </span>
          </div>

          <div className="space-y-2.5">
            {extraRequests.slice(0, 4).map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-amber-50/70 border-amber-300'
                      : isAccepted
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">
                          +{req.extraLitres}L {req.shift === 'MORNING' ? t('morning') : t('evening')}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">• {req.date}</span>
                      </div>
                      {req.reason && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          📌 {req.reason}
                        </p>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="flex-shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-900 animate-pulse shadow-sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('statusPending')}
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('statusAccepted')}
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('statusRejected')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vendor Note response feedback */}
                  <div className="mt-2 text-xs pt-2 border-t border-slate-200/60 font-semibold flex items-center space-x-1.5">
                    {isPending && (
                      <span className="text-amber-800 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 animate-spin" />
                        {t('pendingApproval')}
                      </span>
                    )}
                    {isAccepted && (
                      <span className="text-emerald-800">
                        🎉 {req.vendorNote || t('requestAcceptedMsg')}
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-rose-700">
                        ⚠️ {req.vendorNote || t('requestRejectedMsg')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}


      {/* Customer's Leave Requests Status Tracker */}
      {leaveRequests.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🏖️</span>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base">
                {t('leaveRequestsTitle')}
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500">
              {leaveRequests.length} {lang === 'ta' ? 'கோரிக்கைகள்' : 'Requests'}
            </span>
          </div>

          <div className="space-y-2.5">
            {leaveRequests.slice(0, 4).map((l) => {
              const isPending = l.status === 'PENDING';
              const isAccepted = l.status === 'ACCEPTED';
              const isRejected = l.status === 'REJECTED';

              const shiftBadge = 
                l.shift === 'MORNING' ? t('shiftMorningOnly') :
                l.shift === 'EVENING' ? t('shiftEveningOnly') : t('shiftBoth');

              return (
                <div
                  key={l.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isPending
                      ? 'bg-amber-50/70 border-amber-300'
                      : isAccepted
                        ? 'bg-emerald-50 border-emerald-200'
                        : 'bg-rose-50 border-rose-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900">
                          {l.shift === 'MORNING' && '☀️ '}
                          {l.shift === 'EVENING' && '🌙 '}
                          {l.shift === 'BOTH' && '☀️🌙 '}
                          {shiftBadge}
                        </span>
                        <span className="text-xs text-slate-500 font-bold">
                          • {l.fromDate === l.toDate ? l.fromDate : `${l.fromDate} ➡️ ${l.toDate}`}
                        </span>
                      </div>
                      {l.reason && (
                        <p className="text-xs text-slate-600 mt-0.5">
                          📌 {l.reason}
                        </p>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-400 text-slate-900 animate-pulse shadow-sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('statusPending')}
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {t('statusAccepted')}
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-600 text-white shadow-sm">
                          <XCircle className="w-3 h-3 mr-1" />
                          {t('statusRejected')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs pt-2 border-t border-slate-200/60 font-semibold flex items-center space-x-1.5">
                    {isPending && (
                      <span className="text-amber-800 flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1 text-amber-600 animate-spin" />
                        {t('pendingApproval')}
                      </span>
                    )}
                    {isAccepted && (
                      <span className="text-emerald-800">
                        🎉 {l.vendorNote || t('leaveAcceptedMsg')}
                      </span>
                    )}
                    {isRejected && (
                      <span className="text-rose-700">
                        ⚠️ {l.vendorNote || t('leaveRejectedMsg')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Monthly Passbook / Calendar */}
      <div 
        id="tour-customer-passbook"
        className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center space-x-2">
            <CalendarIcon className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-base">
              {t('monthlyPassbook')}
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
            <span className="text-[10px] text-slate-500 font-bold block">{t('totalMilkVolume')}</span>
            <span className="text-base font-black text-slate-900">{ledgerItem?.totalLitres || 0} L</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold block">{t('deliveredDaysCount')}</span>
            <span className="text-base font-black text-emerald-700">{ledgerItem?.deliveredDays || 0} {t('days')}</span>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80">
            <span className="text-[10px] text-slate-500 font-bold block">{t('leaveDaysCount')}</span>
            <span className="text-base font-black text-slate-500">{ledgerItem?.skippedDays || 0} {t('days')}</span>
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
                      {t('skipped')}
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
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-1"></span> {t('deliveredMilkLegend')}</span>
            <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-300 mr-1"></span> {t('leaveDayLegend')}</span>
          </div>
          <span className="font-semibold">{t('ratePerLitre')} ₹{activeCustomer.ratePerLitre || 56}</span>
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
              {t('leaveExplain')}
            </p>

            <form onSubmit={handleVacationSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('fromDate')}
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
                  {t('toDate')}
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
                  {t('leaveShiftLabel')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setVacationShift('BOTH')}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition ${
                      vacationShift === 'BOTH'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ☀️🌙 {lang === 'ta' ? 'முழு நாள்' : 'Both'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVacationShift('MORNING')}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition ${
                      vacationShift === 'MORNING'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ☀️ {lang === 'ta' ? 'காலை' : 'Morning'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVacationShift('EVENING')}
                    className={`py-2 px-1 text-center rounded-xl text-[11px] font-bold border transition ${
                      vacationShift === 'EVENING'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🌙 {lang === 'ta' ? 'மாலை' : 'Evening'}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('reason')}
                </label>
                <input
                  type="text"
                  value={vacationReason}
                  onChange={(e) => setVacationReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              {!cutoffCheck.allowed && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-rose-800 text-xs font-bold flex items-start space-x-2">
                  <span className="text-base">⚠️</span>
                  <span>{cutoffCheck.message}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowVacationModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!cutoffCheck.allowed}
                  className={`w-1/2 py-2.5 rounded-xl text-xs font-black shadow transition ${
                    cutoffCheck.allowed
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {t('submitLeaveBtn')}
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
                  {t('date')}
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
                  {t('shift')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraShift('MORNING')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      extraShift === 'MORNING' ? 'bg-amber-400 text-slate-900 border-amber-500' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {t('morning')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setExtraShift('EVENING')}
                    className={`py-2 rounded-xl text-xs font-bold border ${
                      extraShift === 'EVENING' ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    {t('evening')}
                  </button>
                </div>
              </div>

              {/* Extra Milk Presets */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('quantityLabel')} ({t('litres')})
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[0.5, 1.0, 1.5, 2.0, 3.0].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleSelectCustomerExtraPreset(amt)}
                      className={`py-2 rounded-xl text-xs font-black border transition ${
                        extraLitres === amt ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300' : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      +{amt}L
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input Box */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-600 block">
                    {t('orManualExtra')}
                  </label>
                  <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md font-black border border-blue-200">
                    ✍️ {lang === 'ta' ? 'நேரடி உள்ளீடு' : 'Manual Entry'}
                  </span>
                </div>

                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => handleStepCustomerExtra(-0.5)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-l-2xl font-black text-lg border border-r-0 border-slate-300 flex items-center justify-center transition"
                    title="-0.5L"
                  >
                    −
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="100"
                      value={extraLitresInput}
                      onChange={(e) => handleManualCustomerExtraChange(e.target.value)}
                      placeholder={t('manualLitresPlaceholder')}
                      className="w-full h-10 bg-slate-50 focus:bg-white text-center font-black text-slate-900 text-base border-y border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-400/20 outline-none transition px-2"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">
                      {t('litres')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStepCustomerExtra(+0.5)}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-r-2xl font-black text-lg border border-l-0 border-slate-300 flex items-center justify-center transition"
                    title="+0.5L"
                  >
                    +
                  </button>
                </div>

                {extraLitres <= 0 && (
                  <p className="text-[11px] font-bold text-rose-600">
                    ⚠️ {lang === 'ta' ? 'சரியான அளவை உள்ளிடவும் (0-க்கு மேல்)' : 'Please enter a valid amount (> 0)'}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowExtraModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!(extraLitres > 0)}
                  className={`w-1/2 py-2.5 rounded-xl text-white text-xs font-black shadow transition ${
                    extraLitres > 0
                      ? 'bg-blue-600 hover:bg-blue-700 active:scale-98 cursor-pointer'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  {t('sendRequestBtn')}
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
