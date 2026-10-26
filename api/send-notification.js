// Vercel Serverless Function to Send Push Notifications to Registered Devices
// Dispatches notifications to Owners or Customers across separate physical devices

let notificationHistory = [];

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // GET: Retrieve latest notifications for a specific recipient (role or userId)
  if (req.method === 'GET') {
    const { targetRole, targetUserId, since } = req.query;
    let list = [...notificationHistory];

    if (targetRole) {
      list = list.filter(n => !n.targetRole || n.targetRole === targetRole.toUpperCase());
    }
    if (targetUserId) {
      list = list.filter(n => !n.targetUserId || n.targetUserId === targetUserId);
    }
    if (since) {
      const sinceDate = new Date(since).getTime();
      list = list.filter(n => new Date(n.timestamp).getTime() > sinceDate);
    }

    return res.status(200).json({
      success: true,
      count: list.length,
      data: list.slice(-50).reverse() // Latest 50
    });
  }

  // POST: Send a new notification
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        title,
        message,
        targetRole,    // 'ADMIN' or 'CUSTOMER'
        targetUserId,  // specific customer ID or owner ID
        type,          // 'EXTRA_REQUEST' | 'LEAVE_REQUEST' | 'REQUEST_ACCEPTED' | 'REQUEST_REJECTED'
        payload,
        tokens = []
      } = body;

      if (!title || !message) {
        return res.status(400).json({ success: false, message: 'Title and message are required' });
      }

      const notifItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title,
        message,
        targetRole: targetRole ? targetRole.toUpperCase() : null,
        targetUserId: targetUserId || null,
        type: type || 'GENERAL_ALERT',
        payload: payload || {},
        timestamp: new Date().toISOString(),
        deliveredCount: 0
      };

      // Add to broadcast history
      notificationHistory.push(notifItem);
      if (notificationHistory.length > 200) {
        notificationHistory.shift(); // retain last 200 events
      }

      // If FCM server credentials / key is configured in environment, dispatch to FCM
      const fcmKey = process.env.FCM_SERVER_KEY;
      let fcmResults = [];

      if (fcmKey && tokens && tokens.length > 0) {
        // Dispatch to all device tokens via Google FCM API
        const promises = tokens.map(async (deviceToken) => {
          try {
            const resp = await fetch('https://fcm.googleapis.com/fcm/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${fcmKey}`
              },
              body: JSON.stringify({
                to: deviceToken,
                priority: 'high',
                notification: {
                  title,
                  body: message,
                  sound: 'default',
                  badge: '1',
                  click_action: 'FCM_PLUGIN_ACTIVITY'
                },
                data: {
                  type,
                  payload: JSON.stringify(payload || {})
                }
              })
            });
            const data = await resp.json();
            return { token: deviceToken, success: data.success === 1, response: data };
          } catch (err) {
            return { token: deviceToken, success: false, error: err.message };
          }
        });

        fcmResults = await Promise.all(promises);
        notifItem.deliveredCount = fcmResults.filter(r => r.success).length;
      }

      return res.status(200).json({
        success: true,
        notification: notifItem,
        fcmDispatched: fcmResults.length > 0,
        fcmDetails: fcmResults
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
