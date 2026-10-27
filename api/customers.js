// Vercel Serverless Function for Customer Directory Synchronization
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

  // GET: Fetch all customers from shared database
  if (req.method === 'GET') {
    try {
      const query = req.query.q || req.query.phone || req.query.id;
      if (query) {
        const found = await dbService.findCustomerByPhoneOrId(query);
        if (found) {
          return res.status(200).json({ success: true, count: 1, data: [found] });
        }
        return res.status(200).json({ success: true, count: 0, data: [] });
      }

      const customers = await dbService.getCustomers();
      return res.status(200).json({
        success: true,
        count: customers.length,
        data: customers
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  // POST: Add or update customer in shared database
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { name, phone } = body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' });
      }

      const saved = await dbService.saveCustomer(body);
      return res.status(200).json({
        success: true,
        message: 'Customer saved to shared database',
        data: saved
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
