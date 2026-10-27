// Vercel Serverless Function for Customer Leave Requests (Pause Delivery)
// Powered by Supabase PostgreSQL with local JSON fallback
import { dbService } from './lib/supabase.js';

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

  // GET: Fetch leave requests
  if (req.method === 'GET') {
    try {
      const { customerId, status } = req.query;
      const leaves = await dbService.getLeaveRequests({ customerId, status });
      return res.status(200).json({
        success: true,
        count: leaves.length,
        data: leaves
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Customer submits a new Leave request
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { customerId, fromDate, toDate } = body;

      if (!customerId || !fromDate || !toDate) {
        return res.status(400).json({ success: false, message: 'Missing required leave fields' });
      }

      const saved = await dbService.saveLeaveRequest(body);

      // Trigger notification for Dairy Owner
      try {
        const notifPayload = {
          title: '⏸️ புதிய வாடிக்கையாளர் விடுப்பு கோரிக்கை!',
          message: `${saved.customerName || 'வாடிக்கையாளர்'} (${saved.houseNo || '—'}) ${saved.fromDate} முதல் ${saved.toDate} வரை (${saved.shift === 'BOTH' ? 'முழு நாள்' : saved.shift}) பால் விடுப்பு கேட்டுள்ளார்.`,
          targetRole: 'ADMIN',
          type: 'LEAVE_REQUEST_CREATED',
          payload: saved
        };
        fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}/api/send-notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notifPayload)
        }).catch(() => {});
      } catch (err) {}

      return res.status(201).json({
        success: true,
        message: 'Leave request saved to database. Waiting for vendor approval.',
        data: saved
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

      const note = vendorNote || (status === 'ACCEPTED' ? 'Leave noted! Milk delivery paused.' : 'Sorry, leave cannot be approved at this time.');
      const updated = await dbService.updateLeaveRequestStatus(requestId, status, note);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Leave request not found' });
      }

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
