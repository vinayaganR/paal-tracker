// Vercel Serverless Function for Customer Directory Synchronization
// Ensures new customer registrations sync across multiple devices
import fs from 'fs';
import path from 'path';
import os from 'os';

const STORAGE_FILE = path.join(os.tmpdir(), 'paal_vandi_customers.json');

const INITIAL_CUSTOMERS = [
  {
    id: 'cust_1',
    name: 'முத்துசாமி (Muthusamy)',
    houseNo: '14/A',
    street: 'பாரதியார் வீதி (Bharathiyar St)',
    phone: '9840112345',
    defaultMorningQty: 1.0,
    defaultEveningQty: 0.5,
    ratePerLitre: 56,
    routeOrder: 1,
    notes: 'கேட்டில் உள்ள பாத்திரத்தில் ஊற்றவும் (Leave in gate can)',
    startDate: '2026-10-01',
    registeredAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'cust_2',
    name: 'சுந்தரம் ஆசிரியர் (Sundaram Teacher)',
    houseNo: '28',
    street: 'பாரதியார் வீதி (Bharathiyar St)',
    phone: '9789223456',
    defaultMorningQty: 1.5,
    defaultEveningQty: 0.0,
    ratePerLitre: 56,
    routeOrder: 2,
    notes: 'மணி அடிக்கவும் (Ring bell)',
    startDate: '2026-10-01',
    registeredAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'cust_3',
    name: 'விஜயலட்சுமி அம்மாள் (Vijayalakshmi)',
    houseNo: '5',
    street: 'அம்மன் கோவில் தெரு (Amman Kovil St)',
    phone: '9443334567',
    defaultMorningQty: 0.5,
    defaultEveningQty: 0.5,
    ratePerLitre: 56,
    routeOrder: 3,
    notes: 'பூனை வராதபடி மூடி வைக்கவும்',
    startDate: '2026-10-01',
    registeredAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'cust_4',
    name: 'சரவணன் மெடிக்கல்ஸ் (Saravanan)',
    houseNo: '42',
    street: 'மெயின் ரோடு (Main Road)',
    phone: '9944445678',
    defaultMorningQty: 2.0,
    defaultEveningQty: 1.0,
    ratePerLitre: 54, // Discounted bulk rate
    routeOrder: 4,
    notes: 'கடை வாசலில் வைக்கவும்',
    startDate: '2026-10-01',
    registeredAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE'
  },
  {
    id: 'cust_5',
    name: 'கார்த்திக் இன்ஜினியர் (Karthik)',
    houseNo: '108',
    street: 'நேரு நகர் (Nehru Nagar)',
    phone: '9841556789',
    defaultMorningQty: 1.0,
    defaultEveningQty: 0.0,
    ratePerLitre: 56,
    routeOrder: 5,
    notes: 'கூகுள் பே மூலம் மாதாந்திர கட்டணம் செலுத்துவார்',
    startDate: '2026-10-01',
    registeredAt: '2026-10-01T00:00:00.000Z',
    status: 'ACTIVE'
  }
];

let inMemoryCustomers = null;

function loadCustomers() {
  if (inMemoryCustomers && inMemoryCustomers.length > 0) return inMemoryCustomers;
  try {
    if (fs.existsSync(STORAGE_FILE)) {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      inMemoryCustomers = JSON.parse(data);
    }
  } catch (e) {}
  if (!inMemoryCustomers || inMemoryCustomers.length === 0) {
    inMemoryCustomers = [...INITIAL_CUSTOMERS];
  }
  return inMemoryCustomers;
}

function saveCustomers(list) {
  inMemoryCustomers = list;
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

  const customers = loadCustomers();

  // GET: Fetch all customers
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      count: customers.length,
      data: customers
    });
  }

  // POST: Add or update customer
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, houseNo, street, phone, defaultMorningQty, defaultEveningQty, ratePerLitre, notes, startDate, registeredAt } = body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' });
      }

      const todayStr = new Date().toISOString().split('T')[0];
      const existingIndex = customers.findIndex(c => c.id === id || c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''));
      const customerData = {
        id: id || (existingIndex >= 0 ? customers[existingIndex].id : `cust_${Date.now()}`),
        name,
        houseNo: houseNo || '—',
        street: street || '',
        phone,
        defaultMorningQty: Number(defaultMorningQty) || 1.0,
        defaultEveningQty: Number(defaultEveningQty) || 0.0,
        ratePerLitre: Number(ratePerLitre) || 56,
        routeOrder: existingIndex >= 0 ? customers[existingIndex].routeOrder : customers.length + 1,
        notes: notes || '',
        startDate: startDate || (existingIndex >= 0 && customers[existingIndex].startDate) || todayStr,
        registeredAt: registeredAt || (existingIndex >= 0 && customers[existingIndex].registeredAt) || new Date().toISOString(),
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        customers[existingIndex] = { ...customers[existingIndex], ...customerData };
      } else {
        customers.push(customerData);
      }
      saveCustomers(customers);

      return res.status(200).json({
        success: true,
        data: customerData
      });
    } catch (e) {
      return res.status(500).json({ success: false, error: e.message });
    }
  }

  return res.status(405).json({ message: 'Method Not Allowed' });
}
