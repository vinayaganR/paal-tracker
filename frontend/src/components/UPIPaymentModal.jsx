import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  QrCode, 
  Smartphone, 
  Copy, 
  X
} from 'lucide-react';

export default function UPIPaymentModal({ customer, amount, monthStr, dairyInfo, onClose, onPaymentSuccess }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const cleanUpi = dairyInfo?.upiId || 'dairyfarm@okaxis';
  const farmName = dairyInfo?.farmName || 'Sri Kamadhenu Dairy Farm';
  const upiUrl = `upi://pay?pa=${cleanUpi}&pn=${encodeURIComponent(farmName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Milk Bill ${monthStr} - ${customer?.name}`)}`;
  
  // Real working QR Code Generator URL
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(cleanUpi);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
            <QrCode className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {t('scanUpiPay')}
          </h3>
          <p className="text-xs text-slate-500 font-medium">
            {customer?.name} ({customer?.houseNo})
          </p>
        </div>

        {/* Big Amount Badge */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 block uppercase">{t('billAmount')}</span>
          <span className="text-3xl font-black text-emerald-700 block">
            ₹{amount}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {t('billMonth')}: {monthStr}
          </span>
        </div>

        {/* Real Dynamic QR Code image */}
        <div className="bg-white p-3 rounded-2xl border-2 border-emerald-500/30 inline-block shadow-inner">
          <img 
            src={qrCodeUrl} 
            alt="UPI QR Code" 
            className="w-48 h-48 mx-auto rounded-lg object-contain"
          />
          <p className="text-[10px] text-slate-400 font-semibold mt-1">
            Google Pay • PhonePe • Paytm • BHIM
          </p>
        </div>

        {/* UPI ID Copy row */}
        <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3 py-2 text-xs">
          <span className="font-mono font-bold text-slate-800 text-[11px] truncate">
            {cleanUpi}
          </span>
          <button
            onClick={handleCopyUpi}
            className="flex items-center space-x-1 text-emerald-700 font-bold hover:text-emerald-800 ml-2 flex-shrink-0"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>{copied ? t('copied') : t('copy')}</span>
          </button>
        </div>

        {/* Direct UPI App intent button for Mobile */}
        <a
          href={upiUrl}
          className="flex items-center justify-center space-x-2 w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition"
        >
          <Smartphone className="w-4 h-4" />
          <span>{t('payNowMobile')}</span>
        </a>

        {/* Mark as paid button */}
        {onPaymentSuccess && (
          <button
            onClick={onPaymentSuccess}
            className="w-full py-2.5 rounded-xl border border-emerald-300 text-emerald-800 font-bold text-xs hover:bg-emerald-50 transition"
          >
            {t('markPaidSuccess')}
          </button>
        )}

      </div>
    </div>
  );
}
