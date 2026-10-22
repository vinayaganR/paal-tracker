import React, { useState, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Upload, 
  Trash2, 
  Sparkles, 
  Check, 
  X, 
  Image as ImageIcon,
  Camera,
  RefreshCw
} from 'lucide-react';

const PRESET_EMOJIS = ['🥛', '🐄', '🐮', '🌾', '🧈', '🚜', '🧀', '🍶'];

export default function BrandLogoModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { dairyInfo, updateDairyInfo } = useAuth();

  const [appName, setAppName] = useState(dairyInfo?.appName || 'PaalVandi');
  const [farmName, setFarmName] = useState(dairyInfo?.farmName || 'dheena dhinesh farming');
  const [logoUrl, setLogoUrl] = useState(dairyInfo?.logoUrl || null);
  const [logoEmoji, setLogoEmoji] = useState(dairyInfo?.logoEmoji || '🥛');
  const [toastMessage, setToastMessage] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  // Handle Image Upload & Canvas Resizing (Max 256x256 for optimal performance)
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
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateDairyInfo({
      appName: appName.trim() || 'PaalVandi',
      farmName: farmName.trim() || 'dheena dhinesh farming',
      logoUrl: logoUrl,
      logoEmoji: logoEmoji,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 text-slate-900 relative my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Toast alert */}
        {toastMessage && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-lg z-10 flex items-center space-x-1.5 animate-bounce">
            <Sparkles className="w-4 h-4" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="font-black text-slate-900 text-lg flex items-center space-x-2">
              <span>{t('editBrandLogo')}</span>
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {t('editBrandLogoDesc')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Box */}
        <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            {t('livePreview')}
          </span>
          <div className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center shadow-md shadow-emerald-200 overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Custom Logo" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl">{logoEmoji}</span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h4 className="font-extrabold text-base text-slate-900 tracking-tight">
                  {appName || 'PaalVandi'}
                </h4>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {farmName || 'dheena dhinesh farming'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          
          {/* Logo Upload & Delete Actions */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              லோகோ படம் (Logo Photo):
            </label>
            
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="logo-upload-input"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-extrabold transition shadow-sm"
              >
                <Camera className="w-4 h-4 text-emerald-700" />
                <span>{logoUrl ? 'லோகோ மாற்றுக (Change)' : t('uploadLogoPhoto')}</span>
              </button>

              {logoUrl && (
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="flex items-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold transition shadow-sm"
                  title={t('deleteLogoPhoto')}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('deleteLogoPhoto')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Preset Emoji Picker (if not using custom photo or as fallback) */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-700 block">
              {t('choosePresetIcon')}
            </span>
            <div className="flex items-center space-x-2 overflow-x-auto py-1">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setLogoEmoji(emoji);
                    setLogoUrl(null); // Switch to emoji mode
                  }}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition border ${
                    !logoUrl && logoEmoji === emoji
                      ? 'bg-amber-100 border-amber-400 scale-110 shadow-sm'
                      : 'bg-slate-100 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Brand Name Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t('brandNameLabel')} *
            </label>
            <input
              type="text"
              required
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              placeholder="e.g. PaalVandi or Dheena Dairy"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Subtitle / Farm Tagline Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              {t('farmSubtitleLabel')} *
            </label>
            <input
              type="text"
              required
              value={farmName}
              onChange={(e) => setFarmName(e.target.value)}
              placeholder="e.g. dheena dhinesh farming"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-200 transition active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveBtn')}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
