// Vercel Serverless Function for Delivery Records Synchronization
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

  // GET: Retrieve delivery records with optional filters
  if (req.method === 'GET') {
    try {
      const { date, shift, month, customerId } = req.query;
      const deliveries = await dbService.getDeliveries({ date, shift, month, customerId });
      return res.status(200).json({
        success: true,
        count: deliveries.length,
        data: deliveries
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Record or update delivery
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const items = Array.isArray(body.batch) ? body.batch : [body];

      await dbService.saveDeliveries(items);

      // Trigger cross-device notifications for delivered records
      items.forEach(record => {
        if (record.status === 'DELIVERED') {
          try {
            const notifPayload = {
              title: '🥛 இன்றைய பால் விநியோகம் செய்யப்பட்டது!',
              message: `${record.date} (${record.shift === 'MORNING' ? 'காலை' : 'மாலை'}): ${record.litres}L பால் வழங்கப்பட்டது. நன்றி!`,
              targetRole: 'CUSTOMER',
              targetUserId: record.customerId,
              type: 'DELIVERY_UPDATED',
              payload: record
            };
            fetch(`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host || 'localhost:3000'}/api/send-notification`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(notifPayload)
            }).catch(() => {});
          } catch (err) {}
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Delivery records synchronized to shared database successfully'
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
