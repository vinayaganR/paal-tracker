// Vercel Serverless Function for Device Tokens (FCM & Web Push Registrations)
// Maps device tokens to users (Owner / Customers) for reliable multi-device push delivery

let inMemoryDeviceTokens = [];

export default function handler(req, res) {
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

  // GET: Fetch registered tokens (e.g. by role or userId)
  if (req.method === 'GET') {
    const { role, userId, phone } = req.query;
    let filtered = inMemoryDeviceTokens.filter(t => t.active !== false);

    if (role) {
      filtered = filtered.filter(t => t.role === role);
    }
    if (userId) {
      filtered = filtered.filter(t => t.userId === userId);
    }
    if (phone) {
      filtered = filtered.filter(t => t.phone === phone);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  }

  // POST: Register or update device token
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { token, userId, role, phone, platform, deviceName } = body;

      if (!token || !userId || !role) {
        return res.status(400).json({
          success: false,
          message: 'Missing required token fields: token, userId, and role are required.'
        });
      }

      // Check if token already exists; if so, update its user mapping
      const existingIdx = inMemoryDeviceTokens.findIndex(t => t.token === token);
      const tokenEntry = {
        token,
        userId,
        role: role.toUpperCase(), // 'ADMIN' or 'CUSTOMER'
        phone: phone || '',
        platform: platform || 'android',
        deviceName: deviceName || 'Mobile Device',
        active: true,
        lastRegisteredAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        inMemoryDeviceTokens[existingIdx] = tokenEntry;
      } else {
        inMemoryDeviceTokens.push(tokenEntry);
      }

      return res.status(200).json({
        success: true,
        message: 'Device token registered successfully',
        data: tokenEntry
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // DELETE: Unregister or deactivate device token on logout
  if (req.method === 'DELETE') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { token, userId } = body || req.query;

      if (!token && !userId) {
        return res.status(400).json({ success: false, message: 'Token or userId is required to unregister' });
      }

      inMemoryDeviceTokens = inMemoryDeviceTokens.map(t => {
        if ((token && t.token === token) || (userId && t.userId === userId)) {
          return { ...t, active: false, unmountedAt: new Date().toISOString() };
        }
        return t;
      });

      return res.status(200).json({
        success: true,
        message: 'Device token unregistered successfully'
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
