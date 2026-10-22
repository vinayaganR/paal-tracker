// Vercel Serverless Function for Customer Leave / Pause Delivery Requests
// Handles Customer Leave Requests, Shift selections (Morning / Evening / Full Day), and Vendor Responses

let inMemoryLeaveRequests = [
  {
    id: "leave_demo_1",
    customerId: "cust_2",
    customerName: "சுந்தரம் ஆசிரியர் (Sundaram)",
    houseNo: "28",
    phone: "9789223456",
    fromDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    shift: "BOTH", // 'BOTH' | 'MORNING' | 'EVENING'
    reason: "Going to native town (சொந்த ஊர் பயணம்)",
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

  // GET: Fetch all leave requests
  if (req.method === 'GET') {
    const { customerId, status } = req.query;
    let filtered = [...inMemoryLeaveRequests];
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

  // POST: Customer submits a new Leave / Pause Delivery request
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { customerId, customerName, houseNo, phone, fromDate, toDate, shift, reason } = body;

      if (!customerId || !fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'Missing required leave fields' });
      }

      const newLeave = {
        id: `leave_${Date.now()}`,
        customerId,
        customerName: customerName || 'Valued Customer',
        houseNo: houseNo || '—',
        phone: phone || '',
        fromDate,
        toDate,
        shift: shift || 'BOTH',
        reason: reason || 'Personal work / out of town',
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      inMemoryLeaveRequests.unshift(newLeave);

      return res.status(201).json({
        success: true,
        message: 'Leave request submitted to farm vendor.',
        data: newLeave
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // PUT / PATCH: Vendor accepts or rejects the leave request
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, status, vendorNote } = body;

      if (!requestId || !status) {
        return res.status(400).json({ success: false, message: 'Missing requestId or status' });
      }

      const index = inMemoryLeaveRequests.findIndex(r => r.id === requestId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      inMemoryLeaveRequests[index] = {
        ...inMemoryLeaveRequests[index],
        status, // 'ACCEPTED' or 'REJECTED'
        vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Leave noted! Milk will be paused.' : 'Cannot pause delivery at this time.'),
        respondedAt: new Date().toISOString()
      };

      return res.status(200).json({
        success: true,
        message: `Leave request ${status.toLowerCase()} by vendor.`,
        data: inMemoryLeaveRequests[index]
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
