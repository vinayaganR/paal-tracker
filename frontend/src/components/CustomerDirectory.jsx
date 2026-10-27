import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dairyService } from '../services/dairyService';
import { 
  Users, 
  UserPlus, 
  Search, 
  MapPin, 
  Phone, 
  Pencil, 
  Trash2, 
  Save, 
  X
} from 'lucide-react';

export default function CustomerDirectory() {
  const { t, lang } = useLanguage();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const todayStr = new Date().toISOString().split('T')[0];

  const initialForm = {
    name: '',
    houseNo: '',
    street: '',
    phone: '',
    defaultMorningQty: 1.0,
    defaultEveningQty: 0.5,
    ratePerLitre: 56,
    routeOrder: 1,
    notes: '',
    startDate: todayStr,
  };

  const [formData, setFormData] = useState(initialForm);

  const loadCustomers = async () => {
    try {
      await dairyService.syncCustomers();
    } catch (e) {}
    const list = dairyService.getCustomers().sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));
    setCustomers(list);
  };

  useEffect(() => {
    loadCustomers();
    const unsubscribe = dairyService.subscribeToNotifications(() => {
      loadCustomers();
    });
    return () => unsubscribe();
  }, []);

  const handleAddNew = () => {
    setEditingCustomer(null);
    setFormData({
      ...initialForm,
      routeOrder: customers.length + 1,
      startDate: todayStr
    });
    setIsEditing(true);
  };

  const handleEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      name: cust.name,
      houseNo: cust.houseNo,
      street: cust.street,
      phone: cust.phone,
      defaultMorningQty: cust.defaultMorningQty,
      defaultEveningQty: cust.defaultEveningQty,
      ratePerLitre: cust.ratePerLitre || 56,
      routeOrder: cust.routeOrder || 1,
      notes: cust.notes || '',
      startDate: cust.startDate || (cust.registeredAt ? cust.registeredAt.split('T')[0] : todayStr),
    });
    setIsEditing(true);
  };

  const handleDelete = (id) => {
    if (window.confirm(t('confirmDeleteCustomer'))) {
      dairyService.deleteCustomer(id);
      loadCustomers();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.houseNo.trim()) {
      alert(lang === 'ta' ? 'பெயர் மற்றும் கதவு எண் கட்டாயம்!' : 'Name and house number are required!');
      return;
    }

    const payload = {
      ...(editingCustomer || {}),
      ...formData,
      defaultMorningQty: parseFloat(formData.defaultMorningQty) || 0,
      defaultEveningQty: parseFloat(formData.defaultEveningQty) || 0,
      ratePerLitre: parseFloat(formData.ratePerLitre) || 56,
      routeOrder: parseInt(formData.routeOrder) || 1,
      startDate: formData.startDate || editingCustomer?.startDate || todayStr,
      registeredAt: editingCustomer?.registeredAt || new Date().toISOString()
    };

    await dairyService.saveCustomer(payload);
    setIsEditing(false);
    await loadCustomers();
  };

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.houseNo.toLowerCase().includes(q) ||
      c.street.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  // Calculate daily totals
  const totalMorningDemand = customers.reduce((sum, c) => sum + (c.defaultMorningQty || 0), 0);
  const totalEveningDemand = customers.reduce((sum, c) => sum + (c.defaultEveningQty || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-extrabold text-slate-900">
              {t('customers')} ({customers.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('morning')}: <strong className="text-slate-800">{totalMorningDemand.toFixed(1)}L</strong> | 
            {t('evening')}: <strong className="text-slate-800">{totalEveningDemand.toFixed(1)}L</strong> | 
            {t('dailyTotalLitres')} <strong className="text-emerald-700">{(totalMorningDemand + totalEveningDemand).toFixed(1)} {t('litres')}</strong>
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-200 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>{t('addCustomer')}</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder={t('searchCustomer')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-sm"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
      </div>

      {/* Customer List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((cust) => (
          <div
            key={cust.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Header row */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white text-xs font-black flex items-center justify-center shadow-sm">
                    #{cust.routeOrder}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      {cust.name}
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {t('door')}: {cust.houseNo}
                    </span>
                  </div>
                </div>

                {/* Edit / Delete actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleEdit(cust)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-slate-100 transition"
                    title={t('editCustomer')}
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cust.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title={t('confirmDeleteCustomer')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Address & Phone */}
              <div className="mt-3 space-y-1 text-xs text-slate-600">
                <div className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                  <span>{cust.street}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-1 text-slate-400 flex-shrink-0" />
                  <a href={`tel:${cust.phone}`} className="text-emerald-700 font-semibold hover:underline">
                    {cust.phone}
                  </a>
                </div>
              </div>

              {/* Notes */}
              {cust.notes && (
                <div className="mt-2 text-[11px] font-medium text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                  📌 {cust.notes}
                </div>
              )}
            </div>

            {/* Bottom Milk Quota & Pricing */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                <div className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-slate-500 block font-bold">{t('morning')}</span>
                  <span className="font-extrabold text-slate-900">{cust.defaultMorningQty} L</span>
                </div>
                <div className="bg-slate-100 px-2.5 py-1 rounded-lg">
                  <span className="text-[10px] text-slate-500 block font-bold">{t('evening')}</span>
                  <span className="font-extrabold text-slate-900">{cust.defaultEveningQty} L</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-semibold">{t('ratePerLitre')}</span>
                <span className="font-black text-emerald-700 text-sm">₹{cust.ratePerLitre || 56}</span>
              </div>
            </div>

          </div>
        ))}
      </div>

      {/* Customer Add/Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 my-8">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-lg">
                {editingCustomer ? t('editCustomer') : t('addCustomer')}
              </h3>
              <button 
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('customerLabel')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={lang === 'ta' ? 'வாடிக்கையாளர் பெயர் உள்ளிடவும்' : 'Enter customer name'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('houseNo')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.houseNo}
                    onChange={(e) => setFormData({ ...formData, houseNo: e.target.value })}
                    placeholder={lang === 'ta' ? 'கதவு எண் உள்ளிடவும்' : 'Enter house / door no'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('street')}
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                    placeholder={lang === 'ta' ? 'தெரு அல்லது பகுதி பெயர் உள்ளிடவும்' : 'Enter street or area'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('phone')}
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={lang === 'ta' ? '10 இலக்க மொபைல் எண் உள்ளிடவும்' : 'Enter 10-digit mobile number'}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Milk quantities & Rate */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('morning')} ({t('litres')})
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.defaultMorningQty}
                    onChange={(e) => setFormData({ ...formData, defaultMorningQty: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('evening')} ({t('litres')})
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    value={formData.defaultEveningQty}
                    onChange={(e) => setFormData({ ...formData, defaultEveningQty: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {t('ratePerLitre')} (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.ratePerLitre}
                    onChange={(e) => setFormData({ ...formData, ratePerLitre: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-center text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {lang === 'ta' ? 'பால் தொடங்கும் தேதி (Start Date)' : 'Start Date'} *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate || todayStr}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {t('routeOrder')}
                  </label>
                  <input
                    type="number"
                    value={formData.routeOrder}
                    onChange={(e) => setFormData({ ...formData, routeOrder: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {t('deliveryNotes')}
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder={lang === 'ta' ? 'டெலிவரி குறிப்புகள் உள்ளிடவும் (விருப்பத்தேர்வு)' : 'Enter delivery instructions (optional)'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-200"
                >
                  <Save className="w-4 h-4" />
                  <span>{t('saveCustomer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
