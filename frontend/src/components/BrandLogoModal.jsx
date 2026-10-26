import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  X, 
  Camera, 
  Pencil,
  Tag,
  Store,
  CreditCard,
  User
} from 'lucide-react';

const PRESET_EMOJIS = ['🥛', '🐄', '🐮', '🌾', '🧈', '🚜', '🧀', '🍶'];

export default function BrandLogoModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { dairyInfo, updateDairyInfo } = useAuth();

  const [appName, setAppName] = useState(dairyInfo?.appName || 'PaalVandi');
  const [farmName, setFarmName] = useState(dairyInfo?.farmName || 'dheena dhinesh farming');
  const [ownerName, setOwnerName] = useState(dairyInfo?.ownerName || 'மாரிமுத்து (அப்பா)');
  const [upiId, setUpiId] = useState(dairyInfo?.upiId || 'dairyfarm@okaxis');
  const [logoUrl, setLogoUrl] = useState(dairyInfo?.logoUrl || null);
  const [logoEmoji, setLogoEmoji] = useState(dairyInfo?.logoEmoji || '🥛');
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  // Sync state whenever modal opens or dairyInfo updates
  useEffect(() => {
    if (isOpen && dairyInfo) {
      setAppName(dairyInfo.appName || 'PaalVandi');
      setFarmName(dairyInfo.farmName || 'dheena dhinesh farming');
      setOwnerName(dairyInfo.ownerName || 'மாரிமுத்து (அப்பா)');
      setUpiId(dairyInfo.upiId || 'dairyfarm@okaxis');
      setLogoUrl(dairyInfo.logoUrl || null);
      setLogoEmoji(dairyInfo.logoEmoji || '🥛');
    }
  }, [isOpen, dairyInfo]);

  if (!isOpen) return null;

  // Handle Image Upload & Canvas Resizing (Max 256x256 for fast local storage)
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);

        setLogoUrl(compressedDataUrl);
        showToast(t('logoSavedSuccess'));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // Handle Logo Deletion / Reset to Default
  const handleDeleteLogo = () => {
    if (window.confirm(t('confirmDeleteLogo'))) {
      setLogoUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      showToast(t('logoDeletedSuccess'));
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 2500);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateDairyInfo({
      appName: appName.trim() || 'PaalVandi',
      farmName: farmName.trim() || 'dheena dhinesh farming',
      ownerName: ownerName.trim() || dairyInfo.ownerName,
      upiId: upiId.trim() || dairyInfo.upiId,
      logoUrl: logoUrl,
      logoEmoji: logoEmoji,
    });
    onClose();
  };

  // Render into document.body via Portal to escape any header backdrop-filter containing block!
  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      
      {/* 1. Full-screen dark backdrop overlay that completely hides/covers navbar and background */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 2. FULL-HEIGHT LEFT-SIDE SLIDE-OVER DRAWER (From Top to Bottom) */}
      <aside className="fixed inset-y-0 left-0 h-screen w-full sm:w-[450px] bg-white shadow-2xl z-[10000] flex flex-col justify-between border-r border-slate-200 animate-in slide-in-from-left duration-300 ease-out">
        
        {/* Toast Alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg z-20 flex items-center space-x-1.5 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header (Top of Left Drawer) */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-slate-50 flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base leading-tight">
                {t('editBrandLogo')}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {t('editBrandLogoDesc')}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center transition shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Compact, No Ugly Scrollbars, Everything Visible */}
        <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between p-4 overflow-y-auto no-scrollbar space-y-3">
          
          <div className="space-y-3">
            {/* Live Preview Box */}
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200 space-y-1">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                {t('livePreview')}
              </span>
              <div className="flex items-center space-x-3 bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-sm">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-200 overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Custom Logo" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">{logoEmoji}</span>
                  )}
                </div>
                <div className="truncate">
                  <div className="flex items-center space-x-1.5">
                    <h4 className="font-extrabold text-base text-slate-900 tracking-tight truncate">
                      {appName || 'PaalVandi'}
                    </h4>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-100 text-emerald-800">
                      Live
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium truncate">
                    {farmName || 'dheena dhinesh farming'}
                  </p>
                </div>
              </div>
            </div>

            {/* Logo Upload & Delete Buttons */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                லோகோ படம் (Logo Photo):
              </label>
              
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="portal-logo-upload-input"
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold transition shadow-sm active:scale-95"
                >
                  <Camera className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{logoUrl ? 'லோகோ மாற்றுக' : t('uploadLogoPhoto')}</span>
                </button>

                {logoUrl ? (
                  <button
                    type="button"
                    onClick={handleDeleteLogo}
                    className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-extrabold transition shadow-sm active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>{t('deleteLogoPhoto')}</span>
                  </button>
                ) : (
                  <div className="text-[10px] text-slate-400 flex items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    JPG, PNG, WebP
                  </div>
                )}
              </div>
            </div>

            {/* Preset Emoji Picker */}
            <div>
              <span className="text-[11px] font-bold text-slate-700 block mb-1">
                {t('choosePresetIcon')}
              </span>
              <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5 no-scrollbar">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setLogoEmoji(emoji);
                      setLogoUrl(null); // Switch to emoji mode
                    }}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-base transition border flex-shrink-0 ${
                      !logoUrl && logoEmoji === emoji
                        ? 'bg-amber-100 border-amber-400 scale-105 shadow-sm'
                        : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs: Brand Name & Farm Subtitle */}
            <div className="space-y-2.5 pt-1 border-t border-slate-100">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  {t('brandNameLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder={lang === 'ta' ? 'ஆப் பெயர் உள்ளிடவும்' : 'Enter app name'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-0.5">
                  {t('farmSubtitleLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  placeholder={lang === 'ta' ? 'பண்ணை பெயர் உள்ளிடவும்' : 'Enter dairy farm name'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                    {t('ownerNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-700 block mb-0.5">
                    {t('upiIdLabel')}
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold font-mono text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Bottom Actions: Placed at the very end after all fields */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-200 transition active:scale-95 flex items-center justify-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveBtn')}</span>
            </button>
          </div>

        </form>

      </aside>

    </div>,
    document.body
  );
}
