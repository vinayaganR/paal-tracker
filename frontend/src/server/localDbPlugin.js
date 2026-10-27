// Vite Development Server Middleware with Real Persistent File Database (data/db.json)
// Ensures Edge, Chrome, Mobile and all devices share the exact same database records on disk!
import fs from 'fs';
import path from 'path';

export function localDbPlugin() {
  const rootDir = process.cwd();
  // Find project data/db.json path (handles both frontend root or workspace root)
  const dbPaths = [
    path.resolve(rootDir, '..', 'data', 'db.json'),
    path.resolve(rootDir, 'data', 'db.json'),
    path.resolve('d:/milkdelivery/data/db.json')
  ];

  let dbFile = dbPaths.find(p => fs.existsSync(p)) || dbPaths[0];

  function readDb() {
    try {
      if (fs.existsSync(dbFile)) {
        const raw = fs.readFileSync(dbFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.warn('DB read error:', e.message);
    }
    return {
      customers: [],
      deliveries: [],
      extraRequests: [],
      leaveRequests: [],
      notifications: []
    };
  }

  function writeDb(data) {
    try {
      const dir = path.dirname(dbFile);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(dbFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('DB write error:', e.message);
    }
  }

  function parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch (e) {
          resolve({});
        }
      });
    });
  }

  function sendJson(res, statusCode, data) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.end(JSON.stringify(data));
  }

  return {
    name: 'local-db-api-server',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, `http://${req.headers.host || 'localhost:3000'}`);
        const pathname = url.pathname;

        if (!pathname.startsWith('/api/')) {
          return next();
        }

        // CORS preflight
        if (req.method === 'OPTIONS') {
          return sendJson(res, 200, {});
        }

        const db = readDb();

        // 1. CUSTOMERS API
        if (pathname === '/api/customers') {
          if (req.method === 'GET') {
            return sendJson(res, 200, {
              success: true,
              count: db.customers.length,
              data: db.customers
            });
          }

          if (req.method === 'POST') {
            const body = await parseBody(req);
            const { id, name, houseNo, street, phone, defaultMorningQty, defaultEveningQty, ratePerLitre, notes, startDate, registeredAt } = body;

            if (!name || !phone) {
              return sendJson(res, 400, { success: false, message: 'Name and phone required' });
            }

            const cleanPhone = phone.replace(/[^0-9]/g, '');
            const existingIdx = db.customers.findIndex(c => 
              (id && c.id === id) || 
              (c.phone && c.phone.replace(/[^0-9]/g, '') === cleanPhone)
            );

            const todayStr = new Date().toISOString().split('T')[0];
            const customerData = {
              id: id || (existingIdx >= 0 ? db.customers[existingIdx].id : `cust_${Date.now()}`),
              name,
              houseNo: houseNo || '—',
              street: street || '',
              phone,
              defaultMorningQty: Number(defaultMorningQty) || 1.0,
              defaultEveningQty: Number(defaultEveningQty) || 0.0,
              ratePerLitre: Number(ratePerLitre) || 56,
              routeOrder: existingIdx >= 0 ? db.customers[existingIdx].routeOrder : db.customers.length + 1,
              notes: notes || '',
              startDate: startDate || (existingIdx >= 0 && db.customers[existingIdx].startDate) || todayStr,
              registeredAt: registeredAt || (existingIdx >= 0 && db.customers[existingIdx].registeredAt) || new Date().toISOString(),
              status: 'ACTIVE',
              updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              db.customers[existingIdx] = { ...db.customers[existingIdx], ...customerData };
            } else {
              db.customers.push(customerData);
            }

            writeDb(db);
            console.log(`[DB] Customer saved: ${customerData.name} (${customerData.phone}) -> Total: ${db.customers.length}`);
            return sendJson(res, 200, { success: true, data: customerData });
          }
        }

        // 2. DELIVERIES API
        if (pathname === '/api/deliveries') {
          if (req.method === 'GET') {
            const date = url.searchParams.get('date');
            const shift = url.searchParams.get('shift');
            const month = url.searchParams.get('month');
            const customerId = url.searchParams.get('customerId');

            let list = [...(db.deliveries || [])];
            if (date) list = list.filter(d => d.date === date);
            if (shift) list = list.filter(d => d.shift === shift);
            if (month) list = list.filter(d => d.date && d.date.startsWith(month));
            if (customerId) list = list.filter(d => d.customerId === customerId);

            return sendJson(res, 200, { success: true, count: list.length, data: list });
          }

          if (req.method === 'POST') {
            const body = await parseBody(req);
            const items = Array.isArray(body.batch) ? body.batch : [body];
            if (!db.deliveries) db.deliveries = [];

            items.forEach(item => {
              if (!item.date || !item.shift || !item.customerId) return;
              const idx = db.deliveries.findIndex(d => 
                d.date === item.date && d.shift === item.shift && d.customerId === item.customerId
              );
              const record = {
                date: item.date,
                shift: item.shift,
                customerId: item.customerId,
                status: item.status || 'DELIVERED',
                litres: Number(item.litres) || 0,
                extraLitres: Number(item.extraLitres) || 0,
                deliveredTime: item.deliveredTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                note: item.note || '',
                updatedAt: item.updatedAt || new Date().toISOString()
              };

              if (idx >= 0) {
                db.deliveries[idx] = { ...db.deliveries[idx], ...record };
              } else {
                db.deliveries.push(record);
              }
            });

            writeDb(db);
            return sendJson(res, 200, { success: true, count: db.deliveries.length });
          }
        }

        // 3. EXTRA MILK REQUESTS API
        if (pathname === '/api/extra-requests') {
          if (!db.extraRequests) db.extraRequests = [];

          if (req.method === 'GET') {
            const customerId = url.searchParams.get('customerId');
            const status = url.searchParams.get('status');
            let list = [...db.extraRequests];
            if (customerId) list = list.filter(r => r.customerId === customerId);
            if (status) list = list.filter(r => r.status === status);
            return sendJson(res, 200, { success: true, count: list.length, data: list });
          }

          if (req.method === 'POST') {
            const body = await parseBody(req);
            const { id, customerId, customerName, houseNo, phone, date, shift, extraLitres, reason } = body;

            const existingIdx = db.extraRequests.findIndex(r => 
              (id && r.id === id) || 
              (r.customerId === customerId && r.date === date && r.shift === (shift || 'MORNING'))
            );

            const newReq = {
              id: id || (existingIdx >= 0 ? db.extraRequests[existingIdx].id : `req_${Date.now()}`),
              customerId,
              customerName: customerName || 'Valued Customer',
              houseNo: houseNo || '—',
              phone: phone || '',
              date,
              shift: shift || 'MORNING',
              extraLitres: Number(extraLitres),
              reason: reason || 'Special requirement',
              status: (existingIdx >= 0 && db.extraRequests[existingIdx].status !== 'PENDING') ? db.extraRequests[existingIdx].status : 'PENDING',
              vendorNote: existingIdx >= 0 ? db.extraRequests[existingIdx].vendorNote : '',
              createdAt: (existingIdx >= 0 ? db.extraRequests[existingIdx].createdAt : null) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              db.extraRequests[existingIdx] = { ...db.extraRequests[existingIdx], ...newReq };
            } else {
              db.extraRequests.unshift(newReq);
            }

            writeDb(db);
            return sendJson(res, 201, { success: true, data: newReq });
          }

          if (req.method === 'PUT' || req.method === 'PATCH') {
            const body = await parseBody(req);
            const { requestId, status, vendorNote } = body;
            const idx = db.extraRequests.findIndex(r => r.id === requestId);
            if (idx === -1) {
              return sendJson(res, 404, { success: false, message: 'Request not found' });
            }

            db.extraRequests[idx] = {
              ...db.extraRequests[idx],
              status,
              vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Milk available, will deliver!' : 'Sorry, extra milk is not available for this shift.'),
              respondedAt: new Date().toISOString()
            };

            writeDb(db);
            return sendJson(res, 200, { success: true, data: db.extraRequests[idx] });
          }
        }

        // 4. LEAVE REQUESTS API
        if (pathname === '/api/leave-requests') {
          if (!db.leaveRequests) db.leaveRequests = [];

          if (req.method === 'GET') {
            const customerId = url.searchParams.get('customerId');
            const status = url.searchParams.get('status');
            let list = [...db.leaveRequests];
            if (customerId) list = list.filter(l => l.customerId === customerId);
            if (status) list = list.filter(l => l.status === status);
            return sendJson(res, 200, { success: true, count: list.length, data: list });
          }

          if (req.method === 'POST') {
            const body = await parseBody(req);
            const { id, customerId, customerName, houseNo, phone, fromDate, toDate, shift, reason } = body;

            const existingIdx = db.leaveRequests.findIndex(l =>
              (id && l.id === id) ||
              (l.customerId === customerId && l.fromDate === fromDate && l.toDate === toDate && (l.shift || 'BOTH') === (shift || 'BOTH'))
            );

            const newLeave = {
              id: id || (existingIdx >= 0 ? db.leaveRequests[existingIdx].id : `leave_${Date.now()}`),
              customerId,
              customerName: customerName || 'Valued Customer',
              houseNo: houseNo || '—',
              phone: phone || '',
              fromDate,
              toDate,
              shift: shift || 'BOTH',
              reason: reason || 'Personal work / out of town',
              status: (existingIdx >= 0 && db.leaveRequests[existingIdx].status !== 'PENDING') ? db.leaveRequests[existingIdx].status : 'PENDING',
              vendorNote: existingIdx >= 0 ? db.leaveRequests[existingIdx].vendorNote : '',
              createdAt: (existingIdx >= 0 ? db.leaveRequests[existingIdx].createdAt : null) || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };

            if (existingIdx >= 0) {
              db.leaveRequests[existingIdx] = { ...db.leaveRequests[existingIdx], ...newLeave };
            } else {
              db.leaveRequests.unshift(newLeave);
            }

            writeDb(db);
            return sendJson(res, 201, { success: true, data: newLeave });
          }

          if (req.method === 'PUT' || req.method === 'PATCH') {
            const body = await parseBody(req);
            const { requestId, status, vendorNote } = body;
            const idx = db.leaveRequests.findIndex(l => l.id === requestId);
            if (idx === -1) {
              return sendJson(res, 404, { success: false, message: 'Leave request not found' });
            }

            db.leaveRequests[idx] = {
              ...db.leaveRequests[idx],
              status,
              vendorNote: vendorNote || (status === 'ACCEPTED' ? 'Leave noted! Milk delivery paused.' : 'Sorry, leave cannot be approved at this time.'),
              respondedAt: new Date().toISOString()
            };

            writeDb(db);
            return sendJson(res, 200, { success: true, data: db.leaveRequests[idx] });
          }
        }

        // 5. SEND NOTIFICATION API
        if (pathname === '/api/send-notification') {
          if (!db.notifications) db.notifications = [];

          if (req.method === 'GET') {
            const targetRole = url.searchParams.get('targetRole');
            const targetUserId = url.searchParams.get('targetUserId');
            const since = url.searchParams.get('since');

            let list = [...db.notifications];
            if (targetRole) list = list.filter(n => !n.targetRole || n.targetRole === targetRole.toUpperCase());
            if (targetUserId) list = list.filter(n => !n.targetUserId || n.targetUserId === targetUserId);
            if (since) {
              const sinceTs = new Date(since).getTime();
              list = list.filter(n => new Date(n.timestamp).getTime() > sinceTs);
            }

            return sendJson(res, 200, { success: true, count: list.length, data: list.slice(-50).reverse() });
          }

          if (req.method === 'POST') {
            const body = await parseBody(req);
            const notifItem = {
              id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              title: body.title,
              message: body.message,
              targetRole: body.targetRole ? body.targetRole.toUpperCase() : null,
              targetUserId: body.targetUserId || null,
              type: body.type || 'GENERAL_ALERT',
              payload: body.payload || {},
              timestamp: new Date().toISOString()
            };

            db.notifications.push(notifItem);
            if (db.notifications.length > 200) db.notifications.shift();
            writeDb(db);
            return sendJson(res, 200, { success: true, data: notifItem });
          }
        }

        // 6. DEVICE TOKENS API
        if (pathname === '/api/device-tokens') {
          return sendJson(res, 200, { success: true });
        }

        // 7. AUTH API (Owner & Customer Login)
        if (pathname === '/api/auth') {
          if (req.method === 'POST') {
            const body = await parseBody(req);
            const { action, phone, pin, otp, isOtpMode } = body;

            if (action === 'owner-login') {
              if (isOtpMode) {
                if (otp === '1234' || (otp && String(otp).length >= 4)) {
                  return sendJson(res, 200, {
                    success: true,
                    user: { role: 'ADMIN', name: 'மாரிமுத்து (அப்பா)', phone: phone || '9842154321' }
                  });
                }
                return sendJson(res, 401, { success: false, error: 'INVALID_OTP' });
              }

              if (pin === '1234') {
                return sendJson(res, 200, {
                  success: true,
                  user: { role: 'ADMIN', name: 'மாரிமுத்து (அப்பா)', phone: phone || '9842154321' }
                });
              }
              return sendJson(res, 401, { success: false, error: 'INVALID_PIN' });
            }

            if (action === 'customer-login') {
              const cleanQuery = (phone || '').trim().toLowerCase();
              const digitsOnly = cleanQuery.replace(/[^0-9]/g, '');
              const matched = (db.customers || []).find(c =>
                c.id === cleanQuery ||
                (digitsOnly.length >= 4 && c.phone && c.phone.replace(/[^0-9]/g, '').includes(digitsOnly)) ||
                (c.name && c.name.toLowerCase().includes(cleanQuery))
              );
              if (matched) {
                return sendJson(res, 200, { success: true, customer: matched });
              }
              return sendJson(res, 404, { success: false, error: 'CUSTOMER_NOT_FOUND' });
            }
          }
        }

        return next();
      });
    }
  };
}
