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
  Sparkles, 
  AlertCircle,
  Clock
} from 'lucide-react';

export default function VendorRequestsModal({ isOpen, onClose, requests, onActionComplete }) {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState('PENDING'); // 'PENDING' | 'ALL'
  const [loadingId, setLoadingId] = useState(null);

  if (!isOpen) return null;

  const handleAccept = async (req) => {
    setLoadingId(req.id);
    const note = lang === 'ta' 
      ? 'பால் உள்ளது! விநியோகம் செய்யப்படும் (Milk available, will deliver)' 
      : 'Milk is available! Extra milk will be delivered.';
    await dairyService.respondToExtraMilkRequest(req.id, 'ACCEPTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  const handleReject = async (req) => {
    setLoadingId(req.id);
    const note = lang === 'ta' 
      ? 'மன்னிக்கவும்! கூடுதல் பால் இருப்பு இல்லை (Sorry, extra milk not available)' 
      : 'Sorry, extra milk is not available for this shift.';
    await dairyService.respondToExtraMilkRequest(req.id, 'REJECTED', note);
    setLoadingId(null);
    if (onActionComplete) onActionComplete();
  };

  const pendingList = requests.filter(r => r.status === 'PENDING');
  const displayList = filter === 'PENDING' ? pendingList : requests;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center">
              <Bell className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="font-extrabold text-base sm:text-lg leading-tight">
                {t('extraRequestsTitle')}
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                {pendingList.length > 0 
                  ? `${pendingList.length} ${t('pendingRequests')}` 
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
        <div className="flex border-b border-slate-200 px-4 pt-3 bg-slate-50 gap-2">
          <button
            onClick={() => setFilter('PENDING')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition flex items-center space-x-1.5 ${
              filter === 'PENDING'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{t('pendingRequests')}</span>
            {pendingList.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-black">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter('ALL')}
            className={`pb-2.5 px-3 text-xs font-black border-b-2 transition flex items-center space-x-1.5 ${
              filter === 'ALL'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>{lang === 'ta' ? 'அனைத்தும்' : 'All Requests'}</span>
            <span className="text-[10px] text-slate-400 font-bold">({requests.length})</span>
          </button>
        </div>

        {/* Request Cards List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {displayList.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                🥛
              </div>
              <p className="text-slate-700 font-extrabold text-sm">
                {t('noPendingRequests')}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {lang === 'ta' 
                  ? 'வாடிக்கையாளர்கள் கூடுதல் பால் கேட்டால் இங்கு நோட்டிபிகேஷன் வரும்.'
                  : 'Customer extra milk requests will appear here in real time.'}
              </p>
            </div>
          ) : (
            displayList.map((req) => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div 
                  key={req.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isPending 
                      ? 'bg-amber-50/60 border-amber-300/80 shadow-sm ring-1 ring-amber-200' 
                      : isAccepted 
                        ? 'bg-emerald-50/40 border-emerald-200' 
                        : 'bg-slate-50 border-slate-200 opacity-75'
                  }`}
                >
                  {/* Top line: Customer name, house no & status badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-lg text-xs font-black bg-white border border-slate-200 text-slate-800 shadow-2xs">
                          {t('door')}: {req.houseNo}
                        </span>
                        <h4 className="font-extrabold text-slate-900 text-sm sm:text-base">
                          {req.customerName}
                        </h4>
                      </div>

                      {req.phone && (
                        <a 
                          href={`tel:${req.phone}`}
                          className="inline-flex items-center space-x-1 text-xs text-emerald-700 font-bold mt-1 hover:underline"
                        >
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>{req.phone}</span>
                        </a>
                      )}
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

                  {/* Request Details Banner */}
                  <div className="mt-3 p-3 rounded-xl bg-white/90 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
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

                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-slate-400 font-bold block">{t('quantityLabel')}</span>
                      <span className="font-black text-blue-700 text-sm mt-0.5 block">
                        +{req.extraLitres} Litres
                      </span>
                    </div>
                  </div>

                  {/* Reason note */}
                  {req.reason && (
                    <p className="mt-2 text-xs text-slate-600 font-medium">
                      📌 <span className="font-semibold text-slate-700">{t('reason')}:</span> {req.reason}
                    </p>
                  )}

                  {/* Vendor note if responded */}
                  {req.vendorNote && (
                    <div className="mt-2 text-xs p-2 rounded-lg bg-slate-100 text-slate-700 font-medium border border-slate-200">
                      💬 <span className="font-bold">{lang === 'ta' ? 'பண்ணை பதில்' : 'Farm response'}:</span> {req.vendorNote}
                    </div>
                  )}

                  {/* Actions for PENDING request */}
                  {isPending && (
                    <div className="mt-3.5 pt-3 border-t border-amber-200/80 flex items-center space-x-2">
                      {/* Accept Button */}
                      <button
                        type="button"
                        disabled={loadingId === req.id}
                        onClick={() => handleAccept(req)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 transition"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>{t('acceptRequest')}</span>
                      </button>

                      {/* Reject Button */}
                      <button
                        type="button"
                        disabled={loadingId === req.id}
                        onClick={() => handleReject(req)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-white hover:bg-rose-50 text-rose-600 active:scale-98 font-black text-xs sm:text-sm flex items-center justify-center space-x-1.5 border border-rose-200 transition"
                      >
                        <X className="w-4 h-4 stroke-[3]" />
                        <span>{t('rejectRequest')}</span>
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
