import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import { 
  Bell, 
  Check, 
  X, 
  Phone, 
  Calendar, 
  Sun, 
  Moon, 
  Clock,
  PauseCircle,
  PlusCircle,
  CalendarDays
} from 'lucide-react';

export default function VendorRequestsModal({ 
  isOpen, 
  onClose, 
  requests = [], 
  leaveRequests = [], 
  onActionComplete 
}) {
  const { t, lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState('ALL_PENDING'); // 'ALL_PENDING' | 'EXTRA' | 'LEAVE'
  const [loadingId, setLoadingId] = useState(null);

  if (!isOpen) return null;

  // Extra Milk Accept / Reject
  const handleAcceptExtra = async (req) => {
    setLoadingId(req.id);
    const note = lang === 'ta' 
      ? 'பால் உள்ளது! விநியோகம் செய்யப்படும் (Milk available, will deliver)' 
      : 'Milk is available! Extra milk will be delivered.';
    await dairyService.respondToExtraMilkRequest(req.id, 'ACCEPTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  const handleRejectExtra = async (req) => {
    setLoadingId(req.id);
    const note = lang === 'ta' 
      ? 'மன்னிக்கவும்! கூடுதல் பால் இருப்பு இல்லை (Sorry, extra milk not available)' 
      : 'Sorry, extra milk is not available for this shift.';
    await dairyService.respondToExtraMilkRequest(req.id, 'REJECTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  // Leave Accept / Reject
  const handleAcceptLeave = async (leave) => {
    setLoadingId(leave.id);
    const note = lang === 'ta' 
      ? 'சரி! லீவு குறிக்கப்பட்டது. பால் விநியோகம் நிறுத்தப்படும் (Leave noted! Milk delivery paused)' 
      : 'Leave confirmed! Milk delivery paused for requested shifts.';
    await dairyService.respondToLeaveRequest(leave.id, 'ACCEPTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  const handleRejectLeave = async (leave) => {
    setLoadingId(leave.id);
    const note = lang === 'ta' 
      ? 'மன்னிக்கவும்! லீவு ஏற்கப்படவில்லை (Sorry, cannot pause delivery at this time)' 
      : 'Sorry, leave request could not be accepted at this time.';
    await dairyService.respondToLeaveRequest(leave.id, 'REJECTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  const pendingExtras = requests.filter(r => r.status === 'PENDING');
  const pendingLeaves = leaveRequests.filter(l => l.status === 'PENDING');
  const totalPending = pendingExtras.length + pendingLeaves.length;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                {lang === 'ta' ? 'வாடிக்கையாளர் கோரிக்கைகள்' : 'Customer Requests & Leave'}
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                {totalPending > 0 
                  ? `${totalPending} ${t('pendingRequests')}` 
                  : t('noPendingRequests')}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex border-b border-slate-200 px-3 pt-3 bg-slate-50 gap-1.5 overflow-x-auto no-scrollbar">
          {/* All Pending Tab */}
          <button
            onClick={() => setActiveCategory('ALL_PENDING')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeCategory === 'ALL_PENDING'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{t('pendingRequests')}</span>
            {totalPending > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
                {totalPending}
              </span>
            )}
          </button>

          {/* Extra Milk Tab */}
          <button
            onClick={() => setActiveCategory('EXTRA')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeCategory === 'EXTRA'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>{lang === 'ta' ? 'கூடுதல் பால்' : 'Extra Milk'}</span>
            {pendingExtras.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-600 text-white font-black">
                {pendingExtras.length}
              </span>
            )}
          </button>

          {/* Leave / Vacation Tab */}
          <button
            onClick={() => setActiveCategory('LEAVE')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeCategory === 'LEAVE'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PauseCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>{t('leaveRequestsTitle')}</span>
            {pendingLeaves.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-slate-900 font-black">
                {pendingLeaves.length}
              </span>
            )}
          </button>
        </div>

        {/* Requests Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          
          {/* EMPTY STATE */}
          {((activeCategory === 'ALL_PENDING' && totalPending === 0) ||
            (activeCategory === 'EXTRA' && requests.length === 0) ||
            (activeCategory === 'LEAVE' && leaveRequests.length === 0)) && (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                🥛
              </div>
              <p className="text-slate-700 font-extrabold text-sm">
                {t('noPendingRequests')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ta' 
                  ? 'வாடிக்கையாளர்கள் கூடுதல் பால் அல்லது லீவு பதிவு செய்தால் இங்கு வரும்.'
                  : 'Customer requests for extra milk or leave will appear here.'}
              </p>
            </div>
          )}

          {/* ==================== 1. EXTRA MILK REQUESTS ==================== */}
          {(activeCategory === 'ALL_PENDING' || activeCategory === 'EXTRA') && (
            (activeCategory === 'ALL_PENDING' ? pendingExtras : requests).map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div 
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending 
                      ? 'bg-blue-50/70 border-blue-300 shadow-sm ring-1 ring-blue-200' 
                      : isAccepted 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-blue-100 text-blue-800 border border-blue-200">
                          +{req.extraLitres}L {t('extra')}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {req.customerName}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500 font-bold">
                          {t('door')}: {req.houseNo}
                        </span>
                        {req.phone && (
                          <a 
                            href={`tel:${req.phone}`}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold hover:underline"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{req.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-sm animate-pulse">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('statusPending')}
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                          <Check className="w-3 h-3 mr-1" />
                          {t('statusAccepted')}
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                          <X className="w-3 h-3 mr-1" />
                          {t('statusRejected')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Details Line */}
                  <div className="mt-3 p-2.5 rounded-xl bg-white/90 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{t('date')}</span>
                      <span className="font-extrabold text-slate-800 flex items-center mt-0.5">
                        <Calendar className="w-3 h-3 mr-1 text-emerald-600" />
                        {req.date}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">{t('shift')}</span>
                      <span className="font-extrabold text-slate-800 flex items-center mt-0.5">
                        {req.shift === 'MORNING' ? (
                          <>
                            <Sun className="w-3 h-3 mr-1 text-amber-500" />
                            {t('morning')}
                          </>
                        ) : (
                          <>
                            <Moon className="w-3 h-3 mr-1 text-indigo-500" />
                            {t('evening')}
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {req.reason && (
                    <p className="mt-2 text-xs text-slate-600 font-medium">
                      📌 <span className="font-semibold text-slate-700">{t('reason')}:</span> {req.reason}
                    </p>
                  )}

                  {/* Actions for PENDING */}
                  {isPending && (
                    <div className="mt-3 pt-3 border-t border-blue-200/80 flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={loadingId === req.id}
                        onClick={() => handleAcceptExtra(req)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow transition"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t('acceptRequest')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingId === req.id}
                        onClick={() => handleRejectExtra(req)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center space-x-1.5 border border-rose-200 transition"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t('rejectRequest')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* ==================== 2. LEAVE / VACATION REQUESTS ==================== */}
          {(activeCategory === 'ALL_PENDING' || activeCategory === 'LEAVE') && (
            (activeCategory === 'ALL_PENDING' ? pendingLeaves : leaveRequests).map((leave) => {
              const isPending = leave.status === 'PENDING';
              const isAccepted = leave.status === 'ACCEPTED';
              const isRejected = leave.status === 'REJECTED';

              const shiftBadge = 
                leave.shift === 'MORNING' ? t('shiftMorningOnly') :
                leave.shift === 'EVENING' ? t('shiftEveningOnly') : t('shiftBoth');

              return (
                <div 
                  key={leave.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending 
                      ? 'bg-amber-50/80 border-amber-300 shadow-sm ring-1 ring-amber-300' 
                      : isAccepted 
                        ? 'bg-emerald-50/50 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-amber-400 text-slate-900 shadow-2xs">
                          🏖️ {t('pauseDelivery')}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {leave.customerName}
                        </h4>
                      </div>

                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-slate-500 font-bold">
                          {t('door')}: {leave.houseNo}
                        </span>
                        {leave.phone && (
                          <a 
                            href={`tel:${leave.phone}`}
                            className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold hover:underline"
                          >
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{leave.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex-shrink-0">
                      {isPending && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-400 text-slate-900 shadow-sm animate-pulse">
                          <Clock className="w-3 h-3 mr-1" />
                          {t('statusPending')}
                        </span>
                      )}
                      {isAccepted && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-600 text-white shadow-sm">
                          <Check className="w-3 h-3 mr-1" />
                          {t('statusAccepted')}
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm">
                          <X className="w-3 h-3 mr-1" />
                          {t('statusRejected')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Leave Shift & Dates Banner */}
                  <div className="mt-3 p-3 rounded-xl bg-white/90 border border-slate-200/90 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">{t('leaveShiftLabel')}:</span>
                      <span className="font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-lg border border-amber-200">
                        {leave.shift === 'MORNING' && '☀️ '}
                        {leave.shift === 'EVENING' && '🌙 '}
                        {leave.shift === 'BOTH' && '☀️🌙 '}
                        {shiftBadge}
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-slate-500 font-bold">{t('date')}:</span>
                      <span className="font-black text-slate-800 flex items-center">
                        <CalendarDays className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                        {leave.fromDate === leave.toDate ? leave.fromDate : `${leave.fromDate} ➡️ ${leave.toDate}`}
                      </span>
                    </div>
                  </div>

                  {leave.reason && (
                    <p className="mt-2 text-xs text-slate-600 font-medium">
                      📌 <span className="font-semibold text-slate-700">{t('reason')}:</span> {leave.reason}
                    </p>
                  )}

                  {/* Actions for PENDING Leave */}
                  {isPending && (
                    <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex items-center space-x-2">
                      <button
                        type="button"
                        disabled={loadingId === leave.id}
                        onClick={() => handleAcceptLeave(leave)}
                        className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center space-x-1.5 shadow transition"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t('acceptLeave')}</span>
                      </button>

                      <button
                        type="button"
                        disabled={loadingId === leave.id}
                        onClick={() => handleRejectLeave(leave)}
                        className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 font-black text-xs flex items-center justify-center space-x-1.5 border border-rose-200 transition"
                      >
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                        <span>{t('rejectLeave')}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-100 border-t border-slate-200 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            {t('cancel')}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
