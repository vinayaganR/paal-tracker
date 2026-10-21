import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ta: {
    appName: "பால்வண்டி",
    appSubtitle: "நேரடி பண்ணைப்பால் மேலாண்மை",
    farmName: "ஸ்ரீ காமதேனு பசும்பால் பண்ணை",
    morning: "காலை",
    evening: "மாலை",
    delivered: "போட்டாச்சு",
    pending: "போடணும்",
    skipped: "லீவு (வாங்கல)",
    extra: "கூடுதல்",
    todayDelivery: "இன்றைய விநியோகம்",
    routeRunner: "ரூட் டெலிவரி",
    customers: "வாடிக்கையாளர்கள்",
    billing: "மாதாந்திர பில்",
    milkingStock: "கரவை கணக்கு",
    customerPortal: "வாடிக்கையாளர் பக்கம்",
    deliveryStatus: "விநியோக நிலை",
    litres: "லிட்டர்",
    rupees: "₹",
    searchCustomer: "வாடிக்கையாளர் பெயர் / கதவு எண் தேடுக...",
    allDone: "அனைத்து வீடுகளுக்கும் பால் போட்டாச்சு! 🎉",
    markDelivered: "போட்டாச்சு ✅",
    markSkipped: "லீவு ⏸️",
    addExtraMilk: "+ பால் சேர்க்க",
    totalDelivered: "மொத்தம் போட்டது",
    totalRemaining: "மீதம் போடவேண்டியது",
    housesCompleted: "வீடுகள் முடிந்தது",
    houseNo: "கதவு எண்",
    street: "தெரு / பகுதி",
    phone: "தொலைபேசி",
    ratePerLitre: "லிட்டர் விலை",
    defaultMorning: "வழக்கமான காலை அளவு",
    defaultEvening: "வழக்கமான மாலை அளவு",
    saveCustomer: "வாடிக்கையாளரை சேமிக்க",
    addCustomer: "புதிய வாடிக்கையாளர் சேர்க்க",
    billMonth: "பில் மாதம்",
    totalAmount: "மொத்த தொகை",
    paid: "செலுத்தியது",
    balanceDue: "பாக்கி தொகை",
    sendWhatsApp: "வாட்ஸ்அப்பில் அனுப்ப",
    payUPI: "UPI மூலம் செலுத்த",
    pauseDelivery: "லீவு பதிவு (பால் நிறுத்த)",
    requestExtra: "கூடுதல் பால் கேட்க",
    adminMode: "பண்ணை நிர்வாகி (அப்பா)",
    customerMode: "வாடிக்கையாளர்",
    roleSwitchNotice: "பார்வை மாற்றுக:",
    pureCowMilk: "100% தூய பசும்பால்",
    todayMilkingYield: "இன்றைய மொத்த கரவை",
    directFromCow: "கலப்படமில்லா கறந்த பால்",
    notes: "குறிப்புகள்",
    close: "மூடுக",
    confirm: "உறுதி செய்",
    vacationSuccess: "லீவு வெற்றிகரமாக பதிவு செய்யப்பட்டது!",
    extraSuccess: "கூடுதல் பால் கோரிக்கை பதிவு செய்யப்பட்டது!",
  },
  en: {
    appName: "PaalVandi",
    appSubtitle: "Direct Farm Milk Delivery",
    farmName: "Sri Kamadhenu Dairy Farm",
    morning: "Morning",
    evening: "Evening",
    delivered: "Delivered",
    pending: "Pending",
    skipped: "Skipped / Leave",
    extra: "Extra",
    todayDelivery: "Today's Delivery",
    routeRunner: "Route Runner",
    customers: "Customers",
    billing: "Monthly Billing",
    milkingStock: "Milking Stock",
    customerPortal: "Customer View",
    deliveryStatus: "Delivery Status",
    litres: "Litres",
    rupees: "₹",
    searchCustomer: "Search name or house #...",
    allDone: "All houses delivered today! 🎉",
    markDelivered: "Delivered ✅",
    markSkipped: "Skip / Leave ⏸️",
    addExtraMilk: "+ Extra Milk",
    totalDelivered: "Total Delivered",
    totalRemaining: "Remaining",
    housesCompleted: "Houses Completed",
    houseNo: "House #",
    street: "Street / Area",
    phone: "Phone",
    ratePerLitre: "Rate / Litre",
    defaultMorning: "Default Morning Qty",
    defaultEvening: "Default Evening Qty",
    saveCustomer: "Save Customer",
    addCustomer: "Add New Customer",
    billMonth: "Billing Month",
    totalAmount: "Total Amount",
    paid: "Paid",
    balanceDue: "Balance Due",
    sendWhatsApp: "Send via WhatsApp",
    payUPI: "Pay via UPI",
    pauseDelivery: "Pause / Vacation Request",
    requestExtra: "Request Extra Milk",
    adminMode: "Dairy Owner (Appa)",
    customerMode: "Customer Portal",
    roleSwitchNotice: "Switch View:",
    pureCowMilk: "100% Pure Fresh Cow Milk",
    todayMilkingYield: "Today's Total Milking Yield",
    directFromCow: "Fresh & Unadulterated",
    notes: "Notes",
    close: "Close",
    confirm: "Confirm",
    vacationSuccess: "Vacation dates logged successfully!",
    extraSuccess: "Extra milk request recorded!",
  }
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('paal_vandi_lang') || 'ta');

  useEffect(() => {
    localStorage.setItem('paal_vandi_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ta' ? 'en' : 'ta'));
  };

  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
