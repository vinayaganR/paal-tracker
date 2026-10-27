import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { dairyService } from '../services/dairyService';
import { 
  Receipt, 
  Share2, 
  QrCode, 
  Calendar, 
  CreditCard,
  FileText,
  Download,
  Building2,
  Eye
} from 'lucide-react';
import UPIPaymentModal from './UPIPaymentModal';
import FarmReportModal from './FarmReportModal';
import CustomerBillModal from './CustomerBillModal';

export default function BillingLedger() {
  const { t, lang } = useLanguage();
  const { dairyInfo } = useAuth();
  
  // Current month 'YYYY-MM'
  const currentMonthStr = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [ledgerData, setLedgerData] = useState([]);
  const [qrModalItem, setQrModalItem] = useState(null);
  const [paymentInputItem, setPaymentInputItem] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [showFarmReportModal, setShowFarmReportModal] = useState(false);
  const [activeCustBill, setActiveCustBill] = useState(null);

  const loadLedger = async () => {
    try {
      await dairyService.syncDeliveries(selectedMonth);
    } catch (e) {}
    const data = dairyService.getMonthLedger(selectedMonth);
    setLedgerData(data);
  };

  useEffect(() => {
    loadLedger();
  }, [selectedMonth]);

  // Aggregate metrics
  const totalLitres = ledgerData.reduce((sum, item) => sum + item.totalLitres, 0);
  const totalBill = ledgerData.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalPaid = ledgerData.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalPending = ledgerData.reduce((sum, item) => sum + item.balanceDue, 0);

  // Send WhatsApp Invoicing
  const handleSendWhatsApp = (item) => {
    const monthName = new Date(`${selectedMonth}-01`).toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' });
    
    const message = lang === 'ta'
      ? `வணக்கம் *${item.customer.name}* அவர்களுக்கு,
*${dairyInfo.farmName}* - ${monthName} மாதாந்திர பால் கணக்கு:
--------------------------------
🥛 விநியோகம் செய்த நாட்கள்: ${item.deliveredDays} நாட்கள்
⏸️ விடுப்பு (வாங்காத நாட்கள்): ${item.skippedDays} நாட்கள்
🍶 மொத்த பால் அளவு: *${item.totalLitres} லிட்டர்*
🏷️ லிட்டர் விலை: ₹${item.rate}
💰 மொத்த கட்டணம்: *₹${item.totalAmount}*
✅ செலுத்தியது: ₹${item.paidAmount}
⚠️ *பாக்கி தொகை: ₹${item.balanceDue}*
--------------------------------
UPI ID: *${dairyInfo.upiId}* (Google Pay / PhonePe / Paytm)
நன்றி! வாழ்க வளமுடன்!`
      : `Dear *${item.customer.name}*,
*${dairyInfo.farmName}* - Monthly Milk Bill for ${monthName}:
--------------------------------
🥛 Delivered Days: ${item.deliveredDays} days
⏸️ Skipped / Leave: ${item.skippedDays} days
🍶 Total Milk: *${item.totalLitres} Litres*
🏷️ Rate / Litre: ₹${item.rate}
💰 Total Bill: *₹${item.totalAmount}*
✅ Paid: ₹${item.paidAmount}
⚠️ *Balance Due: ₹${item.balanceDue}*
--------------------------------
Pay via UPI: *${dairyInfo.upiId}* (Google Pay / PhonePe / Paytm)
Thank you!`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = item.customer.phone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  // Record payment
  const handleSavePayment = (e) => {
    e.preventDefault();
    if (!paymentInputItem || !payAmount) return;
    dairyService.recordPayment(selectedMonth, paymentInputItem.customer.id, payAmount);
    setPaymentInputItem(null);
    setPayAmount('');
    loadLedger();
  };

  return (
    <div className="space-y-6">
      
      {/* Month Selector & Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-7 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700 pb-5">
          <div>
            <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              <Receipt className="w-4 h-4" />
              <span>{t('billing')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              {t('monthlyCollectionLedger')}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {t('whatsappUpiSubtitle')}
            </p>
          </div>

          {/* Master Farm Report & Month Picker */}
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => setShowFarmReportModal(true)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-400 hover:to-green-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-900/30 transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>{t('masterFarmReport')}</span>
            </button>

            {/* Month Picker */}
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3 py-2 rounded-2xl">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Aggregate KPI Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5">
          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold block">{t('totalMilkVolume')}</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {totalLitres.toFixed(1)} <span className="text-xs font-normal">L</span>
            </span>
          </div>

          <div className="bg-slate-800/50 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] text-slate-400 font-semibold block">{t('totalBillAmount')}</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              ₹{totalBill.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-700/50">
            <span className="text-[11px] text-emerald-300 font-semibold block">{t('collectedAmount')}</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-400 mt-1 block">
              ₹{totalPaid.toLocaleString()}
            </span>
          </div>

          <div className="bg-rose-950/40 p-3.5 rounded-2xl border border-rose-700/50">
            <span className="text-[11px] text-rose-300 font-semibold block">{t('outstandingAmount')}</span>
            <span className="text-xl sm:text-2xl font-black text-rose-300 mt-1 block">
              ₹{totalPending.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Ledger List */}
      <div className="space-y-3">
        {ledgerData.map((item) => {
          return (
            <div
              key={item.customer.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left: Customer Info */}
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                    #{item.customer.routeOrder}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded-md text-xs font-black bg-slate-100 text-slate-700">
                        {item.customer.houseNo}
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900">
                        {item.customer.name}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.customer.street} • Tel: {item.customer.phone}
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 mt-1">
                      {t('deliveredDaysLabel')} <strong className="text-emerald-700">{item.deliveredDays} {t('days')}</strong> ({item.totalLitres} L) • 
                      {t('leaveDaysLabel')} <strong className="text-slate-500">{item.skippedDays} {t('days')}</strong>
                    </p>
                  </div>
                </div>

                {/* Right: Amounts & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* Amount Breakdown */}
                  <div className="text-left lg:text-right mr-2">
                    <span className="text-[10px] text-slate-400 block font-semibold">{t('billAmount')}</span>
                    <span className="text-lg font-black text-slate-900 block">
                      ₹{item.totalAmount}
                    </span>
                    {item.balanceDue > 0 ? (
                      <span className="text-xs font-extrabold text-rose-600">
                        {t('balanceDueLabel')} ₹{item.balanceDue}
                      </span>
                    ) : (
                      <span className="text-xs font-extrabold text-emerald-600">
                        {t('fullyPaid')}
                      </span>
                    )}
                  </div>

                  {/* View Individual Bill & Report Button */}
                  <button
                    onClick={() => setActiveCustBill(item.customer)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-800 hover:text-emerald-800 border border-slate-200 text-xs font-bold transition shadow-sm"
                    title={t('viewCustomerBill')}
                  >
                    <FileText className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('viewCustomerBill')}</span>
                  </button>

                  {/* WhatsApp Invoicing Button */}
                  <button
                    onClick={() => handleSendWhatsApp(item)}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition shadow-sm"
                    title={t('sendWhatsApp')}
                  >
                    <Share2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('whatsappBillBtn')}</span>
                  </button>

                  {/* UPI QR Code Modal Trigger */}
                  <button
                    onClick={() => setQrModalItem(item)}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-sm"
                    title={t('scanUpiPay')}
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                    <span>UPI QR</span>
                  </button>

                  {/* Record Payment Button */}
                  <button
                    onClick={() => {
                      setPaymentInputItem(item);
                      setPayAmount(String(item.balanceDue));
                    }}
                    className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 text-xs font-black transition shadow-sm"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{t('recordPaymentBtn')}</span>
                  </button>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* UPI QR Payment Modal */}
      {qrModalItem && (
        <UPIPaymentModal
          customer={qrModalItem.customer}
          amount={qrModalItem.balanceDue > 0 ? qrModalItem.balanceDue : qrModalItem.totalAmount}
          monthStr={selectedMonth}
          dairyInfo={dairyInfo}
          onClose={() => setQrModalItem(null)}
          onPaymentSuccess={() => {
            dairyService.recordPayment(selectedMonth, qrModalItem.customer.id, qrModalItem.balanceDue);
            setQrModalItem(null);
            loadLedger();
          }}
        />
      )}

      {/* Record Payment Dialog */}
      {paymentInputItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {t('recordPaymentTitle')}
              </h3>
              <button 
                onClick={() => setPaymentInputItem(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              {t('customerLabel')} <strong className="text-slate-900">{paymentInputItem.customer.name}</strong><br />
              {t('totalBillAmount')}: ₹{paymentInputItem.totalAmount} | {t('balanceDueLabel')} <strong className="text-rose-600">₹{paymentInputItem.balanceDue}</strong>
            </p>

            <form onSubmit={handleSavePayment} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('paidAmountLabel')}
                </label>
                <input
                  type="number"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-base font-black text-slate-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentInputItem(null)}
                  className="w-1/2 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200"
                >
                  {t('saveBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Farm Master Report Modal */}
      <FarmReportModal
        isOpen={showFarmReportModal}
        onClose={() => setShowFarmReportModal(false)}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        ledgerData={ledgerData}
        dairyInfo={dairyInfo}
      />

      {/* Individual Customer Bill & Report Modal */}
      {activeCustBill && (
        <CustomerBillModal
          isOpen={true}
          onClose={() => setActiveCustBill(null)}
          customer={activeCustBill}
          defaultMonth={selectedMonth}
          dairyInfo={dairyInfo}
        />
      )}

    </div>
  );
}
