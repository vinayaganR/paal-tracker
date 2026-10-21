import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'ADMIN',         // Appa (Full business owner)
  DELIVERY: 'DELIVERY',   // Morning delivery runner
  CUSTOMER: 'CUSTOMER',   // Individual house customer
};

export function AuthProvider({ children }) {
  const [currentRole, setCurrentRole] = useState(() => {
    return localStorage.getItem('paal_vandi_role') || ROLES.ADMIN;
  });

  // Selected customer ID when viewing in Customer Mode
  const [activeCustomerId, setActiveCustomerId] = useState(() => {
    return localStorage.getItem('paal_vandi_active_customer') || 'cust_1';
  });

  const [dairyInfo, setDairyInfo] = useState(() => {
    const saved = localStorage.getItem('paal_vandi_dairy_info');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      farmName: "ஸ்ரீ காமதேனு பால் பண்ணை",
      ownerName: "மாரிமுத்து (அப்பா)",
      phone: "+91 98421 54321",
      upiId: "dairyfarm@okaxis", // Real UPI ID for GPay / PhonePe QR
      address: "12, காமராஜர் தெரு, பண்ணை தோட்டம்",
      defaultRatePerLitre: 56,
    };
  });

  useEffect(() => {
    localStorage.setItem('paal_vandi_role', currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem('paal_vandi_active_customer', activeCustomerId);
  }, [activeCustomerId]);

  useEffect(() => {
    localStorage.setItem('paal_vandi_dairy_info', JSON.stringify(dairyInfo));
  }, [dairyInfo]);

  const updateDairyInfo = (newInfo) => {
    setDairyInfo(prev => ({ ...prev, ...newInfo }));
  };

  return (
    <AuthContext.Provider value={{
      currentRole,
      setCurrentRole,
      activeCustomerId,
      setActiveCustomerId,
      dairyInfo,
      updateDairyInfo,
      isAdmin: currentRole === ROLES.ADMIN,
      isCustomer: currentRole === ROLES.CUSTOMER,
      isDelivery: currentRole === ROLES.DELIVERY,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
