// Vercel Serverless Function for Extra Milk Requests
// Handles Customer Requests, Vendor Notifications, and Vendor Accept/Reject Responses
import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_FILE = path.join(os.tmpdir(), 'paal_vandi_extra_requests.json');
const DB_FILE = [
  path.resolve(process.cwd(), 'data', 'db.json'),
  path.resolve(process.cwd(), '..', 'data', 'db.json'),
  path.resolve('d:/milkdelivery/data/db.json')
].find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'data', 'db.json');

const INITIAL_REQUESTS = [
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

let inMemoryRequests = null;

function loadRequests() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      if (db.extraRequests && Array.isArray(db.extraRequests)) {
        inMemoryRequests = db.extraRequests;
        return inMemoryRequests;
      }
    }
  } catch (e) {}

  if (inMemoryRequests && inMemoryRequests.length > 0) return inMemoryRequests;
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      inMemoryRequests = JSON.parse(data);
    }
  } catch (e) {}
  if (!inMemoryRequests || inMemoryRequests.length === 0) {
    inMemoryRequests = [...INITIAL_REQUESTS];
  }
  return inMemoryRequests;
}

function saveRequests(list) {
  inMemoryRequests = list;
  try {
    if (fs.existsSync(DB_FILE)) {
      const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      db.extraRequests = list;
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
    }
  } catch (e) {}
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list), 'utf-8');
  } catch (e) {}
}

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

  const requests = loadRequests();

  // GET: Fetch all extra milk requests
  if (req.method === 'GET') {
    const { customerId, status } = req.query;
    let filtered = [...requests];
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
      const { id, customerId, customerName, houseNo, phone, date, shift, extraLitres, reason } = body;

      if (!customerId || !date || !extraLitres) {
        return res.status(400).json({ success: false, message: 'Missing required request fields' });
      }

      // Deduplication: Check if a request already exists with this ID or (customerId + date + shift)
      const existingIndex = requests.findIndex(r => 
        (id && r.id === id) ||
        (r.customerId === customerId && r.date === date && r.shift === (shift || 'MORNING'))
      );

      const resolvedId = id || (existingIndex >= 0 ? requests[existingIndex].id : `req_${Date.now()}`);
      const newRequest = {
        id: resolvedId,
        customerId,
        customerName: customerName || (existingIndex >= 0 ? requests[existingIndex].customerName : 'Valued Customer'),
        houseNo: houseNo || (existingIndex >= 0 ? requests[existingIndex].houseNo : '—'),
        phone: phone || (existingIndex >= 0 ? requests[existingIndex].phone : ''),
        date,
        shift: shift || 'MORNING',
        extraLitres: Number(extraLitres),
        reason: reason || (existingIndex >= 0 ? requests[existingIndex].reason : 'Special requirement'),
        status: (existingIndex >= 0 && requests[existingIndex].status !== 'PENDING') ? requests[existingIndex].status : 'PENDING',
        vendorNote: existingIndex >= 0 ? requests[existingIndex].vendorNote : '',
        createdAt: (existingIndex >= 0 ? requests[existingIndex].createdAt : null) || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        requests[existingIndex] = { ...requests[existingIndex], ...newRequest };
      } else {
        requests.unshift(newRequest);
      }
      saveRequests(requests);

      // Trigger notification for Dairy Owner
      try {
        const notifPayload = {
          title: '🥛 புதிய கூடுதல் பால் கோரிக்கை!',
          message: `${newRequest.customerName} (${newRequest.houseNo}) ${newRequest.shift === 'MORNING' ? 'காலை' : 'மாலை'} ஷிப்டுக்கு +${newRequest.extraLitres}L கூடுதல் பால் கேட்டுள்ளார்!`,
          targetRole: 'ADMIN',
          type: 'EXTRA_REQUEST_CREATED',
          payload: newRequest
        };
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

      const index = requests.findIndex(r => r.id === requestId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

      requests[index] = {
        ...requests[index],
        status, // 'ACCEPTED' or 'REJECTED'
        vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Milk is available, will deliver!' : 'Sorry, extra milk is not available for this shift.'),
        respondedAt: new Date().toISOString()
      };

      const updated = requests[index];
      saveRequests(requests);

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
        data: updated
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
