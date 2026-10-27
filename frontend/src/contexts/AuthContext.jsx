import React, { createContext, useContext, useState, useEffect } from 'react';
import { dairyService } from '../services/dairyService';
import { notificationService } from '../services/notificationService';
import { getApiBaseUrl } from '../config/apiConfig';

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

  // Login as Dairy Owner / Appa with server authentication and offline fallback
  const loginAsOwner = async (phoneOrPin, passwordOrOtp = null, isOtpMode = false) => {
    const inputPhone = (phoneOrPin || '').replace(/[^0-9]/g, '');
    const cleanSecret = passwordOrOtp || phoneOrPin;

    // 1. Try server-side authentication
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'owner-login',
          phone: inputPhone,
          pin: cleanSecret,
          otp: cleanSecret,
          isOtpMode
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.user) {
          setCurrentUser(json.user);
          return { success: true, user: json.user };
        }
      } else {
        const errJson = await res.json().catch(() => null);
        if (errJson?.error) {
          return { success: false, error: errJson.error, message: errJson.message };
        }
      }
    } catch (e) {
      // Offline fallback
    }

    // 2. Offline / Local fallback validation
    if (isOtpMode) {
      if (cleanSecret === '1234' || (cleanSecret && cleanSecret.length >= 4)) {
        const user = { role: ROLES.ADMIN, name: dairyInfo.ownerName, phone: dairyInfo.phone };
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, error: 'INVALID_OTP' };
    } else {
      if (cleanSecret === (dairyInfo.ownerPin || "1234")) {
        const user = { role: ROLES.ADMIN, name: dairyInfo.ownerName, phone: dairyInfo.phone };
        setCurrentUser(user);
        return { success: true, user };
      }
      return { success: false, error: 'INVALID_PASSWORD' };
    }
  };

  // Login as Customer (by Phone number or ID) with automatic real-time Database sync
  const loginAsCustomer = async (phoneOrId) => {
    const cleanQuery = phoneOrId.trim();

    // 1. First try server-side database authentication
    try {
      const baseUrl = getApiBaseUrl();
      const res = await fetch(`${baseUrl}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'customer-login',
          phone: cleanQuery
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.customer) {
          const user = {
            role: ROLES.CUSTOMER,
            customer: json.customer
          };
          dairyService.saveCustomer(json.customer);
          setCurrentUser(user);
          return { success: true, customer: json.customer };
        }
      }
    } catch (e) {
      // Offline fallback
    }

    // 2. Sync from server/database
    let customers = await dairyService.syncCustomers().catch(() => dairyService.getCustomers());
    if (!customers || customers.length === 0) {
      customers = dairyService.getCustomers();
    }

    const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
    
    let matched = customers.find(c => 
      c.id === cleanQuery || 
      (digitsOnly.length >= 4 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(digitsOnly)) ||
      (c.name && c.name.toLowerCase().includes(cleanQuery.toLowerCase()))
    );

    // 3. Direct fallback to DB API endpoint if still not found
    if (!matched) {
      try {
        const baseUrl = getApiBaseUrl();
        const res = await fetch(`${baseUrl}/api/customers`);
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json?.data && Array.isArray(json.data) ? json.data : []);
          matched = list.find(c => 
            c.id === cleanQuery || 
            (digitsOnly.length >= 4 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(digitsOnly)) ||
            (c.name && c.name.toLowerCase().includes(cleanQuery.toLowerCase()))
          );
          if (matched) {
            dairyService.saveCustomer(matched);
          }
        }
      } catch (e) {}
    }

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
