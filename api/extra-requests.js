// Vercel Serverless Function for Extra Milk Requests
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

  // GET: Fetch all extra milk requests
  if (req.method === 'GET') {
    try {
      const { customerId, status } = req.query;
      const requests = await dbService.getExtraRequests({ customerId, status });
      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Customer submits a new Extra Milk request
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { customerId, date, extraLitres } = body;

      if (!customerId || !date || !extraLitres) {
        return res.status(400).json({ success: false, message: 'Missing required request fields' });
      }

      const saved = await dbService.saveExtraRequest(body);

      // Trigger notification for Dairy Owner
      try {
        const notifPayload = {
          title: '🥛 புதிய கூடுதல் பால் கோரிக்கை!',
          message: `${saved.customerName || 'வாடிக்கையாளர்'} (${saved.houseNo || '—'}) ${saved.shift === 'MORNING' ? 'காலை' : 'மாலை'} ஷிப்டுக்கு +${saved.extraLitres}L கூடுதல் பால் கேட்டுள்ளார்!`,
          targetRole: 'ADMIN',
          type: 'EXTRA_REQUEST_CREATED',
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
        message: 'Extra milk request saved to database. Waiting for vendor approval.',
        data: saved
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

      const note = vendorNote || (status === 'ACCEPTED' ? 'Milk is available, will deliver!' : 'Sorry, extra milk is not available for this shift.');
      const updated = await dbService.updateExtraRequestStatus(requestId, status, note);

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Request not found' });
      }

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
