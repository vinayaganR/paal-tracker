// Vercel Serverless Function for Customer Leave Requests (Pause Delivery)
// Handles Vacation scheduling, Dairy Owner notifications, and Leave approval workflows
import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_FILE = path.join(os.tmpdir(), 'paal_vandi_leave_requests.json');

const INITIAL_LEAVES = [
  {
    id: "leave_demo_1",
    customerId: "cust_2",
    customerName: "சுந்தரம் ஆசிரியர் (Sundaram)",
    houseNo: "28",
    phone: "9789223456",
    fromDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    toDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    shift: "BOTH",
    reason: "சொந்த ஊர் செல்கிறோம் (Going to native)",
    status: "PENDING",
    createdAt: new Date().toISOString()
  }
];

let inMemoryLeaveRequests = null;

function loadLeaves() {
  if (inMemoryLeaveRequests && inMemoryLeaveRequests.length > 0) return inMemoryLeaveRequests;
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      inMemoryLeaveRequests = JSON.parse(data);
    }
  } catch (e) {}
  if (!inMemoryLeaveRequests || inMemoryLeaveRequests.length === 0) {
    inMemoryLeaveRequests = [...INITIAL_LEAVES];
  }
  return inMemoryLeaveRequests;
}

function saveLeaves(list) {
  inMemoryLeaveRequests = list;
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list), 'utf-8');
  } catch (e) {}
}

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

  const leaves = loadLeaves();

  // GET: Fetch leave requests
  if (req.method === 'GET') {
    const { customerId, status } = req.query;
    let filtered = [...leaves];
    if (customerId) {
      filtered = filtered.filter(l => l.customerId === customerId);
    }
    if (status) {
      filtered = filtered.filter(l => l.status === status);
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
      const { id, customerId, customerName, houseNo, phone, fromDate, toDate, shift, reason } = body;

      if (!customerId || !fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'Missing required leave fields' });
      }

      // Deduplication: check if matching leave exists
      const existingIndex = leaves.findIndex(l =>
        (id && l.id === id) ||
        (l.customerId === customerId && l.fromDate === fromDate && l.toDate === toDate && (l.shift || 'BOTH') === (shift || 'BOTH'))
      );

      const resolvedId = id || (existingIndex >= 0 ? leaves[existingIndex].id : `leave_${Date.now()}`);
      const newLeave = {
        id: resolvedId,
        customerId,
        customerName: customerName || (existingIndex >= 0 ? leaves[existingIndex].customerName : 'Valued Customer'),
        houseNo: houseNo || (existingIndex >= 0 ? leaves[existingIndex].houseNo : '—'),
        phone: phone || (existingIndex >= 0 ? leaves[existingIndex].phone : ''),
        fromDate,
        toDate,
        shift: shift || 'BOTH',
        reason: reason || (existingIndex >= 0 ? leaves[existingIndex].reason : 'Personal work / out of town'),
        status: (existingIndex >= 0 && leaves[existingIndex].status !== 'PENDING') ? leaves[existingIndex].status : 'PENDING',
        vendorNote: existingIndex >= 0 ? leaves[existingIndex].vendorNote : '',
        createdAt: (existingIndex >= 0 ? leaves[existingIndex].createdAt : null) || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        leaves[existingIndex] = { ...leaves[existingIndex], ...newLeave };
      } else {
        leaves.unshift(newLeave);
      }
      saveLeaves(leaves);

      // Trigger notification for Dairy Owner
      try {
        const notifPayload = {
          title: '⏸️ புதிய வாடிக்கையாளர் விடுப்பு கோரிக்கை!',
          message: `${newLeave.customerName} (${newLeave.houseNo}) ${newLeave.fromDate} முதல் ${newLeave.toDate} வரை (${newLeave.shift === 'BOTH' ? 'முழு நாள்' : newLeave.shift}) பால் விடுப்பு கேட்டுள்ளார்.`,
          targetRole: 'ADMIN',
          type: 'LEAVE_REQUEST_CREATED',
          payload: newLeave
        };
        fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifPayload)
        }).catch(() => {});
      } catch (err) {}

      return res.status(201).json({
        success: true,
        message: 'Leave request submitted to farm vendor.',
        data: newLeave
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // PUT / PATCH: Vendor accepts or rejects leave request
  if (req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { requestId, status, vendorNote } = body;

      if (!requestId || !status) {
        return res.status(400).json({ success: false, message: 'Missing requestId or status' });
      }

      const index = leaves.findIndex(l => l.id === requestId);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

      leaves[index] = {
        ...leaves[index],
        status, // 'ACCEPTED' or 'REJECTED'
        vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Leave noted! Milk delivery paused.' : 'Sorry, leave cannot be approved at this time.'),
        respondedAt: new Date().toISOString()
      };

      const updated = leaves[index];
      saveLeaves(leaves);

      // Trigger notification for Customer
      try {
        const notifPayload = {
          title: status === 'ACCEPTED' ? '🏖️ பால் விடுப்பு ஏற்கப்பட்டது!' : 'ℹ️ பால் விடுப்பு தகவல்',
          message: status === 'ACCEPTED' 
            ? `உங்கள் விடுப்பு (${updated.fromDate} - ${updated.toDate}) ஏற்கப்பட்டது. பால் விநியோகம் நிறுத்தப்படும்.` 
            : 'மன்னிக்கவும்! லீவு ஏற்கப்படவில்லை.',
          targetRole: 'CUSTOMER',
          targetUserId: updated.customerId,
          type: 'LEAVE_REQUEST_RESPONDED',
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
        message: `Leave request ${status.toLowerCase()} by farm vendor.`,
        data: updated
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
