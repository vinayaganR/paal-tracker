import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import VendorRequestsModal from './VendorRequestsModal';
import { 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  PhoneCall, 
  Clock, 
  MapPin, 
  CheckCheck, 
  RotateCcw,
  Bell
} from 'lucide-react';

export default function DeliveryRunner({ selectedDate, selectedShift }) {
  const { t, lang } = useLanguage();
  const [sheet, setSheet] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE'
  const [search, setSearch] = useState('');
  const [activeModalCust, setActiveModalCust] = useState(null);
  const [customExtraQty, setCustomExtraQty] = useState(0.5);
  const [extraInputText, setExtraInputText] = useState('0.5');
  const [extraUnit, setExtraUnit] = useState('L'); // 'L' | 'ML'
  const [extraRequests, setExtraRequests] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isRequestsModalOpen, setIsRequestsModalOpen] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);

  const handleOpenExtraModal = (custItem) => {
    setActiveModalCust(custItem);
    setExtraUnit('L');
    setCustomExtraQty(0.5);
    setExtraInputText('0.5');
  };

  const handleUnitChange = (newUnit) => {
    if (newUnit === extraUnit) return;
    setExtraUnit(newUnit);
    if (newUnit === 'ML') {
      const mlVal = Math.round(customExtraQty * 1000);
      setExtraInputText(mlVal > 0 ? String(mlVal) : '');
    } else {
      const lVal = Math.round(customExtraQty * 100) / 100;
      setExtraInputText(lVal > 0 ? String(lVal) : '');
    }
  };

  const handleSelectPreset = (litres, displayVal) => {
    setCustomExtraQty(litres);
    setExtraInputText(String(displayVal));
  };

  const handleManualExtraChange = (val) => {
    setExtraInputText(val);
    const parsed = parseFloat(val);
    if (!isNaN(parsed) && parsed > 0) {
      if (extraUnit === 'ML') {
        setCustomExtraQty(parsed / 1000);
      } else {
        setCustomExtraQty(parsed);
      }
    } else {
      setCustomExtraQty(0);
    }
  };

  const handleStepQty = (direction) => {
    if (extraUnit === 'ML') {
      const current = parseFloat(extraInputText) || 0;
      const step = 100;
      const nextVal = Math.max(50, Math.round((current + direction * step) / 50) * 50);
      setExtraInputText(String(nextVal));
      setCustomExtraQty(nextVal / 1000);
    } else {
      const current = parseFloat(extraInputText) || 0;
      const step = 0.5;
      const nextVal = Math.max(0.1, Math.round((current + direction * step) * 10) / 10);
      setExtraInputText(String(nextVal));
      setCustomExtraQty(nextVal);
    }
  };

  const loadData = () => {
    const data = dairyService.getDailyDeliverySheet(selectedDate, selectedShift);
    setSheet(data);
  };

  const loadRequests = async () => {
    try {
      await dairyService.syncAllRequests();
    } catch (e) {}
    const allExtra = dairyService.getExtraMilkRequests();
    const allLeaves = dairyService.getLeaveRequests();
    setExtraRequests(allExtra);
    setLeaveRequests(allLeaves);
  };

  useEffect(() => {
    loadData();
    loadRequests();

    const unsubscribe = dairyService.subscribeToNotifications((data) => {
      loadRequests();
      loadData();
      if (data?.type === 'EXTRA_REQUEST_CREATED' && data.payload) {
        setIncomingAlert({
          title: lang === 'ta' ? '🥛 புதிய கூடுதல் பால் கோரிக்கை!' : '🥛 New Extra Milk Request!',
          desc: `${data.payload.customerName} (${data.payload.houseNo}) +${data.payload.extraLitres}L (${data.payload.shift === 'MORNING' ? 'காலை' : 'மாலை'})`
        });
        setTimeout(() => setIncomingAlert(null), 9000);
      } else if (data?.type === 'LEAVE_REQUEST_CREATED' && data.payload) {
        setIncomingAlert({
          title: lang === 'ta' ? '⏸️ புதிய விடுப்பு கோரிக்கை!' : '⏸️ New Leave Request!',
          desc: `${data.payload.customerName} (${data.payload.houseNo}) ${data.payload.fromDate} - ${data.payload.toDate}`
        });
        setTimeout(() => setIncomingAlert(null), 9000);
      }
    });

    // Periodic sync every 10 seconds to catch cloud requests automatically
    const syncTimer = setInterval(() => {
      loadRequests();
      loadData();
    }, 10000);

    return () => {
      clearInterval(syncTimer);
      unsubscribe();
    };
  }, [selectedDate, selectedShift]);

  const pendingExtra = extraRequests.filter(r => r.status === 'PENDING');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');
  const totalPending = pendingExtra.length + pendingLeaves.length;

  // Handle Mark Delivered
  const handleMarkDelivered = (item, extraLitres = 0) => {
    const finalQty = (item.defaultQty || 0) + extraLitres;
    dairyService.updateDeliveryRecord(
      selectedDate,
      selectedShift,
      item.customer.id,
      'DELIVERED',
      finalQty,
      extraLitres,
      extraLitres > 0 ? `+${extraLitres}L` : ''
    );
    loadData();
  };

  // Handle Mark Skipped / Leave
  const handleMarkSkipped = (item) => {
    dairyService.updateDeliveryRecord(
      selectedDate,
      selectedShift,
      item.customer.id,
      'SKIPPED',
      0,
      0,
      t('markedSkipped')
    );
    loadData();
  };

  // Handle Reset to Pending
  const handleReset = (item) => {
    dairyService.updateDeliveryRecord(
      selectedDate,
      selectedShift,
      item.customer.id,
      'PENDING',
      item.defaultQty,
      0,
      ''
    );
    loadData();
  };

  // Mark all pending
  const handleMarkAllPendingDone = () => {
    if (window.confirm(t('confirmMarkAll'))) {
      dairyService.markAllDelivered(selectedDate, selectedShift);
      loadData();
    }
  };

  // Stats calculation
  const totalHouses = sheet.length;
  const completedHouses = sheet.filter(s => s.status === 'DELIVERED').length;
  const skippedHouses = sheet.filter(s => s.status === 'SKIPPED').length;
  const pendingHouses = sheet.filter(s => s.status === 'PENDING').length;

  const totalLitresDelivered = sheet
    .filter(s => s.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (Number(curr.litres) || 0), 0);

  const totalLitresPending = sheet
    .filter(s => s.status === 'PENDING')
    .reduce((acc, curr) => acc + (Number(curr.defaultQty) || 0), 0);

  const totalShiftDemand = sheet.reduce((acc, curr) => acc + (Number(curr.defaultQty) || 0), 0);

  // Filter & Search
  const filteredList = sheet.filter(item => {
    if (filter === 'PENDING' && item.status !== 'PENDING') return false;
    if (filter === 'DONE' && item.status === 'PENDING') return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = item.customer.name.toLowerCase().includes(q);
      const matchHouse = item.customer.houseNo.toLowerCase().includes(q);
      const matchStreet = item.customer.street.toLowerCase().includes(q);
      return matchName || matchHouse || matchStreet;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      
      {/* Real-time Floating Notification Popup for Incoming Requests */}
      {incomingAlert && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 text-white p-4 rounded-3xl shadow-2xl border-2 border-emerald-400 ring-4 ring-emerald-500/20 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-xl flex-shrink-0">
              🔔
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-emerald-300 leading-tight">
                {incomingAlert.title}
              </h4>
              <p className="text-[11px] text-slate-200 font-medium">
                {incomingAlert.desc}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIncomingAlert(null);
              setIsRequestsModalOpen(true);
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md active:scale-95 transition"
          >
            {lang === 'ta' ? 'பார்க்க →' : 'View →'}
          </button>
        </div>
      )}

      {/* Live Incoming Requests (Extra Milk & Leave Requests) Notification Banner for Appa */}
      {totalPending > 0 && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 p-4 sm:p-5 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-amber-300 ring-4 ring-amber-400/20 animate-in fade-in">
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-slate-950 text-amber-300 flex items-center justify-center text-xl flex-shrink-0 shadow-md">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-950 text-white tracking-wider">
                  {pendingLeaves.length > 0 ? (lang === 'ta' ? 'புதிய லீவு கோரிக்கை' : 'New Leave Request') : t('newExtraNotification')}
                </span>
                <span className="text-xs font-bold text-slate-900">
                  {totalPending} {t('pendingRequests')}
                </span>
              </div>
              <h3 className="font-extrabold text-base text-slate-950 mt-0.5">
                {pendingLeaves.length > 0 ? (
                  <span>
                    🏖️ {pendingLeaves[0].customerName} ({t('door')}: {pendingLeaves[0].houseNo}) • <span className="font-black text-rose-950">{pendingLeaves[0].shift === 'MORNING' ? t('shiftMorningOnly') : pendingLeaves[0].shift === 'EVENING' ? t('shiftEveningOnly') : t('shiftBoth')}</span> ({pendingLeaves[0].fromDate})
                  </span>
                ) : (
                  <span>
                    🥛 {pendingExtra[0].customerName} ({t('door')}: {pendingExtra[0].houseNo}) • <span className="font-black text-emerald-950">+{pendingExtra[0].extraLitres}L {pendingExtra[0].shift === 'MORNING' ? t('morning') : t('evening')}</span>
                  </span>
                )}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 flex-shrink-0">
            <button
              onClick={() => {
                loadRequests();
                setIsRequestsModalOpen(true);
              }}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-slate-950 hover:bg-slate-900 active:scale-98 text-white text-xs sm:text-sm font-black shadow-lg transition flex items-center justify-center space-x-1.5"
            >
              <span>{t('extraRequestsTitle')}</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
                {totalPending}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* 5:00 AM Dashboard Metrics Banner */}
      <div 
        id="tour-metrics-banner"
        className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-green-700 rounded-3xl p-4 sm:p-6 text-white shadow-lg relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 opacity-10 pointer-events-none">
          <span className="text-9xl font-black">🥛</span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-100 border border-emerald-400/30">
                {selectedShift === 'MORNING' ? `🌅 ${t('morning')}` : `🌇 ${t('evening')}`} {t('shift')}
              </span>
              <span className="text-emerald-200 text-xs font-semibold">
                {selectedDate}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              {t('routeRunner')}
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              {completedHouses} / {totalHouses} {t('housesCompleted')} ({Math.round((completedHouses / (totalHouses || 1)) * 100)}%)
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-emerald-950/40 p-2.5 rounded-2xl backdrop-blur-sm border border-emerald-600/30">
            <div className="text-center px-2 py-1">
              <span className="block text-[11px] text-emerald-300 font-medium">{t('totalDelivered')}</span>
              <span className="text-lg sm:text-2xl font-black text-white">{totalLitresDelivered.toFixed(1)} <span className="text-xs font-normal">L</span></span>
            </div>
            <div className="text-center px-2 py-1 border-x border-emerald-700/50">
              <span className="block text-[11px] text-amber-300 font-medium">{t('totalRemaining')}</span>
              <span className="text-lg sm:text-2xl font-black text-amber-200">{totalLitresPending.toFixed(1)} <span className="text-xs font-normal">L</span></span>
            </div>
            <div className="text-center px-2 py-1">
              <span className="block text-[11px] text-slate-300 font-medium">{t('totalDemand')}</span>
              <span className="text-lg sm:text-2xl font-black text-emerald-100">{totalShiftDemand.toFixed(1)} <span className="text-xs font-normal">L</span></span>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4 w-full bg-emerald-950/60 rounded-full h-2.5 overflow-hidden p-0.5">
          <div 
            className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${(completedHouses / (totalHouses || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* Control Bar: Filters, Search, 1-Click All Done */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('searchCustomer')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
          />
          <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-slate-200/70 p-1 rounded-2xl">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'ALL' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('all')} ({totalHouses})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'PENDING' ? 'bg-amber-400 text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('pending')} ({pendingHouses})
          </button>
          <button
            onClick={() => setFilter('DONE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              filter === 'DONE' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t('completed')} ({completedHouses + skippedHouses})
          </button>
        </div>

        {/* 1-Click Mark All */}
        {pendingHouses > 0 && (
          <button
            onClick={handleMarkAllPendingDone}
            className="flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200 transition active:scale-95"
          >
            <CheckCheck className="w-4 h-4" />
            <span>{t('markAllDone')}</span>
          </button>
        )}
      </div>

      {/* House-by-House Route Cards */}
      <div className="space-y-3">
        {filteredList.map((item, idx) => {
          const isDelivered = item.status === 'DELIVERED';
          const isSkipped = item.status === 'SKIPPED';
          const isPending = item.status === 'PENDING';

          return (
            <div
              key={item.customer.id}
              className={`rounded-2xl border p-4 transition-all duration-200 pressable-card ${
                isDelivered
                  ? 'bg-emerald-50/70 border-emerald-200/80 shadow-sm'
                  : isSkipped
                  ? 'bg-slate-100/80 border-slate-200 opacity-70'
                  : 'bg-white border-slate-200 shadow hover:shadow-md'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                
                {/* Left: Route Order, House Number & Customer Name */}
                <div className="flex items-start space-x-3.5">
                  <div className="flex flex-col items-center justify-center">
                    <span className="w-9 h-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shadow-sm">
                      #{item.customer.routeOrder || idx + 1}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{t('route')}</span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t('door')}: {item.customer.houseNo}
                      </span>
                      <h3 className="font-extrabold text-base text-slate-900">
                        {item.customer.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-500 font-medium flex items-center mt-0.5">
                      <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                      {item.customer.street}
                    </p>

                    {item.customer.notes && (
                      <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 inline-block px-2 py-0.5 rounded-md mt-1 border border-amber-200">
                        📌 {item.customer.notes}
                      </p>
                    )}

                    {item.note && (
                      <p className="text-[11px] font-bold text-emerald-700 mt-0.5">
                        ✓ {item.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Litres Demand & Fast Action Buttons */}
                <div className="flex items-center justify-between sm:justify-end space-x-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  
                  {/* Litres Badge */}
                  <div className="text-left sm:text-right mr-1">
                    <div className="flex items-baseline space-x-1 sm:justify-end">
                      <span className="text-xl sm:text-2xl font-black text-slate-900">
                        {isDelivered ? item.litres : item.defaultQty}
                      </span>
                      <span className="text-xs font-bold text-slate-500">{t('litres')}</span>
                    </div>

                    {isDelivered && item.deliveredTime && (
                      <span className="text-[10px] font-semibold text-emerald-700 flex items-center sm:justify-end">
                        <Clock className="w-3 h-3 mr-0.5" /> {item.deliveredTime}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1.5">
                    
                    {/* Call Customer */}
                    <a
                      href={`tel:${item.customer.phone}`}
                      className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 transition"
                      title="Call Customer"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>

                    {isPending ? (
                      <>
                        {/* 1-Tap Delivered Button */}
                        <button
                          id={idx === 0 ? "tour-mark-delivered" : undefined}
                          onClick={() => handleMarkDelivered(item, 0)}
                          className="flex items-center space-x-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition active:scale-95"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{t('markDelivered')}</span>
                        </button>

                        {/* Extra Milk Button */}
                        <button
                          id={idx === 0 ? "tour-extra-milk" : undefined}
                          onClick={() => handleOpenExtraModal(item)}
                          className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs border border-amber-200 transition"
                          title={t('addExtraMilk')}
                        >
                          <PlusCircle className="w-4 h-4 text-amber-700" />
                        </button>

                        {/* Skip / Leave Button */}
                        <button
                          id={idx === 0 ? "tour-skip-leave" : undefined}
                          onClick={() => handleMarkSkipped(item)}
                          className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs transition"
                          title={t('markSkipped')}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center space-x-1.5">
                        <span className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center ${
                          isDelivered 
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-300 text-slate-700'
                        }`}>
                          {isDelivered ? t('markedDone') : t('markedSkipped')}
                        </span>
                        
                        {/* Revert / Edit button */}
                        <button
                          onClick={() => handleReset(item)}
                          className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
                          title="Change status back to pending"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
            <span className="text-4xl">🎉</span>
            <h4 className="font-extrabold text-slate-800 text-lg mt-2">{t('allDone')}</h4>
            <p className="text-xs text-slate-500 mt-1">{t('allDeliveredSubtitle')}</p>
          </div>
        )}
      </div>

      {/* Quick Modal: Add Extra Milk on Spot */}
      {activeModalCust && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-slate-900 text-base">
                {t('addExtraMilkTitle')}
              </h3>
              <button 
                onClick={() => setActiveModalCust(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 font-medium">
              {t('customerLabel')} <strong className="text-slate-900">{activeModalCust.customer.name}</strong> ({t('door')}: {activeModalCust.customer.houseNo})
            </p>

            {/* Extra Milk Presets with L / ml Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  {t('howMuchExtra')}
                </label>
                {/* L / ml Toggle Pills */}
                <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleUnitChange('L')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition ${
                      extraUnit === 'L'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    L
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUnitChange('ML')}
                    className={`px-2.5 py-0.5 rounded-lg text-xs font-black transition ${
                      extraUnit === 'ML'
                        ? 'bg-amber-400 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ml
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-1.5">
                {(extraUnit === 'ML'
                  ? [
                      { label: '+250ml', litres: 0.25, val: 250 },
                      { label: '+500ml', litres: 0.5, val: 500 },
                      { label: '+600ml', litres: 0.6, val: 600 },
                      { label: '+750ml', litres: 0.75, val: 750 },
                      { label: '+1000ml', litres: 1.0, val: 1000 },
                    ]
                  : [
                      { label: '+0.5L', litres: 0.5, val: 0.5 },
                      { label: '+1L', litres: 1.0, val: 1.0 },
                      { label: '+1.5L', litres: 1.5, val: 1.5 },
                      { label: '+2L', litres: 2.0, val: 2.0 },
                      { label: '+3L', litres: 3.0, val: 3.0 },
                    ]
                ).map(item => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleSelectPreset(item.litres, item.val)}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      customExtraQty === item.litres
                        ? 'bg-amber-400 border-amber-500 text-slate-900 shadow-md ring-2 ring-amber-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Custom Input Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-600 block">
                  {t('orManualExtra')}
                </label>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md font-black border border-amber-200">
                  ✍️ {lang === 'ta' ? 'நேரடி உள்ளீடு' : 'Manual Entry'} ({extraUnit === 'ML' ? 'ml' : 'L'})
                </span>
              </div>

              {/* Enterprise Segmented Input Group with L / ml Toggle */}
              <div className="flex items-center rounded-2xl border-2 border-slate-200 bg-white shadow-sm overflow-hidden focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 transition">
                {/* Step Minus */}
                <button
                  type="button"
                  onClick={() => handleStepQty(-1)}
                  className="w-11 h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-black text-xl border-r border-slate-200 flex items-center justify-center transition select-none flex-shrink-0"
                  title={extraUnit === 'ML' ? "-100ml" : "-0.5L"}
                >
                  −
                </button>

                {/* Number Input (browser spinner disabled, clean standard placeholder) */}
                <input
                  type="number"
                  step={extraUnit === 'ML' ? "50" : "0.1"}
                  min="0"
                  max={extraUnit === 'ML' ? "50000" : "50"}
                  value={extraInputText}
                  onChange={(e) => handleManualExtraChange(e.target.value)}
                  placeholder={extraUnit === 'ML' ? t('placeholderMl') : t('placeholderLitres')}
                  className="w-full h-12 text-center font-black text-slate-900 text-lg bg-transparent outline-none px-2 placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm placeholder:font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />

                {/* Interactive L / ml Toggle Addon */}
                <div className="flex items-center p-1 bg-slate-100/90 border-l border-slate-200 flex-shrink-0">
                  <div className="inline-flex rounded-xl bg-white p-0.5 border border-slate-200/80 shadow-inner">
                    <button
                      type="button"
                      onClick={() => handleUnitChange('L')}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                        extraUnit === 'L'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      L
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnitChange('ML')}
                      className={`px-2 py-1 rounded-lg text-xs font-black transition ${
                        extraUnit === 'ML'
                          ? 'bg-amber-400 text-slate-950 shadow-sm'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      ml
                    </button>
                  </div>
                </div>

                {/* Step Plus */}
                <button
                  type="button"
                  onClick={() => handleStepQty(+1)}
                  className="w-11 h-12 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-700 font-black text-xl border-l border-slate-200 flex items-center justify-center transition select-none flex-shrink-0"
                  title={extraUnit === 'ML' ? "+100ml" : "+0.5L"}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Calculation Display */}
            {(() => {
              const defaultQty = activeModalCust.defaultQty || 0;
              const extraQty = customExtraQty > 0 ? customExtraQty : 0;
              const total = Math.round((defaultQty + extraQty) * 100) / 100;
              const isValid = customExtraQty > 0;

              return (
                <div className={`rounded-2xl p-3 border transition ${
                  isValid 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950' 
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">{t('totalMilk')}</span>
                    <span className="text-lg font-black text-emerald-800">
                      {isValid ? `${total} ${t('litres')}` : '0 L'}
                    </span>
                  </div>

                  {isValid ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600 mt-1.5 border-t border-emerald-200/60 pt-1.5">
                      <span>{t('regularMilkShort')}: <strong>{defaultQty}L</strong></span>
                      <span>+</span>
                      <span className="text-amber-800 font-bold">
                        {t('extraMilkShort')}: <strong>{extraUnit === 'ML' ? `${Math.round(extraQty * 1000)} ml (${extraQty}L)` : `${extraQty}L`}</strong>
                      </span>
                      <span>=</span>
                      <strong className="text-emerald-800 font-black">{total} {t('litres')}</strong>
                    </div>
                  ) : (
                    <p className="text-[11px] font-bold text-rose-600 mt-1">
                      ⚠️ {lang === 'ta' ? 'சரியான அளவை உள்ளிடவும் (0-க்கு மேல்)' : 'Please enter a valid amount (> 0)'}
                    </p>
                  )}
                </div>
              );
            })()}

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalCust(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={!(customExtraQty > 0)}
                onClick={() => {
                  if (customExtraQty > 0) {
                    handleMarkDelivered(activeModalCust, customExtraQty);
                    setActiveModalCust(null);
                  }
                }}
                className={`w-1/2 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition flex items-center justify-center space-x-1 ${
                  customExtraQty > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200 active:scale-98 cursor-pointer'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                <span>{t('confirmBtn')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Requests Modal (Extra Milk + Leave Requests) */}
      <VendorRequestsModal
        isOpen={isRequestsModalOpen}
        onClose={() => setIsRequestsModalOpen(false)}
        requests={extraRequests}
        leaveRequests={leaveRequests}
        onActionComplete={() => {
          loadRequests();
          loadData();
        }}
      />

    </div>
  );
}
