import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { db, isRealFirebase } from '../config/firebase';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { getApiBaseUrl } from '../config/apiConfig';

const NOTIFICATION_CHANNEL_ID = 'paal_vandi_orders';
let isInitialized = false;
let currentDeviceToken = null;
let pollInterval = null;
const processedNotificationIds = new Set();
let lastKnownTimestamp = new Date(Date.now() - 3600000).toISOString();

export const notificationService = {
  // Initialize notification permissions, channels, and listeners
  init: async (currentUser, onNotificationTap = null) => {
    if (!currentUser) return;

    try {
      if (Capacitor.isNativePlatform()) {
        await notificationService.setupNativeChannels();
        await notificationService.setupNativePush(currentUser, onNotificationTap);
      } else {
        await notificationService.setupWebNotifications(currentUser);
      }

      // Start cross-device cloud sync poller (works across separate phones even without live FCM keys)
      notificationService.startCloudSyncPoller(currentUser);
      isInitialized = true;
    } catch (e) {
      console.warn('Notification init notice:', e);
    }
  },

  // Setup Android notification channel with high priority and sound
  setupNativeChannels: async () => {
    try {
      await LocalNotifications.createChannel({
        id: NOTIFICATION_CHANNEL_ID,
        name: 'PaalVandi Orders & Alerts',
        description: 'Instant alerts for extra milk orders and leave requests',
        importance: 5, // High importance (heads-up notification)
        visibility: 1,
        vibration: true,
        lights: true,
        lightColor: '#10B981',
        sound: 'default'
      });
    } catch (err) {
      console.warn('Channel creation error:', err);
    }
  },

  // Setup Native Push & Local Notifications with total crash protection
  setupNativePush: async (currentUser, onNotificationTap) => {
    // 1. Setup Local Notifications first (100% stable, no Google Play/Firebase dependency)
    try {
      if (Capacitor.isPluginAvailable('LocalNotifications')) {
        await LocalNotifications.requestPermissions().catch(() => {});
        await LocalNotifications.removeAllListeners().catch(() => {});
        LocalNotifications.addListener('localNotificationActionPerformed', (action) => {
          try {
            const data = action?.notification?.extra;
            if (onNotificationTap && typeof onNotificationTap === 'function') {
              onNotificationTap(data);
            }
          } catch (e) {}
        });
      }
    } catch (err) {
      console.warn('Local notifications init note:', err);
    }

    // Default fallback token in case PushNotifications is unavailable
    const fallbackToken = `android_device_${Date.now()}`;
    currentDeviceToken = fallbackToken;
    notificationService.saveDeviceToken(fallbackToken, currentUser, 'android');

    // 2. Setup Remote Push Notifications defensively
    try {
      if (Capacitor.isPluginAvailable('PushNotifications')) {
        await PushNotifications.removeAllListeners().catch(() => {});

        // Listen for FCM token registration
        PushNotifications.addListener('registration', (token) => {
          try {
            if (token?.value) {
              console.log('📲 FCM Token received:', token.value);
              currentDeviceToken = token.value;
              notificationService.saveDeviceToken(token.value, currentUser, 'android');
            }
          } catch (e) {}
        });

        PushNotifications.addListener('registrationError', (error) => {
          console.warn('FCM registration error (handled safely):', error);
        });

        // Listen for incoming notifications when app is in FOREGROUND
        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          try {
            console.log('🔔 Push notification received:', notification);
            await notificationService.showLocalNotification({
              title: notification.title || '🥛 PaalVandi Alert',
              body: notification.body || '',
              data: notification.data || {}
            });
            notificationService.dispatchInAppEvent(notification.data);
          } catch (e) {}
        });

        // Listen for notification TAPPED by user in notification tray
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          try {
            console.log('👉 Push notification tapped:', action);
            const data = action?.notification?.data;
            if (onNotificationTap && typeof onNotificationTap === 'function') {
              onNotificationTap(data);
            } else if (data?.url) {
              window.location.href = data.url;
            }
          } catch (e) {}
        });

        // Check & request remote push permissions safely
        let permStatus = await PushNotifications.checkPermissions().catch(() => ({ receive: 'prompt' }));
        if (permStatus?.receive !== 'granted') {
          permStatus = await PushNotifications.requestPermissions().catch(() => ({ receive: 'denied' }));
        }

        if (permStatus?.receive === 'granted') {
          // Wrap register in safe catch so missing Google Play Services never crashes the process
          await PushNotifications.register().catch(err => {
            console.warn('Push register notice (safely bypassed):', err);
          });
        }
      }
    } catch (err) {
      console.warn('Native push setup notice (safely caught):', err);
    }
  },

  // Web Browser / PWA Notification Setup
  setupWebNotifications: async (currentUser) => {
    try {
      if ('Notification' in window) {
        if (Notification.permission === 'default') {
          await Notification.requestPermission();
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
  saveDeviceToken: async (token, currentUser, platform = 'android') => {
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
        console.log('✅ Token saved to Firestore:', tokenData.role, tokenData.userId);
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

  // Show a local notification on the phone / browser with sound & vibration
  showLocalNotification: async ({ title, body, data = {} }) => {
    try {
      // Always play audio chime on web
      notificationService.playAudioChime();

      if (Capacitor.isNativePlatform()) {
        const notifId = Math.floor(Math.random() * 1000000);
        await LocalNotifications.schedule({
          notifications: [
            {
              id: notifId,
              title,
              body,
              channelId: NOTIFICATION_CHANNEL_ID,
              sound: 'default',
              smallIcon: 'ic_launcher',
              extra: data,
              schedule: { at: new Date(Date.now() + 100) }
            }
          ]
        });
      } else if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/cow-transparent.png',
          data
        });
      }
    } catch (err) {
      console.warn('Local notification error:', err);
    }
  },

  // Trigger cross-device push notification
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

      // 1. Post to Serverless Push Dispatcher
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

            // Display heads-up local notification on device
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
