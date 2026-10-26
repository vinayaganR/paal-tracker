// Vercel Serverless Function for Extra Milk Requests
// Handles Customer Requests, Vendor Notifications, and Vendor Accept/Reject Responses

// In-memory request store for fast cloud synchronization
let inMemoryRequests = [
  {
    id: "req_demo_1",
    customerId: "cust_1",
    customerName: "முத்துசாமி (Muthusamy)",
    houseNo: "14/A",
    phone: "9840112345",
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    shift: "MORNING",
    extraLitres: 1.0,
    reason: "Guests visiting (விருந்தினர் வருகை)",
    status: "PENDING",
    createdAt: new Date().toISOString()
  }
];

export default function handler(req, res) {
  // Set CORS headers
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

  // GET: Fetch all extra milk requests
  if (req.method === 'GET') {
    const { customerId, status } = req.query;
    let filtered = [...inMemoryRequests];
    if (customerId) {
      filtered = filtered.filter(r => r.customerId === customerId);
    }
    if (status) {
      filtered = filtered.filter(r => r.status === status);
    }
    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  }

  // POST: Customer submits a new Extra Milk request (status = PENDING)
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { customerId, customerName, houseNo, phone, date, shift, extraLitres, reason } = body;

      if (!customerId || !date || !extraLitres) {
        return res.status(400).json({ success: false, message: 'Missing required request fields' });
      }

      const newRequest = {
        id: `req_${Date.now()}`,
        customerId,
        customerName: customerName || 'Valued Customer',
        houseNo: houseNo || '—',
        phone: phone || '',
        date,
        shift: shift || 'MORNING',
        extraLitres: Number(extraLitres),
        reason: reason || 'Special requirement',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      inMemoryRequests.unshift(newRequest);

      // Trigger notification for Dairy Owner
      try {
        const notifPayload = {
          title: '🥛 புதிய கூடுதல் பால் கோரிக்கை!',
          message: `${newRequest.customerName} (${newRequest.houseNo}) ${newRequest.shift === 'MORNING' ? 'காலை' : 'மாலை'} ஷிப்டுக்கு +${newRequest.extraLitres}L கூடுதல் பால் கேட்டுள்ளார்!`,
          targetRole: 'ADMIN',
          type: 'EXTRA_REQUEST_CREATED',
          payload: newRequest
        };
        // Fire-and-forget internal dispatch if running on same server instance
        fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifPayload)
        }).catch(() => {});
      } catch (err) {}

      return res.status(201).json({
        success: true,
        message: 'Extra milk request submitted. Waiting for vendor approval.',
        data: newRequest
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // PUT / PATCH: Vendor accepts or rejects the request
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, status, vendorNote } = body;

      if (!requestId || !status) {
        return res.status(400).json({ success: false, message: 'Missing requestId or status' });
      }

      const index = inMemoryRequests.findIndex(r => r.id === requestId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      inMemoryRequests[index] = {
        ...inMemoryRequests[index],
        status, // 'ACCEPTED' or 'REJECTED'
        vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Milk is available, will deliver!' : 'Sorry, extra milk is not available for this shift.'),
        respondedAt: new Date().toISOString()
      };

      const updated = inMemoryRequests[index];

      // Trigger notification for Customer
      try {
        const notifPayload = {
          title: status === 'ACCEPTED' ? '🎉 கூடுதல் பால் உறுதி செய்யப்பட்டது!' : 'ℹ️ கூடுதல் பால் கோரிக்கை தகவல்',
          message: status === 'ACCEPTED' 
            ? `உங்கள் ${updated.extraLitres}L பால் கோரிக்கை ஏற்கப்பட்டது. விநியோகம் செய்யப்படும்!` 
            : `மன்னிக்கவும், ${updated.shift} ஷிப்டுக்கு கூடுதல் பால் இருப்பு இல்லை.`,
          targetRole: 'CUSTOMER',
          targetUserId: updated.customerId,
          type: 'EXTRA_REQUEST_RESPONDED',
          payload: updated
        };
        fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifPayload)
        }).catch(() => {});
      } catch (err) {}

      return res.status(200).json({
        success: true,
        message: `Request ${status.toLowerCase()} by farm vendor.`,
        data: inMemoryRequests[index]
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
