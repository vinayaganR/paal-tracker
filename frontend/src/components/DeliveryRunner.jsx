import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import { 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  PhoneCall, 
  Clock, 
  MapPin, 
  CheckCheck, 
  RotateCcw
} from 'lucide-react';

export default function DeliveryRunner({ selectedDate, selectedShift }) {
  const { t, lang } = useLanguage();
  const [sheet, setSheet] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'DONE'
  const [search, setSearch] = useState('');
  const [activeModalCust, setActiveModalCust] = useState(null);
  const [customExtraQty, setCustomExtraQty] = useState(0.5);

  const loadData = () => {
    const data = dairyService.getDailyDeliverySheet(selectedDate, selectedShift);
    setSheet(data);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedShift]);

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
                          onClick={() => setActiveModalCust(item)}
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

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                {t('howMuchExtra')}
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[0.5, 1.0, 1.5, 2.0].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCustomExtraQty(amt)}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      customExtraQty === amt
                        ? 'bg-amber-400 border-amber-500 text-slate-900 shadow'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    +{amt} L
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200 text-xs text-emerald-900">
              {t('totalMilk')} <strong>{(activeModalCust.defaultQty || 0) + customExtraQty} {t('litres')}</strong>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveModalCust(null)}
                className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMarkDelivered(activeModalCust, customExtraQty);
                  setActiveModalCust(null);
                }}
                className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200"
              >
                {t('confirmBtn')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
