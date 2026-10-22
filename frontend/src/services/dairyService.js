// Dairy Business Data Service (Firestore + Local Persistence)
import { db, isRealFirebase } from '../config/firebase';
import { collection, doc, setDoc, getDocs, updateDoc, query, where } from 'firebase/firestore';

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
    status: 'ACTIVE'
  }
];

export const dairyService = {
  // Load Customers
  getCustomers: () => {
    const local = localStorage.getItem('paal_vandi_customers');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(e);
      }
    }
    localStorage.setItem('paal_vandi_customers', JSON.stringify(INITIAL_CUSTOMERS));
    return INITIAL_CUSTOMERS;
  },

  // Save Customer (Add or Update)
  saveCustomer: (customer) => {
    const list = dairyService.getCustomers();
    const index = list.findIndex(c => c.id === customer.id);
    let updated;
    if (index >= 0) {
      updated = [...list];
      updated[index] = customer;
    } else {
      const newCust = {
        ...customer,
        id: customer.id || `cust_${Date.now()}`,
        routeOrder: customer.routeOrder || list.length + 1,
        status: 'ACTIVE'
      };
      updated = [...list, newCust];
    }
    localStorage.setItem('paal_vandi_customers', JSON.stringify(updated));
    
    // Firestore async sync
    if (isRealFirebase && db) {
      try {
        const docRef = doc(db, 'customers', customer.id || updated[updated.length - 1].id);
        setDoc(docRef, customer, { merge: true });
      } catch (e) {
        console.warn("Firestore sync error:", e);
      }
    }
    return updated;
  },

  // Delete Customer
  deleteCustomer: (id) => {
    const list = dairyService.getCustomers().filter(c => c.id !== id);
    localStorage.setItem('paal_vandi_customers', JSON.stringify(list));
    return list;
  },

  // Get Today's Delivery Records for given Date and Shift
  // Date format: YYYY-MM-DD, shift: 'MORNING' | 'EVENING'
  getDailyDeliverySheet: (dateStr, shift = 'MORNING') => {
    const key = `paal_vandi_deliveries_${dateStr}_${shift}`;
    const customers = dairyService.getCustomers().sort((a, b) => (a.routeOrder || 0) - (b.routeOrder || 0));
    const saved = localStorage.getItem(key);
    let records = saved ? JSON.parse(saved) : {};

    // Get any active vacation/leave pauses for this customer on this date
    const vacationList = dairyService.getVacationList();

    // Map each customer to a delivery row
    return customers.map(cust => {
      const activeVacation = vacationList.find(v => 
        v.customerId === cust.id && 
        v.date === dateStr && 
        (!v.shift || v.shift === 'BOTH' || v.shift === shift)
      );
      const isPaused = Boolean(activeVacation);
      const defaultQty = shift === 'MORNING' ? (cust.defaultMorningQty || 0) : (cust.defaultEveningQty || 0);
      
      const record = records[cust.id] || {
        status: isPaused ? 'SKIPPED' : 'PENDING',
        litres: isPaused ? 0 : defaultQty,
        extraLitres: 0,
        deliveredTime: null,
        note: isPaused ? 'விடுப்பில் உள்ளார் (On Leave)' : ''
      };

      return {
        customer: cust,
        ...record,
        defaultQty
      };
    });
  },

  // Update Single Delivery Status (Mark Delivered, Skip, Extra)
  updateDeliveryRecord: (dateStr, shift, customerId, status, litres, extraLitres = 0, note = '') => {
    const key = `paal_vandi_deliveries_${dateStr}_${shift}`;
    const saved = localStorage.getItem(key);
    let records = saved ? JSON.parse(saved) : {};

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    records[customerId] = {
      status, // 'DELIVERED' | 'SKIPPED' | 'PENDING'
      litres: Number(litres) || 0,
      extraLitres: Number(extraLitres) || 0,
      deliveredTime: status === 'DELIVERED' ? timeStr : null,
      note: note || '',
      updatedAt: now.toISOString()
    };

    localStorage.setItem(key, JSON.stringify(records));

    // Also update overall monthly register index
    dairyService.touchMonthlyRegister(dateStr);

    return records;
  },

  // Mark all remaining pending as Delivered with 1-tap
  markAllDelivered: (dateStr, shift) => {
    const sheet = dairyService.getDailyDeliverySheet(dateStr, shift);
    sheet.forEach(item => {
      if (item.status === 'PENDING' && item.defaultQty > 0) {
        dairyService.updateDeliveryRecord(
          dateStr,
          shift,
          item.customer.id,
          'DELIVERED',
          item.defaultQty,
          0,
          'தானியங்கி உறுதி (Auto Marked)'
        );
      }
    });
    return dairyService.getDailyDeliverySheet(dateStr, shift);
  },

  // Vacation / Leave Management
  getVacationList: () => {
    const saved = localStorage.getItem('paal_vandi_vacations');
    return saved ? JSON.parse(saved) : [];
  },

  // Cut-off rule checker for village dairy timings
  checkLeaveCutoff: (dateStr, shift = 'BOTH') => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // If future date (tomorrow onwards), always valid!
    if (dateStr > todayStr) {
      return { allowed: true };
    }

    // Past date cannot be paused retroactively
    if (dateStr < todayStr) {
      return {
        allowed: false,
        message: 'கடந்த தேதிகளுக்கு லீவு பதிவு செய்ய முடியாது (Cannot apply leave for past dates)'
      };
    }

    // Date is TODAY: check strict dairy dispatch cut-off hours
    const currentHour = now.getHours();
    const currentMinutes = now.getMinutes();
    const currentTimeDec = currentHour + currentMinutes / 60.0;

    // Morning delivery departs early (5:00 AM)
    if (shift === 'MORNING' || shift === 'BOTH') {
      if (currentTimeDec >= 5.0) {
        return {
          allowed: false,
          shift: 'MORNING',
          cutoff: '5:00 AM',
          message: 'காலை பால் விநியோகம் ஏற்கனவே புறப்பட்டுவிட்டது! (Morning milk is already out for delivery). காலை லீவுக்கு முந்தைய நாளே தெரிவிக்க வேண்டும். அவசர தேவைக்கு பண்ணையாளரை அழைக்கவும்.'
        };
      }
    }

    // Evening delivery packing completes at 3:00 PM (15:00)
    if (shift === 'EVENING' || shift === 'BOTH') {
      if (currentTimeDec >= 15.0) {
        return {
          allowed: false,
          shift: 'EVENING',
          cutoff: '3:00 PM',
          message: 'மாலை பால் பேக்கிங் பணி தொடங்கிவிட்டது! மாலை ஷிப்ட் லீவுக்கு மதியம் 3:00 மணிக்குள் தெரிவிக்க வேண்டும் (Evening leave must be notified before 3:00 PM).'
        };
      }
    }

    return { allowed: true };
  },

  // Add confirmed vacation days with specific shift ('BOTH' | 'MORNING' | 'EVENING')
  addVacation: (customerId, fromDate, toDate, shift = 'BOTH', reason = 'வெளியூர் பயணம்') => {
    const list = dairyService.getVacationList();
    const days = [];
    let cur = new Date(fromDate);
    const end = new Date(toDate);

    while (cur <= end) {
      const dateStr = cur.toISOString().split('T')[0];
      days.push({
        id: `vac_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        customerId,
        date: dateStr,
        shift, // 'BOTH', 'MORNING', or 'EVENING'
        reason,
        createdAt: new Date().toISOString()
      });
      cur.setDate(cur.getDate() + 1);
    }

    const updated = [...list, ...days];
    localStorage.setItem('paal_vandi_vacations', JSON.stringify(updated));
    return updated;
  },

  // Leave Requests from Customers
  getLeaveRequests: () => {
    const saved = localStorage.getItem('paal_vandi_leave_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultLeaves = [
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
    localStorage.setItem('paal_vandi_leave_requests', JSON.stringify(defaultLeaves));
    return defaultLeaves;
  },

  // Customer submits leave request with specific shift ('BOTH', 'MORNING', 'EVENING')
  requestLeave: async (customerData, fromDate, toDate, shift = 'BOTH', reason = 'வெளியூர் பயணம்') => {
    const list = dairyService.getLeaveRequests();
    const customerId = typeof customerData === 'string' ? customerData : customerData.id;
    const customer = typeof customerData === 'object' ? customerData : dairyService.getCustomers().find(c => c.id === customerId);

    const newLeave = {
      id: `leave_${Date.now()}`,
      customerId,
      customerName: customer?.name || 'Valued Customer',
      houseNo: customer?.houseNo || '—',
      phone: customer?.phone || '',
      fromDate,
      toDate,
      shift,
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updated = [newLeave, ...list];
    localStorage.setItem('paal_vandi_leave_requests', JSON.stringify(updated));

    // Try posting to server API asynchronously
    try {
      fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLeave)
      }).catch(() => {});
    } catch (e) { /* offline fallback */ }

    // Broadcast event to notify Vendor in real time
    dairyService.broadcastEvent('LEAVE_REQUEST_CREATED', newLeave);

    return newLeave;
  },

  // Vendor responds to leave request (Accept or Reject)
  respondToLeaveRequest: async (requestId, status, vendorNote = '') => {
    const list = dairyService.getLeaveRequests();
    const index = list.findIndex(l => l.id === requestId);
    if (index === -1) return null;

    const currentReq = list[index];
    const defaultNote = status === 'ACCEPTED'
      ? 'சரி! லீவு குறிக்கப்பட்டது. பால் விநியோகம் நிறுத்தப்படும் (Leave confirmed! Milk delivery paused)'
      : 'மன்னிக்கவும்! லீவு ஏற்கப்படவில்லை (Sorry, cannot pause delivery at this time)';

    const updatedReq = {
      ...currentReq,
      status, // 'ACCEPTED' or 'REJECTED'
      vendorNote: vendorNote || defaultNote,
      respondedAt: new Date().toISOString()
    };

    list[index] = updatedReq;
    localStorage.setItem('paal_vandi_leave_requests', JSON.stringify(list));

    // If ACCEPTED, register vacation and update delivery sheet for that customer!
    if (status === 'ACCEPTED') {
      dairyService.addVacation(
        currentReq.customerId,
        currentReq.fromDate,
        currentReq.toDate,
        currentReq.shift,
        currentReq.reason
      );

      // Mark affected dates & shifts as SKIPPED in delivery sheet
      let cur = new Date(currentReq.fromDate);
      const end = new Date(currentReq.toDate);
      while (cur <= end) {
        const dStr = cur.toISOString().split('T')[0];
        const shiftsToSkip = currentReq.shift === 'BOTH' ? ['MORNING', 'EVENING'] : [currentReq.shift];
        shiftsToSkip.forEach(s => {
          dairyService.updateDeliveryRecord(
            dStr,
            s,
            currentReq.customerId,
            'SKIPPED',
            0,
            0,
            `விடுப்பு (${currentReq.shift === 'BOTH' ? 'முழு நாள் லீவு' : currentReq.shift + ' லீவு'})`
          );
        });
        cur.setDate(cur.getDate() + 1);
      }
    }

    // Try pushing response to server API asynchronously
    try {
      fetch('/api/leave-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          vendorNote: updatedReq.vendorNote
        })
      }).catch(() => {});
    } catch (e) { /* offline fallback */ }

    // Broadcast event so Customer tab receives immediate confirmation!
    dairyService.broadcastEvent('LEAVE_REQUEST_RESPONDED', updatedReq);

    return updatedReq;
  },

  // Extra Milk Requests from Customers
  getExtraMilkRequests: () => {
    const saved = localStorage.getItem('paal_vandi_extra_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    const defaultList = [
      {
        id: "req_demo_1",
        customerId: "cust_1",
        customerName: "முத்துசாமி (Muthusamy)",
        houseNo: "14/A",
        phone: "9840112345",
        date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        shift: "MORNING",
        extraLitres: 1.0,
        reason: "விருந்தினர் வருகை (Guests visiting)",
        status: "PENDING",
        createdAt: new Date().toISOString()
      }
    ];
    localStorage.setItem('paal_vandi_extra_requests', JSON.stringify(defaultList));
    return defaultList;
  },

  // Customer creates a request with status 'PENDING'
  requestExtraMilk: async (customerData, dateStr, shift, extraLitres, reason = 'விருந்தினர் வருகை') => {
    const list = dairyService.getExtraMilkRequests();
    const customerId = typeof customerData === 'string' ? customerData : customerData.id;
    const customer = typeof customerData === 'object' ? customerData : dairyService.getCustomers().find(c => c.id === customerId);

    const newReq = {
      id: `req_${Date.now()}`,
      customerId,
      customerName: customer?.name || 'Valued Customer',
      houseNo: customer?.houseNo || '—',
      phone: customer?.phone || '',
      date: dateStr,
      shift,
      extraLitres: Number(extraLitres),
      reason,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const updated = [newReq, ...list];
    localStorage.setItem('paal_vandi_extra_requests', JSON.stringify(updated));

    // Post to server API asynchronously
    try {
      fetch('/api/extra-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReq)
      }).catch(() => {});
    } catch (e) { /* offline fallback */ }

    // Broadcast event to notify Vendor tab in real-time
    dairyService.broadcastEvent('EXTRA_REQUEST_CREATED', newReq);

    return newReq;
  },

  // Vendor accepts or rejects the customer's extra milk request
  respondToExtraMilkRequest: async (requestId, status, vendorNote = '') => {
    const list = dairyService.getExtraMilkRequests();
    const index = list.findIndex(r => r.id === requestId);
    if (index === -1) return null;

    const currentReq = list[index];
    const defaultNote = status === 'ACCEPTED' 
      ? 'பால் உள்ளது! விநியோகம் செய்யப்படும் (Milk is available! Will be delivered)'
      : 'மன்னிக்கவும்! கூடுதல் பால் இருப்பு இல்லை (Sorry, extra milk is not available for this shift)';

    const updatedReq = {
      ...currentReq,
      status, // 'ACCEPTED' or 'REJECTED'
      vendorNote: vendorNote || defaultNote,
      respondedAt: new Date().toISOString()
    };

    list[index] = updatedReq;
    localStorage.setItem('paal_vandi_extra_requests', JSON.stringify(list));

    // If ACCEPTED, automatically update the Delivery Runner Sheet!
    if (status === 'ACCEPTED') {
      const currentRecords = dairyService.getDailyDeliverySheet(currentReq.date, currentReq.shift);
      const match = currentRecords.find(r => r.customer.id === currentReq.customerId);
      if (match) {
        dairyService.updateDeliveryRecord(
          currentReq.date,
          currentReq.shift,
          currentReq.customerId,
          match.status === 'SKIPPED' ? 'DELIVERED' : match.status,
          (match.defaultQty || 0) + Number(currentReq.extraLitres),
          Number(currentReq.extraLitres),
          `கூடுதல் பால்: +${currentReq.extraLitres}L (${currentReq.reason})`
        );
      }
    }

    // Push response to server API asynchronously
    try {
      fetch('/api/extra-requests', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
          vendorNote: updatedReq.vendorNote
        })
      }).catch(() => {});
    } catch (e) { /* offline fallback */ }

    // Broadcast event so Customer tab receives immediate confirmation!
    dairyService.broadcastEvent('EXTRA_REQUEST_RESPONDED', updatedReq);

    return updatedReq;
  },

  // Real-time broadcast channel helper
  broadcastEvent: (type, payload) => {
    try {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('paal_vandi_notification', { detail: { type, payload } }));
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('paal_vandi_channel');
          bc.postMessage({ type, payload });
          bc.close();
        }
      }
    } catch (e) {
      console.warn('Broadcast note:', e);
    }
  },

  // Subscriber hook for real-time events
  subscribeToNotifications: (callback) => {
    if (typeof window === 'undefined') return () => {};

    const localHandler = (e) => {
      if (e.detail) callback(e.detail);
    };
    window.addEventListener('paal_vandi_notification', localHandler);

    let bc = null;
    if ('BroadcastChannel' in window) {
      bc = new BroadcastChannel('paal_vandi_channel');
      bc.onmessage = (event) => {
        if (event.data) callback(event.data);
      };
    }

    return () => {
      window.removeEventListener('paal_vandi_notification', localHandler);
      if (bc) bc.close();
    };
  },

  // Monthly Billing Ledger Computation
  // monthStr format: 'YYYY-MM' (e.g., '2026-10')
  getMonthLedger: (monthStr) => {
    const customers = dairyService.getCustomers();
    const [year, month] = monthStr.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    // Payments store: key `paal_vandi_payments_YYYY_MM`
    const paymentsKey = `paal_vandi_payments_${monthStr}`;
    const payments = JSON.parse(localStorage.getItem(paymentsKey) || '{}');

    return customers.map(cust => {
      let totalLitres = 0;
      let deliveredDays = 0;
      let skippedDays = 0;
      const dailyBreakdown = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${monthStr}-${String(day).padStart(2, '0')}`;
        
        // Morning
        const mKey = `paal_vandi_deliveries_${dayStr}_MORNING`;
        const mSaved = JSON.parse(localStorage.getItem(mKey) || '{}');
        const mRecord = mSaved[cust.id];

        // Evening
        const eKey = `paal_vandi_deliveries_${dayStr}_EVENING`;
        const eSaved = JSON.parse(localStorage.getItem(eKey) || '{}');
        const eRecord = eSaved[cust.id];

        let dayLitres = 0;
        let dayStatus = 'NO_SCHEDULE';

        // Check if there was delivery
        const mQty = (mRecord && mRecord.status === 'DELIVERED') ? Number(mRecord.litres || 0) : 0;
        const eQty = (eRecord && eRecord.status === 'DELIVERED') ? Number(eRecord.litres || 0) : 0;
        dayLitres = mQty + eQty;

        const isSkipped = (mRecord && mRecord.status === 'SKIPPED') || (eRecord && eRecord.status === 'SKIPPED');

        if (dayLitres > 0) {
          dayStatus = 'DELIVERED';
          deliveredDays++;
          totalLitres += dayLitres;
        } else if (isSkipped) {
          dayStatus = 'SKIPPED';
          skippedDays++;
        } else {
          // If in the future or no delivery logged yet, check defaults
          const todayStr = new Date().toISOString().split('T')[0];
          if (dayStr <= todayStr && (cust.defaultMorningQty > 0 || cust.defaultEveningQty > 0)) {
            // Unmarked past day - treat as delivered for ledger estimate if not skipped
            const estQty = (cust.defaultMorningQty || 0) + (cust.defaultEveningQty || 0);
            dayLitres = estQty;
            totalLitres += dayLitres;
            deliveredDays++;
            dayStatus = 'DELIVERED';
          }
        }

        dailyBreakdown.push({
          date: dayStr,
          day,
          litres: dayLitres,
          morningLitres: mQty,
          eveningLitres: eQty,
          status: dayStatus,
        });
      }

      const rate = cust.ratePerLitre || 56;
      const totalAmount = Math.round(totalLitres * rate);
      const paidAmount = Number(payments[cust.id]?.paidAmount || 0);
      const balanceDue = Math.max(0, totalAmount - paidAmount);

      return {
        customer: cust,
        totalLitres: parseFloat(totalLitres.toFixed(1)),
        deliveredDays,
        skippedDays,
        rate,
        totalAmount,
        paidAmount,
        balanceDue,
        paymentStatus: balanceDue === 0 ? 'PAID' : (paidAmount > 0 ? 'PARTIAL' : 'PENDING'),
        dailyBreakdown
      };
    });
  },

  // Record a payment
  recordPayment: (monthStr, customerId, amount, mode = 'UPI') => {
    const paymentsKey = `paal_vandi_payments_${monthStr}`;
    const payments = JSON.parse(localStorage.getItem(paymentsKey) || '{}');
    payments[customerId] = {
      paidAmount: Number(amount),
      paidAt: new Date().toISOString(),
      mode
    };
    localStorage.setItem(paymentsKey, JSON.stringify(payments));
    return payments;
  },

  // Milking Tally Ledger (Morning / Evening Cow Yield)
  getMilkingYield: (dateStr) => {
    const key = `paal_vandi_milking_${dateStr}`;
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : {
      date: dateStr,
      totalCows: 6,
      morningYield: 34.0,
      eveningYield: 22.0,
      fatPercentage: 4.5,
      snfPercentage: 8.8,
      notes: 'அனைத்து மாடுகளும் நலமாக உள்ளன (Cows healthy & grass fed)'
    };
  },

  saveMilkingYield: (record) => {
    const key = `paal_vandi_milking_${record.date}`;
    localStorage.setItem(key, JSON.stringify(record));
    return record;
  },

  touchMonthlyRegister: (dateStr) => {
    // Keeps a quick index of active months
    const month = dateStr.substring(0, 7);
    const months = JSON.parse(localStorage.getItem('paal_vandi_months') || '[]');
    if (!months.includes(month)) {
      months.push(month);
      localStorage.setItem('paal_vandi_months', JSON.stringify(months));
    }
  }
};
