import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import { 
  FileText, 
  Printer, 
  Share2, 
  Download, 
  QrCode, 
  Calendar, 
  X, 
  CheckCircle2, 
  PauseCircle,
  Milk,
  Phone,
  MapPin,
  Building2
} from 'lucide-react';

export default function CustomerBillModal({ 
  isOpen, 
  onClose, 
  customer, 
  defaultMonth, 
  dairyInfo 
}) {
  const { t, lang } = useLanguage();
  const currentMonthStr = defaultMonth || new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  if (!isOpen || !customer) return null;

  // Fetch monthly ledger for this customer
  const ledgerData = dairyService.getMonthLedger(selectedMonth);
  const custLedger = ledgerData.find(item => item.customer.id === customer.id) || {
    customer,
    totalLitres: 0,
    deliveredDays: 0,
    skippedDays: 0,
    rate: customer.ratePerLitre || 56,
    totalAmount: 0,
    paidAmount: 0,
    balanceDue: 0,
    paymentStatus: 'PENDING',
    dailyBreakdown: []
  };

  const monthDate = new Date(`${selectedMonth}-01`);
  const monthName = monthDate.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' });
  const billNumber = `PV-${selectedMonth.replace('-', '')}-${String(customer.routeOrder || customer.houseNo).padStart(3, '0')}`;
  const todayFormatted = new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  // Handle WhatsApp Invoicing
  const handleShareWhatsApp = () => {
    const message = lang === 'ta'
      ? `வணக்கம் *${customer.name}* அவர்களுக்கு,
*${dairyInfo?.appName || 'PaalVandi'}* - ${monthName} மாதாந்திர பால் கணக்கு அறிக்கை:
--------------------------------
🧾 பில் எண்: ${billNumber}
🥛 விநியோகம் செய்த நாட்கள்: ${custLedger.deliveredDays} நாட்கள்
⏸️ விடுப்பு நாட்கள்: ${custLedger.skippedDays} நாட்கள்
🍶 மொத்த பால் அளவு: *${custLedger.totalLitres} லிட்டர்*
🏷️ லிட்டர் விலை: ₹${custLedger.rate}
💰 மொத்த பில் தொகை: *₹${custLedger.totalAmount}*
✅ செலுத்தியது: ₹${custLedger.paidAmount}
⚠️ *பாக்கி தொகை: ₹${custLedger.balanceDue}*
--------------------------------
UPI ID: *${dairyInfo?.upiId || 'paalvandi@upi'}* (GPay / PhonePe / Paytm)
நன்றி! வாழ்க வளமுடன்!`
      : `Dear *${customer.name}*,
*${dairyInfo?.appName || 'PaalVandi'}* - Monthly Milk Bill for ${monthName}:
--------------------------------
🧾 Bill #: ${billNumber}
🥛 Delivered Days: ${custLedger.deliveredDays} days
⏸️ Skipped / Leave: ${custLedger.skippedDays} days
🍶 Total Milk Volume: *${custLedger.totalLitres} Litres*
🏷️ Rate / Litre: ₹${custLedger.rate}
💰 Total Bill: *₹${custLedger.totalAmount}*
✅ Amount Paid: ₹${custLedger.paidAmount}
⚠️ *Balance Due: ₹${custLedger.balanceDue}*
--------------------------------
Pay via UPI: *${dairyInfo?.upiId || 'paalvandi@upi'}* (GPay / PhonePe / Paytm)
Thank you!`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = (customer.phone || '').replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encoded}`, '_blank');
  };

  // Generate and Print Clean Vector PDF via Hidden Iframe
  const handlePrintPdf = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${dairyInfo?.appName || 'PaalVandi'} - Bill ${billNumber} - ${customer.name}</title>
        <style>
          @page { size: A4; margin: 12mm 15mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #fff;
            font-size: 12px;
            line-height: 1.4;
          }
          .bill-card {
            border: 1px solid #cbd5e1;
            border-radius: 12px;
            padding: 24px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header-table {
            width: 100%;
            border-bottom: 2px solid #059669;
            padding-bottom: 16px;
            margin-bottom: 18px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 900;
            color: #047857;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .brand-sub {
            font-size: 11px;
            color: #475569;
            margin: 2px 0 0 0;
          }
          .invoice-badge {
            text-align: right;
          }
          .invoice-badge h2 {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            color: #1e293b;
          }
          .invoice-meta {
            font-size: 11px;
            color: #64748b;
            margin-top: 4px;
          }
          .info-grid {
            display: flex;
            justify-content: space-between;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 20px;
          }
          .info-col {
            flex: 1;
          }
          .info-col strong {
            color: #0f172a;
            font-size: 13px;
          }
          .summary-boxes {
            display: flex;
            gap: 12px;
            margin-bottom: 20px;
          }
          .s-box {
            flex: 1;
            padding: 12px;
            border-radius: 8px;
            background: #f1f5f9;
            text-align: center;
            border: 1px solid #e2e8f0;
          }
          .s-box.highlight {
            background: #ecfdf5;
            border-color: #a7f3d0;
          }
          .s-box.due {
            background: #fff1f2;
            border-color: #fecdd3;
          }
          .s-label {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            display: block;
          }
          .s-val {
            font-size: 18px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 2px;
            display: block;
          }
          .s-box.highlight .s-val { color: #047857; }
          .s-box.due .s-val { color: #be123c; }

          table.breakdown-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 11px;
          }
          table.breakdown-table th {
            background: #f8fafc;
            color: #334155;
            text-align: center;
            padding: 8px 6px;
            font-weight: 800;
            border-bottom: 2px solid #cbd5e1;
            font-size: 10px;
            text-transform: uppercase;
          }
          table.breakdown-table td {
            padding: 6px;
            text-align: center;
            border-bottom: 1px solid #e2e8f0;
          }
          table.breakdown-table tr:nth-child(even) {
            background: #fcfcfc;
          }
          .status-delivered {
            color: #047857;
            font-weight: bold;
          }
          .status-skipped {
            color: #94a3b8;
          }
          .footer-section {
            border-top: 1px solid #cbd5e1;
            padding-top: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .upi-box {
            font-size: 11px;
            color: #334155;
          }
          .upi-box strong {
            color: #047857;
          }
          .signature-box {
            text-align: right;
            font-size: 11px;
            color: #64748b;
          }
          .stamp {
            margin-top: 25px;
            font-weight: bold;
            color: #0f172a;
          }
        </style>
      </head>
      <body>
        <div class="bill-card">
          <table class="header-table">
            <tr>
              <td>
                <h1 class="brand-title">${dairyInfo?.appName || 'PaalVandi'}</h1>
                <p class="brand-sub">${dairyInfo?.farmName || 'Fresh Farm Milk Delivery'} • Phone: ${dairyInfo?.phone || '+91 98765 43210'}</p>
                <p class="brand-sub">${dairyInfo?.address || 'Tamil Nadu, India'}</p>
              </td>
              <td class="invoice-badge">
                <h2>${lang === 'ta' ? 'பால் கணக்கு பில்' : 'MILK INVOICE'}</h2>
                <div class="invoice-meta">
                  <strong>${billNumber}</strong><br>
                  ${lang === 'ta' ? 'மாதம்' : 'Month'}: <strong>${monthName}</strong><br>
                  ${lang === 'ta' ? 'தேதி' : 'Date'}: ${todayFormatted}
                </div>
              </td>
            </tr>
          </table>

          <div class="info-grid">
            <div class="info-col">
              <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">${lang === 'ta' ? 'வாடிக்கையாளர் விவரம்' : 'CUSTOMER DETAILS'}</span><br>
              <strong>${customer.name}</strong><br>
              ${lang === 'ta' ? 'கதவு எண்' : 'Door / House'}: ${customer.houseNo} • ${customer.street}<br>
              ${lang === 'ta' ? 'தொலைபேசி' : 'Phone'}: ${customer.phone || 'N/A'}
            </div>
            <div class="info-col" style="text-align: right;">
              <span style="font-size: 10px; color: #64748b; text-transform: uppercase; font-weight: bold;">${lang === 'ta' ? 'வழக்கமான அளவு' : 'DEFAULT SUBSCRIPTION'}</span><br>
              ${lang === 'ta' ? 'காலை' : 'Morning'}: ${customer.defaultMorningQty || 0} L | ${lang === 'ta' ? 'மாலை' : 'Evening'}: ${customer.defaultEveningQty || 0} L<br>
              ${lang === 'ta' ? 'லிட்டர் விலை' : 'Rate / Litre'}: <strong>₹${custLedger.rate}</strong>
            </div>
          </div>

          <!-- Summary Metric Cards -->
          <div class="summary-boxes">
            <div class="s-box highlight">
              <span class="s-label">${lang === 'ta' ? 'மொத்த பால் அளவு' : 'TOTAL MILK VOLUME'}</span>
              <span class="s-val">${custLedger.totalLitres} L</span>
              <span style="font-size: 9px; color: #047857;">(${custLedger.deliveredDays} ${lang === 'ta' ? 'நாட்கள்' : 'days'})</span>
            </div>
            <div class="s-box">
              <span class="s-label">${lang === 'ta' ? 'மொத்த பில் தொகை' : 'TOTAL BILL AMOUNT'}</span>
              <span class="s-val">₹${custLedger.totalAmount}</span>
              <span style="font-size: 9px; color: #64748b;">@ ₹${custLedger.rate}/L</span>
            </div>
            <div class="s-box">
              <span class="s-label">${lang === 'ta' ? 'செலுத்திய தொகை' : 'AMOUNT PAID'}</span>
              <span class="s-val">₹${custLedger.paidAmount}</span>
              <span style="font-size: 9px; color: #059669;">${custLedger.paidAmount >= custLedger.totalAmount ? (lang === 'ta' ? 'முழுதும் முடிந்தது' : 'Paid in Full') : ''}</span>
            </div>
            <div class="s-box due">
              <span class="s-label">${lang === 'ta' ? 'பாக்கி தொகை' : 'BALANCE DUE'}</span>
              <span class="s-val">₹${custLedger.balanceDue}</span>
              <span style="font-size: 9px; color: #e11d48;">${custLedger.balanceDue > 0 ? (lang === 'ta' ? 'செலுத்த வேண்டியது' : 'Payment Pending') : '✓ Clear'}</span>
            </div>
          </div>

          <!-- Day-by-Day Table -->
          <h3 style="font-size: 12px; margin: 0 0 8px 0; color: #1e293b; font-weight: 800;">
            ${lang === 'ta' ? 'தினசரி பால் விநியோக விவர பட்டியல்' : 'DAILY MILK DELIVERY STATEMENT'} (${monthName})
          </h3>
          <table class="breakdown-table">
            <thead>
              <tr>
                <th style="width: 15%;">${lang === 'ta' ? 'தேதி' : 'Date'}</th>
                <th style="width: 20%;">${lang === 'ta' ? 'காலை (L)' : 'Morning (L)'}</th>
                <th style="width: 20%;">${lang === 'ta' ? 'மாலை (L)' : 'Evening (L)'}</th>
                <th style="width: 20%;">${lang === 'ta' ? 'மொத்த பால் (L)' : 'Day Total (L)'}</th>
                <th style="width: 25%;">${lang === 'ta' ? 'நிலை' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              ${custLedger.dailyBreakdown.map(d => {
                const isDelivered = d.status === 'DELIVERED';
                const isSkipped = d.status === 'SKIPPED';
                return `
                  <tr>
                    <td>${d.date.split('-')[2]} / ${monthDate.getMonth() + 1}</td>
                    <td>${d.morningLitres > 0 ? d.morningLitres + ' L' : '-'}</td>
                    <td>${d.eveningLitres > 0 ? d.eveningLitres + ' L' : '-'}</td>
                    <td style="font-weight: bold; color: ${isDelivered ? '#047857' : '#64748b'};">
                      ${d.litres > 0 ? d.litres + ' L' : (isSkipped ? '0 L' : '-')}
                    </td>
                    <td>
                      ${isDelivered 
                        ? `<span class="status-delivered">✓ ${lang === 'ta' ? 'போட்டாச்சு' : 'Delivered'}</span>` 
                        : (isSkipped ? `<span class="status-skipped">⏸ ${lang === 'ta' ? 'விடுமுறை' : 'Leave / Skipped'}</span>` : '<span style="color:#cbd5e1;">-</span>')}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <!-- Footer & Payment Details -->
          <div class="footer-section">
            <div class="upi-box">
              <strong>${lang === 'ta' ? 'கட்டணம் செலுத்தும் முறை (UPI Payment):' : 'PAYMENT INSTRUCTIONS:'}</strong><br>
              UPI ID: <strong>${dairyInfo?.upiId || 'paalvandi@upi'}</strong><br>
              ${lang === 'ta' ? 'Google Pay, PhonePe அல்லது Paytm வழியாக நேரடியாக செலுத்தலாம்.' : 'Pay instantly using Google Pay, PhonePe, or Paytm.'}
            </div>
            <div class="signature-box">
              <div class="stamp">${dairyInfo?.farmName || 'PaalVandi Farm'}</div>
              <div>${lang === 'ta' ? 'அங்கீகரிக்கப்பட்ட கையொப்பம்' : 'Authorized Signature'}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Create iframe to print without disrupting the current UI
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow ? printFrame.contentWindow.document : printFrame.contentDocument;
    frameDoc.open();
    frameDoc.write(printContent);
    frameDoc.close();

    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-auto space-y-5 animate-in fade-in duration-200">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base sm:text-lg">
                {t('customerReportTitle')}
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                {billNumber} • {customer.name} ({t('door')}: {customer.houseNo})
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Month Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-black text-slate-700 bg-transparent outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 font-bold transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bill Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">{t('totalMilkVolume')}</span>
            <span className="text-xl font-black text-emerald-950 block mt-0.5">
              {custLedger.totalLitres} <span className="text-xs font-normal">L</span>
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {custLedger.deliveredDays} {t('days')}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('totalBillAmount')}</span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              ₹{custLedger.totalAmount}
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              @ ₹{custLedger.rate}/L
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('collectedAmount')}</span>
            <span className="text-xl font-black text-emerald-700 block mt-0.5">
              ₹{custLedger.paidAmount}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium">
              {custLedger.paidAmount >= custLedger.totalAmount ? t('fullyPaid') : 'Received'}
            </span>
          </div>

          <div className={`rounded-2xl p-3 text-center border ${
            custLedger.balanceDue > 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'
          }`}>
            <span className={`text-[10px] font-bold uppercase block ${
              custLedger.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              {t('outstandingAmount')}
            </span>
            <span className={`text-xl font-black block mt-0.5 ${
              custLedger.balanceDue > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}>
              ₹{custLedger.balanceDue}
            </span>
            <span className={`text-[10px] font-medium ${
              custLedger.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {custLedger.balanceDue > 0 ? t('balanceDueLabel') : '✓ Clear'}
            </span>
          </div>
        </div>

        {/* Daily Delivery History Accordion / Scroll View */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">
              {t('dayBreakdown')} ({monthName})
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {custLedger.deliveredDays} {t('deliveredDaysLabel')} • {custLedger.skippedDays} {t('leaveDaysLabel')}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-2xl divide-y divide-slate-100 text-xs">
            <div className="grid grid-cols-5 p-2.5 bg-slate-100 text-[11px] font-black text-slate-600 text-center sticky top-0">
              <span>{t('billDate')}</span>
              <span>{t('morningQty')}</span>
              <span>{t('eveningQty')}</span>
              <span>{t('dailyTotal')}</span>
              <span>{t('status')}</span>
            </div>

            {custLedger.dailyBreakdown.map((d) => {
              const isDelivered = d.status === 'DELIVERED';
              const isSkipped = d.status === 'SKIPPED';
              return (
                <div 
                  key={d.date} 
                  className={`grid grid-cols-5 p-2 text-center items-center transition ${
                    isDelivered ? 'hover:bg-emerald-50/50' : isSkipped ? 'bg-slate-50/70 text-slate-400' : ''
                  }`}
                >
                  <span className="font-bold text-slate-700">
                    {d.date.split('-')[2]} {monthDate.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'short' })}
                  </span>
                  <span>{d.morningLitres > 0 ? `${d.morningLitres}L` : '-'}</span>
                  <span>{d.eveningLitres > 0 ? `${d.eveningLitres}L` : '-'}</span>
                  <span className={`font-black ${isDelivered ? 'text-emerald-800' : 'text-slate-400'}`}>
                    {d.litres > 0 ? `${d.litres}L` : (isSkipped ? '0L' : '-')}
                  </span>
                  <div>
                    {isDelivered && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        ✓ {t('markedDone')}
                      </span>
                    )}
                    {isSkipped && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 text-slate-600">
                        ⏸ {t('skipped')}
                      </span>
                    )}
                    {!isDelivered && !isSkipped && (
                      <span className="text-slate-300">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons: Download PDF, Share WhatsApp, Close */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Download / Print PDF */}
            <button
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('downloadPdf')}</span>
            </button>

            {/* Share on WhatsApp */}
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-extrabold text-xs transition"
            >
              <Share2 className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
          >
            {t('cancel')}
          </button>
        </div>

      </div>
    </div>
  );
}
