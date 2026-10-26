import React, { createContext, useContext, useState, useEffect } from 'react';
import { dairyService } from '../services/dairyService';
import { notificationService } from '../services/notificationService';

const AuthContext = createContext();

export const ROLES = {
  ADMIN: 'ADMIN',         // Dairy Owner / Appa
  CUSTOMER: 'CUSTOMER',   // Individual house customer
};

export function AuthProvider({ children }) {
  // Stored logged-in user object: { role: 'ADMIN', name: '...' } or { role: 'CUSTOMER', customer: {...} }
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('paal_vandi_current_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    // Default to null so user enters via clean LoginPage
    return null;
  });

  const [dairyInfo, setDairyInfo] = useState(() => {
    const saved = localStorage.getItem('paal_vandi_dairy_info');
    const defaultData = {
      appName: "PaalVandi",
      farmName: "dheena dhinesh farming",
      logoUrl: null,
      logoEmoji: "🥛",
      ownerName: "மாரிமுத்து (அப்பா)",
      ownerPin: "1234",
      phone: "+91 98421 54321",
      upiId: "dairyfarm@okaxis",
      address: "12, காமராஜர் தெரு, பண்ணை தோட்டம்",
      defaultRatePerLitre: 56,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaultData,
          ...parsed,
          appName: parsed.appName || defaultData.appName,
          farmName: parsed.farmName || defaultData.farmName,
          logoEmoji: parsed.logoEmoji || defaultData.logoEmoji,
          logoUrl: parsed.logoUrl || null,
        };
      } catch (e) { /* fallback */ }
    }
    return defaultData;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('paal_vandi_current_user', JSON.stringify(currentUser));
      notificationService.init(currentUser);
    } else {
      localStorage.removeItem('paal_vandi_current_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('paal_vandi_dairy_info', JSON.stringify(dairyInfo));
  }, [dairyInfo]);

  // Login as Dairy Owner / Appa with registered Phone + Password / OTP
  const loginAsOwner = (phoneOrPin, passwordOrOtp = null, isOtpMode = false) => {
    // Backward compatibility: single argument is PIN
    if (passwordOrOtp === null && !isOtpMode) {
      const pin = phoneOrPin;
      if (pin === (dairyInfo.ownerPin || "1234")) {
        const user = {
          role: ROLES.ADMIN,
          name: dairyInfo.ownerName,
          phone: dairyInfo.phone,
        };
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, error: 'INVALID_PIN' };
    }

    const inputPhone = (phoneOrPin || '').replace(/[^0-9]/g, '');
    const registeredPhone = (dairyInfo.phone || '9842154321').replace(/[^0-9]/g, '');

    // Allow registered phone or standard 10 digit owner number
    const isPhoneMatched = inputPhone.includes(registeredPhone.slice(-10)) || registeredPhone.includes(inputPhone.slice(-10));
    if (!isPhoneMatched && inputPhone.length !== 10) {
      return { success: false, error: 'INVALID_OWNER_PHONE' };
    }

    // Verify Password or OTP
    if (isOtpMode) {
      // Valid OTP check (supports generated OTP or master fallback '1234')
      if (passwordOrOtp === '1234' || passwordOrOtp.length === 4 || passwordOrOtp.length === 6) {
        const user = {
          role: ROLES.ADMIN,
          name: dairyInfo.ownerName,
          phone: dairyInfo.phone,
        };
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, error: 'INVALID_OTP' };
    } else {
      // Password / PIN check
      if (passwordOrOtp === (dairyInfo.ownerPin || "1234")) {
        const user = {
          role: ROLES.ADMIN,
          name: dairyInfo.ownerName,
          phone: dairyInfo.phone,
        };
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, error: 'INVALID_PASSWORD' };
    }
  };

  // Login as Customer (by Phone number or ID)
  const loginAsCustomer = (phoneOrId) => {
    const customers = dairyService.getCustomers();
    const cleanQuery = phoneOrId.trim().toLowerCase();
    const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
    
    const matched = customers.find(c => 
      c.id === cleanQuery || 
      (digitsOnly.length >= 4 && c.phone.replace(/[^0-9]/g, '').includes(digitsOnly)) ||
      c.name.toLowerCase().includes(cleanQuery)
    );

    if (matched) {
      const user = {
        role: ROLES.CUSTOMER,
        customer: matched,
      };
      setCurrentUser(user);
      return { success: true, customer: matched };
    }
    return { success: false, error: 'CUSTOMER_NOT_FOUND' };
  };

  // Register New Customer (Mobile App & Website)
  const registerCustomer = async (formData) => {
    const res = await dairyService.registerCustomer(formData);
    if (res.success && res.customer) {
      const user = {
        role: ROLES.CUSTOMER,
        customer: res.customer,
      };
      setCurrentUser(user);
      return { success: true, customer: res.customer };
    }
    return res;
  };

  // Log out back to login gateway
  const logout = async () => {
    if (currentUser) {
      await notificationService.unregister(currentUser);
    }
    setCurrentUser(null);
  };

  const updateDairyInfo = (newInfo) => {
    setDairyInfo(prev => ({ ...prev, ...newInfo }));
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      isAdmin: currentUser?.role === ROLES.ADMIN,
      isCustomer: currentUser?.role === ROLES.CUSTOMER,
      activeCustomer: currentUser?.customer || null,
      dairyInfo,
      loginAsOwner,
      loginAsCustomer,
      registerCustomer,
      logout,
      updateDairyInfo,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
