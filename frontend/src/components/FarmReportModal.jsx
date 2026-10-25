import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  Building2, 
  Download, 
  Printer, 
  Calendar, 
  X, 
  Search, 
  FileSpreadsheet, 
  Eye, 
  Users, 
  Milk, 
  IndianRupee, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import CustomerBillModal from './CustomerBillModal';

export default function FarmReportModal({ 
  isOpen, 
  onClose, 
  selectedMonth, 
  setSelectedMonth, 
  ledgerData, 
  dairyInfo 
}) {
  const { t, lang } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'PAID'
  const [activeCustomerBill, setActiveCustomerBill] = useState(null);

  if (!isOpen) return null;

  const monthDate = new Date(`${selectedMonth}-01`);
  const monthName = monthDate.toLocaleString(lang === 'ta' ? 'ta-IN' : 'en-US', { month: 'long', year: 'numeric' });
  const todayFormatted = new Date().toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' });

  // Filtered customer ledger
  const filteredData = ledgerData.filter((item) => {
    const matchesSearch = 
      item.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customer.houseNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.customer.street && item.customer.street.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'PENDING') return item.balanceDue > 0;
    if (statusFilter === 'PAID') return item.balanceDue === 0;
    return true;
  });

  // Aggregates
  const totalLitres = ledgerData.reduce((sum, item) => sum + item.totalLitres, 0);
  const totalBill = ledgerData.reduce((sum, item) => sum + item.totalAmount, 0);
  const totalPaid = ledgerData.reduce((sum, item) => sum + item.paidAmount, 0);
  const totalPending = ledgerData.reduce((sum, item) => sum + item.balanceDue, 0);
  const totalCustomers = ledgerData.length;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Route #',
      'Door No',
      'Customer Name',
      'Street',
      'Phone',
      'Delivered Days',
      'Skipped Days',
      'Total Litres (L)',
      'Rate/L (INR)',
      'Total Bill (INR)',
      'Amount Paid (INR)',
      'Balance Due (INR)',
      'Status'
    ];

    const rows = filteredData.map(item => [
      item.customer.routeOrder || '',
      `"${item.customer.houseNo}"`,
      `"${item.customer.name}"`,
      `"${item.customer.street || ''}"`,
      `"${item.customer.phone || ''}"`,
      item.deliveredDays,
      item.skippedDays,
      item.totalLitres,
      item.rate,
      item.totalAmount,
      item.paidAmount,
      item.balanceDue,
      item.balanceDue === 0 ? 'PAID' : (item.paidAmount > 0 ? 'PARTIAL' : 'PENDING')
    ]);

    const csvContent = [
      `"${dairyInfo?.appName || 'PaalVandi'} - Monthly Farm Statement (${monthName})"`,
      headers.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dairyInfo?.appName || 'PaalVandi'}_Master_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Full Farm Report as Clean Vector PDF
  const handlePrintPdf = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${dairyInfo?.appName || 'PaalVandi'} - Master Farm Report - ${selectedMonth}</title>
        <style>
          @page { size: A4 landscape; margin: 10mm 12mm; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #0f172a;
            margin: 0;
            padding: 0;
            background: #fff;
            font-size: 11px;
            line-height: 1.3;
          }
          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #047857;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .brand-title {
            font-size: 20px;
            font-weight: 900;
            color: #047857;
            margin: 0;
          }
          .brand-sub {
            font-size: 10px;
            color: #475569;
            margin: 2px 0 0 0;
          }
          .kpi-strip {
            display: flex;
            gap: 10px;
            margin-bottom: 16px;
          }
          .kpi-card {
            flex: 1;
            padding: 8px 12px;
            border-radius: 8px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          .kpi-label {
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            color: #64748b;
            display: block;
          }
          .kpi-val {
            font-size: 15px;
            font-weight: 900;
            color: #0f172a;
            margin-top: 2px;
            display: block;
          }
          .kpi-card.green .kpi-val { color: #047857; }
          .kpi-card.red .kpi-val { color: #be123c; }

          table.data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          table.data-table th {
            background: #f1f5f9;
            color: #1e293b;
            padding: 6px 4px;
            font-weight: 800;
            border: 1px solid #cbd5e1;
            text-align: center;
            text-transform: uppercase;
          }
          table.data-table td {
            padding: 5px 4px;
            border: 1px solid #e2e8f0;
            text-align: center;
          }
          table.data-table tr:nth-child(even) {
            background: #fcfcfc;
          }
          .text-left { text-align: left !important; }
          .text-right { text-align: right !important; }
          .font-bold { font-weight: bold; }
          .badge-paid { color: #047857; font-weight: bold; }
          .badge-due { color: #be123c; font-weight: bold; }
          .badge-partial { color: #b45309; font-weight: bold; }

          .footer {
            margin-top: 15px;
            border-top: 1px solid #cbd5e1;
            padding-top: 8px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div>
            <h1 class="brand-title">${dairyInfo?.appName || 'PaalVandi'} - ${lang === 'ta' ? 'முழு பண்ணை அறிக்கை' : 'MASTER FARM REPORT'}</h1>
            <p class="brand-sub">${dairyInfo?.farmName || 'PaalVandi Farm'} • ${dairyInfo?.phone || ''} • ${dairyInfo?.address || ''}</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 14px; font-weight: bold; color: #1e293b;">${monthName}</div>
            <div style="font-size: 9px; color: #64748b;">${lang === 'ta' ? 'அறிக்கை தேதி' : 'Generated'}: ${todayFormatted}</div>
          </div>
        </div>

        <div class="kpi-strip">
          <div class="kpi-card green">
            <span class="kpi-label">${lang === 'ta' ? 'மொத்த பால் விநியோகம்' : 'TOTAL MILK DELIVERED'}</span>
            <span class="kpi-val">${totalLitres.toFixed(1)} L</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">${lang === 'ta' ? 'மொத்த பில் தொகை' : 'TOTAL BILLED REVENUE'}</span>
            <span class="kpi-val">₹${totalBill.toLocaleString()}</span>
          </div>
          <div class="kpi-card green">
            <span class="kpi-label">${lang === 'ta' ? 'வசூலான தொகை' : 'TOTAL COLLECTED'}</span>
            <span class="kpi-val">₹${totalPaid.toLocaleString()}</span>
          </div>
          <div class="kpi-card red">
            <span class="kpi-label">${lang === 'ta' ? 'பாக்கி வசூலிக்க வேண்டியது' : 'TOTAL PENDING DUE'}</span>
            <span class="kpi-val">₹${totalPending.toLocaleString()}</span>
          </div>
          <div class="kpi-card">
            <span class="kpi-label">${lang === 'ta' ? 'வாடிக்கையாளர்கள்' : 'ACTIVE CUSTOMERS'}</span>
            <span class="kpi-val">${totalCustomers}</span>
          </div>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 4%;">#</th>
              <th style="width: 7%;">${lang === 'ta' ? 'கதவு எண்' : 'Door #'}</th>
              <th style="width: 22%; text-align: left;">${lang === 'ta' ? 'வாடிக்கையாளர் பெயர் & பகுதி' : 'Customer Name & Street'}</th>
              <th style="width: 10%;">${lang === 'ta' ? 'தொலைபேசி' : 'Phone'}</th>
              <th style="width: 9%;">${lang === 'ta' ? 'விநியோக நாட்கள்' : 'Days (Del/Skip)'}</th>
              <th style="width: 9%;">${lang === 'ta' ? 'மொத்த பால் (L)' : 'Total Litres'}</th>
              <th style="width: 7%;">${lang === 'ta' ? 'லிட்டர் விலை' : 'Rate'}</th>
              <th style="width: 10%;">${lang === 'ta' ? 'பில் தொகை (₹)' : 'Total Bill'}</th>
              <th style="width: 10%;">${lang === 'ta' ? 'செலுத்தியது (₹)' : 'Paid (₹)'}</th>
              <th style="width: 10%;">${lang === 'ta' ? 'பாக்கி (₹)' : 'Due (₹)'}</th>
              <th style="width: 8%;">${lang === 'ta' ? 'நிலை' : 'Status'}</th>
            </tr>
          </thead>
          <tbody>
            ${filteredData.map((item, idx) => {
              const isPaid = item.balanceDue === 0;
              const isPartial = item.paidAmount > 0 && item.balanceDue > 0;
              return `
                <tr>
                  <td>${item.customer.routeOrder || idx + 1}</td>
                  <td class="font-bold">${item.customer.houseNo}</td>
                  <td class="text-left font-bold">${item.customer.name} <span style="font-weight:normal;color:#64748b;">(${item.customer.street || ''})</span></td>
                  <td>${item.customer.phone || '-'}</td>
                  <td>${item.deliveredDays} / ${item.skippedDays}</td>
                  <td class="font-bold" style="color: #047857;">${item.totalLitres} L</td>
                  <td>₹${item.rate}</td>
                  <td class="font-bold">₹${item.totalAmount}</td>
                  <td style="color: #059669;">₹${item.paidAmount}</td>
                  <td class="font-bold" style="color: ${item.balanceDue > 0 ? '#be123c' : '#059669'};">
                    ₹${item.balanceDue}
                  </td>
                  <td>
                    ${isPaid 
                      ? '<span class="badge-paid">PAID</span>' 
                      : (isPartial ? '<span class="badge-partial">PARTIAL</span>' : '<span class="badge-due">PENDING</span>')}
                  </td>
                </tr>
              `;
            }).join('')}
            <!-- Grand Totals Row -->
            <tr style="background: #f1f5f9; font-weight: 900; border-top: 2px solid #0f172a;">
              <td colspan="5" style="text-align: right; padding-right: 10px;">${lang === 'ta' ? 'பண்ணை மொத்த கணக்கு (GRAND TOTALS):' : 'FARM GRAND TOTALS:'}</td>
              <td style="color: #047857; font-size: 11px;">${totalLitres.toFixed(1)} L</td>
              <td>-</td>
              <td style="font-size: 11px;">₹${totalBill.toLocaleString()}</td>
              <td style="color: #059669; font-size: 11px;">₹${totalPaid.toLocaleString()}</td>
              <td style="color: #be123c; font-size: 11px;">₹${totalPending.toLocaleString()}</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          <div>${dairyInfo?.appName || 'PaalVandi'} Milk Management System • Generated by Owner/Admin</div>
          <div>Page 1 of 1</div>
        </div>
      </body>
      </html>
    `;

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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-4 sm:p-7 shadow-2xl border border-slate-100 my-auto space-y-5 animate-in fade-in duration-200">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                  {dairyInfo?.appName || 'PaalVandi'}
                </span>
                <span className="text-xs text-slate-500 font-bold">{monthName}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                {t('masterFarmReport')}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end sm:self-auto">
            {/* Month Picker */}
            <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="text-xs font-black text-slate-800 bg-transparent outline-none cursor-pointer"
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

        {/* Master Summary KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">{t('totalMilkVolume')}</span>
            <span className="text-xl font-black text-emerald-950 block mt-0.5">
              {totalLitres.toFixed(1)} <span className="text-xs font-normal">L</span>
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('totalBillAmount')}</span>
            <span className="text-xl font-black text-slate-900 block mt-0.5">
              ₹{totalBill.toLocaleString()}
            </span>
          </div>

          <div className="bg-emerald-950/5 border border-emerald-300 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-emerald-700 font-bold uppercase block">{t('collectedAmount')}</span>
            <span className="text-xl font-black text-emerald-700 block mt-0.5">
              ₹{totalPaid.toLocaleString()}
            </span>
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-rose-700 font-bold uppercase block">{t('outstandingAmount')}</span>
            <span className="text-xl font-black text-rose-700 block mt-0.5">
              ₹{totalPending.toLocaleString()}
            </span>
          </div>

          <div className="col-span-2 md:col-span-1 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">{t('customers')}</span>
            <span className="text-xl font-black text-slate-800 block mt-0.5">
              {totalCustomers}
            </span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t('searchCustomer')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
            {/* Filter Pills */}
            <div className="flex rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-sm font-black' : 'text-slate-600'}`}
              >
                {lang === 'ta' ? 'அனைத்தும்' : 'All'} ({ledgerData.length})
              </button>
              <button
                onClick={() => setStatusFilter('PENDING')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'PENDING' ? 'bg-rose-500 text-white shadow-sm font-black' : 'text-slate-600'}`}
              >
                {lang === 'ta' ? 'பாக்கி' : 'Due'} ({ledgerData.filter(d => d.balanceDue > 0).length})
              </button>
              <button
                onClick={() => setStatusFilter('PAID')}
                className={`px-3 py-1 rounded-lg transition ${statusFilter === 'PAID' ? 'bg-emerald-600 text-white shadow-sm font-black' : 'text-slate-600'}`}
              >
                {lang === 'ta' ? 'முடிந்தது' : 'Paid'} ({ledgerData.filter(d => d.balanceDue === 0).length})
              </button>
            </div>
          </div>
        </div>

        {/* User-by-User Detailed Ledger Table */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="max-h-72 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-100 sticky top-0 z-10 border-b border-slate-200 text-[11px] font-black text-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">{t('customerLabel')}</th>
                  <th className="p-3 text-center">{t('deliveredDaysLabel')}</th>
                  <th className="p-3 text-right">{t('totalMilkVolume')}</th>
                  <th className="p-3 text-right">{t('billAmount')}</th>
                  <th className="p-3 text-right">{t('collectedAmount')}</th>
                  <th className="p-3 text-right">{t('balanceDueLabel')}</th>
                  <th className="p-3 text-center">{t('status')}</th>
                  <th className="p-3 text-center">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredData.map((item, idx) => {
                  const isPaid = item.balanceDue === 0;
                  const isPartial = item.paidAmount > 0 && item.balanceDue > 0;
                  return (
                    <tr key={item.customer.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 text-center font-bold text-slate-500">
                        {item.customer.routeOrder || idx + 1}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-black">
                            {item.customer.houseNo}
                          </span>
                          <span className="font-extrabold text-slate-900">{item.customer.name}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">{item.customer.street}</span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="font-bold text-emerald-800">{item.deliveredDays}d</span>
                        {item.skippedDays > 0 && (
                          <span className="text-[10px] text-slate-400 ml-1">({item.skippedDays} leave)</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-900">
                        {item.totalLitres} L
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">
                        ₹{item.totalAmount}
                      </td>
                      <td className="p-3 text-right font-bold text-emerald-700">
                        ₹{item.paidAmount}
                      </td>
                      <td className="p-3 text-right font-black">
                        <span className={item.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                          ₹{item.balanceDue}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {isPaid && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            PAID
                          </span>
                        )}
                        {isPartial && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                            PARTIAL
                          </span>
                        )}
                        {!isPaid && !isPartial && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                            DUE
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => setActiveCustomerBill(item.customer)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-800 font-bold transition shadow-sm"
                          title={t('viewCustomerBill')}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Buttons: Download PDF, Export CSV, Close */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {/* Download Full Farm Report PDF */}
            <button
              onClick={handlePrintPdf}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-200 active:scale-95 transition"
            >
              <Download className="w-4 h-4" />
              <span>{t('printPdf')}</span>
            </button>

            {/* Export CSV / Excel */}
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs border border-slate-200 transition"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>{t('exportCsv')}</span>
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

      {/* Individual Customer Bill Modal from Master Report */}
      {activeCustomerBill && (
        <CustomerBillModal
          isOpen={true}
          onClose={() => setActiveCustomerBill(null)}
          customer={activeCustomerBill}
          defaultMonth={selectedMonth}
          dairyInfo={dairyInfo}
        />
      )}
    </div>
  );
}
