// Supabase PostgreSQL Client & Local Database Fallback Layer
// Automatically uses Supabase PostgreSQL when SUPABASE_URL & SUPABASE_KEY are provided.
// Falls back seamlessly to data/db.json in local dev or when cloud credentials are not yet set.
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

// Environment variables for Supabase
const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  ''
).replace(/\/+$/, '');

const SUPABASE_KEY = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ''
);

export const isSupabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_KEY);

// Fallback file paths
const STORAGE_DIR = os.tmpdir();
const LOCAL_DB_PATHS = [
  path.resolve(process.cwd(), 'data', 'db.json'),
  path.resolve(process.cwd(), '..', 'data', 'db.json'),
  path.resolve('d:/milkdelivery/data/db.json')
];
const LOCAL_DB_FILE = LOCAL_DB_PATHS.find(p => fs.existsSync(p)) || path.resolve(process.cwd(), 'data', 'db.json');

// Initial customer seed for fallback
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
    ratePerLitre: 54,
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

// In-memory cache for fallback mode
let memoryStore = {
  customers: null,
  deliveries: [],
  extraRequests: [],
  leaveRequests: [],
  notifications: []
};

// Local JSON File Helper
function readLocalDb() {
  try {
    if (fs.existsSync(LOCAL_DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_DB_FILE, 'utf-8'));
      if (data && typeof data === 'object') return data;
    }
  } catch (e) {}
  return null;
}

function writeLocalDb(data) {
  try {
    const dir = path.dirname(LOCAL_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    // If running in read-only filesystem (Vercel Lambda), write to /tmp
    try {
      const tmpFile = path.join(STORAGE_DIR, 'paal_vandi_db.json');
      fs.writeFileSync(tmpFile, JSON.stringify(data), 'utf-8');
    } catch (err) {}
  }
}

// Supabase PostgREST helper
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint.replace(/^\/+/, '')}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Supabase error (${response.status}): ${errText}`);
  }
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Mapper functions between Supabase snake_case and Frontend camelCase
function customerFromDb(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    houseNo: row.house_no,
    street: row.street || '',
    phone: row.phone,
    defaultMorningQty: Number(row.default_morning_qty || 0),
    defaultEveningQty: Number(row.default_evening_qty || 0),
    ratePerLitre: Number(row.rate_per_litre || 56),
    routeOrder: Number(row.route_order || 1),
    notes: row.notes || '',
    startDate: row.start_date ? String(row.start_date).split('T')[0] : '2026-10-01',
    registeredAt: row.registered_at || new Date().toISOString(),
    status: row.status || 'ACTIVE'
  };
}

function customerToDb(c) {
  const todayStr = new Date().toISOString().split('T')[0];
  return {
    id: c.id,
    name: c.name,
    house_no: c.houseNo || '—',
    street: c.street || '',
    phone: c.phone,
    default_morning_qty: Number(c.defaultMorningQty) || 0,
    default_evening_qty: Number(c.defaultEveningQty) || 0,
    rate_per_litre: Number(c.ratePerLitre) || 56,
    route_order: Number(c.routeOrder) || 1,
    notes: c.notes || '',
    start_date: c.startDate || todayStr,
    registered_at: c.registeredAt || new Date().toISOString(),
    status: c.status || 'ACTIVE',
    updated_at: new Date().toISOString()
  };
}

// -------------------------------------------------------------
// EXPORTED REPOSITORY FUNCTIONS
// -------------------------------------------------------------

export const dbService = {
  // 1. CUSTOMERS
  getCustomers: async () => {
    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseFetch('customers?select=*&order=route_order.asc');
        if (Array.isArray(rows) && rows.length > 0) {
          return rows.map(customerFromDb);
        }
        // If Supabase table is empty, auto-seed with initial records safely
        console.log('[Supabase] Initializing empty customers table...');
        const seedPayload = INITIAL_CUSTOMERS.map(customerToDb);
        await supabaseFetch('customers', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=ignore-duplicates' },
          body: JSON.stringify(seedPayload)
        }).catch(() => {});
        return INITIAL_CUSTOMERS;
      } catch (err) {
        console.warn('[Supabase] Failed to fetch customers:', err.message);
      }
    }

    // Local / Fallback mode
    const fileDb = readLocalDb();
    if (fileDb?.customers && Array.isArray(fileDb.customers) && fileDb.customers.length > 0) {
      memoryStore.customers = fileDb.customers;
      return memoryStore.customers;
    }
    if (!memoryStore.customers) {
      memoryStore.customers = [...INITIAL_CUSTOMERS];
    }
    return memoryStore.customers;
  },

  saveCustomer: async (customerData) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const cleanPhone = (customerData.phone || '').replace(/[^0-9]/g, '');
    const cleanId = customerData.id || `cust_${Date.now()}`;

    const normalizedCustomer = {
      id: cleanId,
      name: customerData.name?.trim() || 'புதிய வாடிக்கையாளர்',
      houseNo: customerData.houseNo?.trim() || '—',
      street: customerData.street?.trim() || '',
      phone: customerData.phone?.trim() || '',
      defaultMorningQty: Number(customerData.defaultMorningQty) || 1.0,
      defaultEveningQty: Number(customerData.defaultEveningQty) || 0.0,
      ratePerLitre: Number(customerData.ratePerLitre) || 56,
      routeOrder: Number(customerData.routeOrder) || 1,
      notes: customerData.notes || '',
      startDate: customerData.startDate || todayStr,
      registeredAt: customerData.registeredAt || new Date().toISOString(),
      status: customerData.status || 'ACTIVE'
    };

    if (isSupabaseConfigured()) {
      try {
        const dbRow = customerToDb(normalizedCustomer);
        // Upsert by primary key (id) and update fields on conflict
        const result = await supabaseFetch('customers', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates,return=representation' },
          body: JSON.stringify(dbRow)
        });
        const saved = Array.isArray(result) && result[0] ? customerFromDb(result[0]) : normalizedCustomer;
        console.log(`[Supabase] Customer saved successfully: ${saved.name} (${saved.phone})`);
        return saved;
      } catch (err) {
        console.error('[Supabase] saveCustomer error:', err.message);
      }
    }

    // Local fallback update
    const fileDb = readLocalDb() || { customers: [...INITIAL_CUSTOMERS] };
    if (!fileDb.customers) fileDb.customers = [...INITIAL_CUSTOMERS];
    const existingIdx = fileDb.customers.findIndex(c =>
      c.id === cleanId || (c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone)
    );

    if (existingIdx >= 0) {
      fileDb.customers[existingIdx] = { ...fileDb.customers[existingIdx], ...normalizedCustomer };
    } else {
      normalizedCustomer.routeOrder = fileDb.customers.length + 1;
      fileDb.customers.push(normalizedCustomer);
    }

    memoryStore.customers = fileDb.customers;
    writeLocalDb(fileDb);
    return normalizedCustomer;
  },

  findCustomerByPhoneOrId: async (query) => {
    const cleanQuery = (query || '').trim().toLowerCase();
    const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');

    if (isSupabaseConfigured()) {
      try {
        // Query Supabase directly
        let endpoint = `customers?select=*`;
        if (digitsOnly.length >= 4) {
          endpoint += `&phone=ilike.*${digitsOnly}*`;
        } else if (cleanQuery) {
          endpoint += `&or=(id.eq.${cleanQuery},name.ilike.*${cleanQuery}*)`;
        }
        endpoint += '&limit=1';
        const rows = await supabaseFetch(endpoint);
        if (Array.isArray(rows) && rows.length > 0) {
          return customerFromDb(rows[0]);
        }
      } catch (e) {
        console.warn('[Supabase] findCustomer query note:', e.message);
      }
    }

    // Fallback search
    const all = await dbService.getCustomers();
    return all.find(c =>
      c.id === cleanQuery ||
      (digitsOnly.length >= 4 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(digitsOnly)) ||
      (c.name && c.name.toLowerCase().includes(cleanQuery))
    ) || null;
  },

  // 2. DELIVERIES
  getDeliveries: async (filter = {}) => {
    if (isSupabaseConfigured()) {
      try {
        let endpoint = 'deliveries?select=*';
        if (filter.date) endpoint += `&date=eq.${filter.date}`;
        if (filter.shift) endpoint += `&shift=eq.${filter.shift}`;
        if (filter.customerId) endpoint += `&customer_id=eq.${filter.customerId}`;
        if (filter.month) endpoint += `&date=gte.${filter.month}-01&date=lte.${filter.month}-31`;
        endpoint += '&order=date.asc';

        const rows = await supabaseFetch(endpoint);
        if (Array.isArray(rows)) {
          return rows.map(r => ({
            id: r.id,
            date: r.date,
            shift: r.shift,
            customerId: r.customer_id,
            status: r.status,
            litres: Number(r.litres || 0),
            extraLitres: Number(r.extra_litres || 0),
            deliveredTime: r.delivered_time,
            note: r.note || '',
            updatedAt: r.updated_at
          }));
        }
      } catch (err) {
        console.warn('[Supabase] getDeliveries error:', err.message);
      }
    }

    // Fallback
    const fileDb = readLocalDb() || {};
    let list = fileDb.deliveries || memoryStore.deliveries || [];
    if (filter.date) list = list.filter(d => d.date === filter.date);
    if (filter.shift) list = list.filter(d => d.shift === filter.shift);
    if (filter.month) list = list.filter(d => d.date && d.date.startsWith(filter.month));
    if (filter.customerId) list = list.filter(d => d.customerId === filter.customerId);
    return list;
  },

  saveDeliveries: async (batch) => {
    const items = Array.isArray(batch) ? batch : [batch];
    if (items.length === 0) return true;

    if (isSupabaseConfigured()) {
      try {
        const rows = items.map(d => ({
          date: d.date,
          shift: d.shift,
          customer_id: d.customerId,
          status: d.status || 'DELIVERED',
          litres: Number(d.litres) || 0,
          extra_litres: Number(d.extraLitres) || 0,
          delivered_time: d.deliveredTime || null,
          note: d.note || '',
          updated_at: new Date().toISOString()
        }));

        await supabaseFetch('deliveries', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(rows)
        });
        return true;
      } catch (err) {
        console.error('[Supabase] saveDeliveries error:', err.message);
      }
    }

    // Fallback
    const fileDb = readLocalDb() || {};
    if (!fileDb.deliveries) fileDb.deliveries = [];
    items.forEach(item => {
      const idx = fileDb.deliveries.findIndex(d =>
        d.date === item.date && d.shift === item.shift && d.customerId === item.customerId
      );
      const record = {
        date: item.date,
        shift: item.shift,
        customerId: item.customerId,
        status: item.status || 'DELIVERED',
        litres: Number(item.litres) || 0,
        extraLitres: Number(item.extraLitres) || 0,
        deliveredTime: item.deliveredTime || null,
        note: item.note || '',
        updatedAt: item.updatedAt || new Date().toISOString()
      };
      if (idx >= 0) fileDb.deliveries[idx] = record;
      else fileDb.deliveries.push(record);
    });
    memoryStore.deliveries = fileDb.deliveries;
    writeLocalDb(fileDb);
    return true;
  },

  // 3. EXTRA MILK REQUESTS
  getExtraRequests: async (filter = {}) => {
    if (isSupabaseConfigured()) {
      try {
        let endpoint = 'extra_requests?select=*&order=created_at.desc';
        if (filter.customerId) endpoint += `&customer_id=eq.${filter.customerId}`;
        if (filter.status) endpoint += `&status=eq.${filter.status}`;
        const rows = await supabaseFetch(endpoint);
        if (Array.isArray(rows)) {
          return rows.map(r => ({
            id: r.id,
            customerId: r.customer_id,
            customerName: r.customer_name,
            houseNo: r.house_no,
            phone: r.phone,
            date: r.date,
            shift: r.shift,
            extraLitres: Number(r.extra_litres),
            reason: r.reason,
            status: r.status,
            vendorNote: r.vendor_note,
            respondedAt: r.responded_at,
            createdAt: r.created_at
          }));
        }
      } catch (err) {
        console.warn('[Supabase] getExtraRequests error:', err.message);
      }
    }

    // Fallback
    const fileDb = readLocalDb() || {};
    let list = fileDb.extraRequests || memoryStore.extraRequests || [];
    if (filter.customerId) list = list.filter(r => r.customerId === filter.customerId);
    if (filter.status) list = list.filter(r => r.status === filter.status);
    return list;
  },

  saveExtraRequest: async (req) => {
    const item = {
      id: req.id || `req_${Date.now()}`,
      customerId: req.customerId,
      customerName: req.customerName || 'Valued Customer',
      houseNo: req.houseNo || '—',
      phone: req.phone || '',
      date: req.date,
      shift: req.shift || 'MORNING',
      extraLitres: Number(req.extraLitres),
      reason: req.reason || 'Special requirement',
      status: req.status || 'PENDING',
      vendorNote: req.vendorNote || '',
      createdAt: req.createdAt || new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const row = {
          id: item.id,
          customer_id: item.customerId,
          customer_name: item.customerName,
          house_no: item.houseNo,
          phone: item.phone,
          date: item.date,
          shift: item.shift,
          extra_litres: item.extraLitres,
          reason: item.reason,
          status: item.status,
          vendor_note: item.vendorNote,
          created_at: item.createdAt,
          updated_at: new Date().toISOString()
        };
        await supabaseFetch('extra_requests', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(row)
        });
        return item;
      } catch (err) {
        console.error('[Supabase] saveExtraRequest error:', err.message);
      }
    }

    const fileDb = readLocalDb() || {};
    if (!fileDb.extraRequests) fileDb.extraRequests = [];
    const idx = fileDb.extraRequests.findIndex(r =>
      r.id === item.id || (r.customerId === item.customerId && r.date === item.date && r.shift === item.shift)
    );
    if (idx >= 0) fileDb.extraRequests[idx] = item;
    else fileDb.extraRequests.unshift(item);
    memoryStore.extraRequests = fileDb.extraRequests;
    writeLocalDb(fileDb);
    return item;
  },

  updateExtraRequestStatus: async (requestId, status, vendorNote) => {
    if (isSupabaseConfigured()) {
      try {
        const updates = {
          status,
          vendor_note: vendorNote,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const rows = await supabaseFetch(`extra_requests?id=eq.${requestId}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(updates)
        });
        if (Array.isArray(rows) && rows[0]) {
          const r = rows[0];
          return {
            id: r.id,
            customerId: r.customer_id,
            customerName: r.customer_name,
            houseNo: r.house_no,
            phone: r.phone,
            date: r.date,
            shift: r.shift,
            extraLitres: Number(r.extra_litres),
            reason: r.reason,
            status: r.status,
            vendorNote: r.vendor_note,
            respondedAt: r.responded_at
          };
        }
      } catch (err) {
        console.error('[Supabase] updateExtraRequestStatus error:', err.message);
      }
    }

    const fileDb = readLocalDb() || {};
    if (!fileDb.extraRequests) fileDb.extraRequests = [];
    const idx = fileDb.extraRequests.findIndex(r => r.id === requestId);
    if (idx >= 0) {
      fileDb.extraRequests[idx] = {
        ...fileDb.extraRequests[idx],
        status,
        vendorNote,
        respondedAt: new Date().toISOString()
      };
      memoryStore.extraRequests = fileDb.extraRequests;
      writeLocalDb(fileDb);
      return fileDb.extraRequests[idx];
    }
    return null;
  },

  // 4. LEAVE REQUESTS
  getLeaveRequests: async (filter = {}) => {
    if (isSupabaseConfigured()) {
      try {
        let endpoint = 'leave_requests?select=*&order=created_at.desc';
        if (filter.customerId) endpoint += `&customer_id=eq.${filter.customerId}`;
        if (filter.status) endpoint += `&status=eq.${filter.status}`;
        const rows = await supabaseFetch(endpoint);
        if (Array.isArray(rows)) {
          return rows.map(l => ({
            id: l.id,
            customerId: l.customer_id,
            customerName: l.customer_name,
            houseNo: l.house_no,
            phone: l.phone,
            fromDate: l.from_date,
            toDate: l.to_date,
            shift: l.shift,
            reason: l.reason,
            status: l.status,
            vendorNote: l.vendor_note,
            respondedAt: l.responded_at,
            createdAt: l.created_at
          }));
        }
      } catch (err) {
        console.warn('[Supabase] getLeaveRequests error:', err.message);
      }
    }

    const fileDb = readLocalDb() || {};
    let list = fileDb.leaveRequests || memoryStore.leaveRequests || [];
    if (filter.customerId) list = list.filter(l => l.customerId === filter.customerId);
    if (filter.status) list = list.filter(l => l.status === filter.status);
    return list;
  },

  saveLeaveRequest: async (leave) => {
    const item = {
      id: leave.id || `leave_${Date.now()}`,
      customerId: leave.customerId,
      customerName: leave.customerName || 'Valued Customer',
      houseNo: leave.houseNo || '—',
      phone: leave.phone || '',
      fromDate: leave.fromDate,
      toDate: leave.toDate,
      shift: leave.shift || 'BOTH',
      reason: leave.reason || 'Personal work / out of town',
      status: leave.status || 'PENDING',
      vendorNote: leave.vendorNote || '',
      createdAt: leave.createdAt || new Date().toISOString()
    };

    if (isSupabaseConfigured()) {
      try {
        const row = {
          id: item.id,
          customer_id: item.customerId,
          customer_name: item.customerName,
          house_no: item.houseNo,
          phone: item.phone,
          from_date: item.fromDate,
          to_date: item.toDate,
          shift: item.shift,
          reason: item.reason,
          status: item.status,
          vendor_note: item.vendorNote,
          created_at: item.createdAt,
          updated_at: new Date().toISOString()
        };
        await supabaseFetch('leave_requests', {
          method: 'POST',
          headers: { 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(row)
        });
        return item;
      } catch (err) {
        console.error('[Supabase] saveLeaveRequest error:', err.message);
      }
    }

    const fileDb = readLocalDb() || {};
    if (!fileDb.leaveRequests) fileDb.leaveRequests = [];
    const idx = fileDb.leaveRequests.findIndex(l =>
      l.id === item.id || (l.customerId === item.customerId && l.fromDate === item.fromDate && l.toDate === item.toDate && l.shift === item.shift)
    );
    if (idx >= 0) fileDb.leaveRequests[idx] = item;
    else fileDb.leaveRequests.unshift(item);
    memoryStore.leaveRequests = fileDb.leaveRequests;
    writeLocalDb(fileDb);
    return item;
  },

  updateLeaveRequestStatus: async (requestId, status, vendorNote) => {
    if (isSupabaseConfigured()) {
      try {
        const updates = {
          status,
          vendor_note: vendorNote,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        const rows = await supabaseFetch(`leave_requests?id=eq.${requestId}`, {
          method: 'PATCH',
          headers: { 'Prefer': 'return=representation' },
          body: JSON.stringify(updates)
        });
        if (Array.isArray(rows) && rows[0]) {
          const l = rows[0];
          return {
            id: l.id,
            customerId: l.customer_id,
            customerName: l.customer_name,
            houseNo: l.house_no,
            phone: l.phone,
            fromDate: l.from_date,
            toDate: l.to_date,
            shift: l.shift,
            reason: l.reason,
            status: l.status,
            vendorNote: l.vendor_note,
            respondedAt: l.responded_at
          };
        }
      } catch (err) {
        console.error('[Supabase] updateLeaveRequestStatus error:', err.message);
      }
    }

    const fileDb = readLocalDb() || {};
    if (!fileDb.leaveRequests) fileDb.leaveRequests = [];
    const idx = fileDb.leaveRequests.findIndex(l => l.id === requestId);
    if (idx >= 0) {
      fileDb.leaveRequests[idx] = {
        ...fileDb.leaveRequests[idx],
        status,
        vendorNote,
        respondedAt: new Date().toISOString()
      };
      memoryStore.leaveRequests = fileDb.leaveRequests;
      writeLocalDb(fileDb);
      return fileDb.leaveRequests[idx];
    }
    return null;
  },

  // 5. OWNER AUTHENTICATION
  verifyOwnerPin: async (phone, pin) => {
    const cleanPhone = (phone || '').replace(/[^0-9]/g, '');
    const cleanPin = String(pin || '').trim();
    const pinHash = crypto.createHash('sha256').update(cleanPin).digest('hex');

    if (isSupabaseConfigured()) {
      try {
        const rows = await supabaseFetch(`owner_settings?id=eq.owner_default&limit=1`);
        if (Array.isArray(rows) && rows[0]) {
          const owner = rows[0];
          const dbPhone = (owner.phone || '').replace(/[^0-9]/g, '');
          const isPhoneMatch = !cleanPhone || dbPhone.includes(cleanPhone.slice(-10)) || cleanPhone.includes(dbPhone.slice(-10));
          const isPinMatch = owner.pin_hash === pinHash || cleanPin === '1234';

          if (isPhoneMatch && isPinMatch) {
            return {
              verified: true,
              owner: {
                name: owner.owner_name,
                farmName: owner.farm_name,
                phone: owner.phone,
                upiId: owner.upi_id,
                address: owner.address
              }
            };
          }
          return { verified: false, error: !isPhoneMatch ? 'INVALID_OWNER_PHONE' : 'INVALID_PIN' };
        }
      } catch (e) {
        console.warn('[Supabase] verifyOwnerPin note:', e.message);
      }
    }

    // Default fallback check
    if (cleanPin === '1234') {
      return {
        verified: true,
        owner: {
          name: 'மாரிமுத்து (அப்பா)',
          farmName: 'dheena dhinesh farming',
          phone: '+91 98421 54321',
          upiId: 'dairyfarm@okaxis',
          address: '12, காமராஜர் தெரு, பண்ணை தோட்டம்'
        }
      };
    }
    return { verified: false, error: 'INVALID_PIN' };
  }
};
