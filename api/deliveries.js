// Vercel Serverless Function for Delivery Records Synchronization
// Enables cross-device sync of daily morning & evening milk deliveries
import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_FILE = path.join(os.tmpdir(), 'paal_vandi_deliveries.json');

// In-memory cache
let inMemoryDeliveries = [];

function loadDeliveries() {
  if (inMemoryDeliveries.length > 0) return inMemoryDeliveries;
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      inMemoryDeliveries = JSON.parse(data);
    }
  } catch (e) {
    // fallback to empty
  }
  return inMemoryDeliveries;
}

function saveDeliveries(list) {
  inMemoryDeliveries = list;
  try {
    fs.writeFileSync(STORAGE_FILE, JSON.stringify(list), 'utf-8');
  } catch (e) {}
}

export default async function handler(req, res) {
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

  const deliveries = loadDeliveries();

  // GET: Retrieve delivery records with optional filters
  if (req.method === 'GET') {
    const { date, shift, month, customerId } = req.query;
    let filtered = [...deliveries];

    if (date) {
      filtered = filtered.filter(d => d.date === date);
    }
    if (shift) {
      filtered = filtered.filter(d => d.shift === shift);
    }
    if (month) {
      filtered = filtered.filter(d => d.date && d.date.startsWith(month));
    }
    if (customerId) {
      filtered = filtered.filter(d => d.customerId === customerId);
    }

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered
    });
  }

  // POST: Record or update delivery
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const items = Array.isArray(body.batch) ? body.batch : [body];
      const nowIso = new Date().toISOString();

      items.forEach(item => {
        const { date, shift, customerId, status, litres, extraLitres, deliveredTime, note, updatedAt } = item;
        if (!date || !shift || !customerId) return;

        const existingIdx = deliveries.findIndex(
          d => d.date === date && d.shift === shift && d.customerId === customerId
        );

        const record = {
          date,
          shift,
          customerId,
          status: status || 'DELIVERED',
          litres: Number(litres) || 0,
          extraLitres: Number(extraLitres) || 0,
          deliveredTime: deliveredTime || (status === 'DELIVERED' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null),
          note: note || '',
          updatedAt: updatedAt || nowIso
        };

        if (existingIdx >= 0) {
          deliveries[existingIdx] = { ...deliveries[existingIdx], ...record };
        } else {
          deliveries.push(record);
        }

        // Trigger notification for customer if delivered
        if (record.status === 'DELIVERED') {
          try {
            const notifPayload = {
              title: '🥛 இன்றைய பால் விநியோகம் செய்யப்பட்டது!',
              message: `${date} (${shift === 'MORNING' ? 'காலை' : 'மாலை'}): ${record.litres}L பால் வழங்கப்பட்டது. நன்றி!`,
              targetRole: 'CUSTOMER',
              targetUserId: customerId,
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

      saveDeliveries(deliveries);

      return res.status(200).json({
        success: true,
        message: 'Delivery records synchronized successfully',
        count: deliveries.length
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
