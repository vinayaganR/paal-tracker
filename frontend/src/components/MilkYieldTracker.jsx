import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import { 
  Milk, 
  Droplet, 
  Award, 
  Save, 
  Scale
} from 'lucide-react';

export default function MilkYieldTracker({ selectedDate }) {
  const { t, lang } = useLanguage();
  const [record, setRecord] = useState({
    date: selectedDate,
    totalCows: 6,
    morningYield: 34.0,
    eveningYield: 22.0,
    fatPercentage: 4.5,
    snfPercentage: 8.8,
    notes: lang === 'ta' ? 'அனைத்து மாடுகளும் நலமாக உள்ளன' : 'All cows healthy & grazing well',
  });
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const data = dairyService.getMilkingYield(selectedDate);
    setRecord(data);
  }, [selectedDate]);

  const handleSave = (e) => {
    e.preventDefault();
    dairyService.saveMilkingYield({
      ...record,
      date: selectedDate,
      totalCows: parseInt(record.totalCows) || 1,
      morningYield: parseFloat(record.morningYield) || 0,
      eveningYield: parseFloat(record.eveningYield) || 0,
      fatPercentage: parseFloat(record.fatPercentage) || 0,
      snfPercentage: parseFloat(record.snfPercentage) || 0,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  // Compute total delivered on this date from morning & evening sheets
  const morningSheet = dairyService.getDailyDeliverySheet(selectedDate, 'MORNING');
  const eveningSheet = dairyService.getDailyDeliverySheet(selectedDate, 'EVENING');

  const morningDelivered = morningSheet
    .filter(s => s.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (Number(curr.litres) || 0), 0);

  const eveningDelivered = eveningSheet
    .filter(s => s.status === 'DELIVERED')
    .reduce((acc, curr) => acc + (Number(curr.litres) || 0), 0);

  const totalDeliveredToday = morningDelivered + eveningDelivered;
  const totalYield = (parseFloat(record.morningYield) || 0) + (parseFloat(record.eveningYield) || 0);
  const remainingMilk = totalYield - totalDeliveredToday;

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Milk className="w-4 h-4" />
              <span>{t('milkingStock')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black mt-1">
              {t('milkingYieldTitle')}
            </h2>
            <p className="text-xs text-emerald-100 mt-0.5">
              {t('milkingYieldSubtitle')}
            </p>
          </div>

          <div className="bg-emerald-950/40 px-4 py-2.5 rounded-2xl border border-emerald-600/30 text-left sm:text-right">
            <span className="text-[11px] text-emerald-300 block font-medium">{t('date')}</span>
            <span className="text-base font-extrabold text-white">{selectedDate}</span>
          </div>
        </div>

        {/* Real-time Tally Grid */}
        <div className="grid grid-cols-3 gap-3 pt-5 mt-4 border-t border-emerald-700/60 text-center">
          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-600/30">
            <span className="text-[11px] text-emerald-200 block font-medium">{t('totalYield')}</span>
            <span className="text-xl sm:text-2xl font-black text-white mt-1 block">
              {totalYield.toFixed(1)} <span className="text-xs font-normal">L</span>
            </span>
          </div>

          <div className="bg-emerald-900/40 p-3 rounded-2xl border border-emerald-600/30">
            <span className="text-[11px] text-emerald-200 block font-medium">{t('distributed')}</span>
            <span className="text-xl sm:text-2xl font-black text-amber-300 mt-1 block">
              {totalDeliveredToday.toFixed(1)} <span className="text-xs font-normal">L</span>
            </span>
          </div>

          <div className="bg-emerald-950/60 p-3 rounded-2xl border border-emerald-500/50">
            <span className="text-[11px] text-emerald-300 block font-bold">{t('remainingStock')}</span>
            <span className={`text-xl sm:text-2xl font-black mt-1 block ${
              remainingMilk < 0 ? 'text-rose-400' : 'text-emerald-300'
            }`}>
              {remainingMilk.toFixed(1)} <span className="text-xs font-normal">L</span>
            </span>
            <span className="text-[10px] text-slate-300">{t('curdGheeNote')}</span>
          </div>
        </div>
      </div>

      {/* Yield Entry Form */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-7 shadow-sm">
        <form onSubmit={handleSave} className="space-y-5">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center">
              <Scale className="w-5 h-5 text-emerald-600 mr-2" />
              {t('enterTodayYield')}
            </h3>
            {savedSuccess && (
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ✓ {t('saveBtn')}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('milkedCowsCount')}
              </label>
              <input
                type="number"
                value={record.totalCows}
                onChange={(e) => setRecord({ ...record, totalCows: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('morningYieldInput')}
              </label>
              <input
                type="number"
                step="0.5"
                value={record.morningYield}
                onChange={(e) => setRecord({ ...record, morningYield: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {t('eveningYieldInput')}
              </label>
              <input
                type="number"
                step="0.5"
                value={record.eveningYield}
                onChange={(e) => setRecord({ ...record, eveningYield: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-extrabold text-indigo-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Quality metrics (FAT / SNF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
            <div>
              <label className="text-xs font-bold text-emerald-950 block mb-1 flex items-center">
                <Droplet className="w-4 h-4 mr-1 text-emerald-600" />
                {t('fatPercentage')}
              </label>
              <input
                type="number"
                step="0.1"
                value={record.fatPercentage}
                onChange={(e) => setRecord({ ...record, fatPercentage: e.target.value })}
                className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">{t('fatNote')}</span>
            </div>

            <div>
              <label className="text-xs font-bold text-emerald-950 block mb-1 flex items-center">
                <Award className="w-4 h-4 mr-1 text-emerald-600" />
                {t('snfPercentage')}
              </label>
              <input
                type="number"
                step="0.1"
                value={record.snfPercentage}
                onChange={(e) => setRecord({ ...record, snfPercentage: e.target.value })}
                className="w-full bg-white border border-emerald-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-800"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">{t('snfNote')}</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t('feedNotes')}
            </label>
            <input
              type="text"
              value={record.notes}
              onChange={(e) => setRecord({ ...record, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition"
            >
              <Save className="w-4 h-4" />
              <span>{t('saveYieldBtn')}</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}
