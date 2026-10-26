// PaalVandi Web Notification & Real-Time Sync Service
// Uses Web Notification API, Web Audio API chime, and Cloud Polling
import { db, isRealFirebase } from '../config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getApiBaseUrl } from '../config/apiConfig';

let isInitialized = false;
let currentDeviceToken = null;
let pollInterval = null;
const processedNotificationIds = new Set();
let lastKnownTimestamp = new Date(Date.now() - 3600000).toISOString();

export const notificationService = {
  // Initialize notification permissions and cloud sync
  init: async (currentUser, onNotificationTap = null) => {
    if (!currentUser) return;

    try {
      await notificationService.setupWebNotifications(currentUser);

      // Start cross-device cloud sync poller (works across separate phones/browsers)
      notificationService.startCloudSyncPoller(currentUser);
      isInitialized = true;
    } catch (e) {
      console.warn('Notification init notice:', e);
    }
  },

  // Setup Browser Notifications
  setupWebNotifications: async (currentUser) => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission().catch(() => {});
        }
      }

      // Generate or retrieve persistent web device token
      let webToken = localStorage.getItem('paal_vandi_web_device_token');
      if (!webToken) {
        webToken = `web_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        localStorage.setItem('paal_vandi_web_device_token', webToken);
      }
      currentDeviceToken = webToken;
      notificationService.saveDeviceToken(webToken, currentUser, 'web');
    } catch (err) {
      console.warn('Web notification setup note:', err);
    }
  },

  // Save device token to Firestore and Backend Server
  saveDeviceToken: async (token, currentUser, platform = 'web') => {
    if (!token || !currentUser) return;

    const userId = currentUser.role === 'ADMIN' 
      ? 'owner' 
      : (currentUser.customer?.id || currentUser.id || 'unknown');
    
    const phone = currentUser.role === 'ADMIN'
      ? (currentUser.phone || '')
      : (currentUser.customer?.phone || currentUser.phone || '');

    const tokenData = {
      token,
      userId,
      role: currentUser.role, // 'ADMIN' or 'CUSTOMER'
      phone,
      platform,
      active: true,
      lastSeen: new Date().toISOString()
    };

    // 1. Sync to Firebase Firestore if connected
    if (isRealFirebase && db) {
      try {
        const tokenRef = doc(db, 'device_tokens', token);
        await setDoc(tokenRef, tokenData, { merge: true });
      } catch (e) {
        console.warn('Firestore token save note:', e.message);
      }
    }

    // 2. Sync to Backend API
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/device-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tokenData)
      });
    } catch (e) { /* offline fallback */ }
  },

  // Unregister device token on logout
  unregister: async (currentUser) => {
    try {
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }

      if (currentDeviceToken) {
        // Mark inactive in Firestore
        if (isRealFirebase && db) {
          try {
            const tokenRef = doc(db, 'device_tokens', currentDeviceToken);
            await updateDoc(tokenRef, { active: false, unmountedAt: new Date().toISOString() });
          } catch (e) {}
        }

        // Unregister from Backend API
        try {
          const baseUrl = getApiBaseUrl();
          await fetch(`${baseUrl}/api/device-tokens`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: currentDeviceToken })
          });
        } catch (e) {}

        currentDeviceToken = null;
      }
      isInitialized = false;
    } catch (err) {
      console.warn('Unregister error:', err);
    }
  },

  // Audio Chime using Web Audio API for website and mobile browser
  playAudioChime: () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now); // E5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.12); // A5
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch (e) {}
  },

  // Show a notification on the web browser with sound chime
  showLocalNotification: async ({ title, body, data = {} }) => {
    try {
      // Always play audio chime on web
      notificationService.playAudioChime();

      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/cow-transparent.png',
          data
        });
      }
    } catch (err) {
      console.warn('Notification error:', err);
    }
  },

  // Trigger cross-device push notification via backend API
  sendPushNotification: async ({ targetRole, targetUserId, title, body, type, payload }) => {
    try {
      const payloadData = {
        title,
        message: body,
        targetRole,
        targetUserId,
        type,
        payload
      };

      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/api/send-notification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData)
      });
    } catch (err) {
      console.warn('Push dispatch error:', err);
    }
  },

  // Cloud sync poller: polls backend every 3 seconds to fetch any new cross-device requests/notifications
  startCloudSyncPoller: (currentUser) => {
    if (pollInterval) clearInterval(pollInterval);

    pollInterval = setInterval(async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const role = currentUser.role;
        const userId = currentUser.role === 'ADMIN' ? 'owner' : (currentUser.customer?.id || currentUser.id);
        
        const res = await fetch(`${baseUrl}/api/send-notification?targetRole=${role}&targetUserId=${userId}&since=${encodeURIComponent(lastKnownTimestamp)}`);
        if (!res.ok) return;

        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
          for (const item of result.data) {
            if (item.id && processedNotificationIds.has(item.id)) continue;
            if (item.id) processedNotificationIds.add(item.id);
            if (item.timestamp && new Date(item.timestamp) > new Date(lastKnownTimestamp)) {
              lastKnownTimestamp = item.timestamp;
            }

            // Display heads-up notification with audio chime
            await notificationService.showLocalNotification({
              title: item.title,
              body: item.message,
              data: { type: item.type, payload: item.payload }
            });

            // Dispatch internal event to update UI immediately
            notificationService.dispatchInAppEvent({ type: item.type, payload: item.payload });
          }
        }
      } catch (e) {
        // silent fallback
      }
    }, 3000);
  },

  // Dispatch event to local window listeners
  dispatchInAppEvent: (data) => {
    if (typeof window !== 'undefined' && data) {
      window.dispatchEvent(new CustomEvent('paal_vandi_notification', { detail: data }));
    }
  }
};
