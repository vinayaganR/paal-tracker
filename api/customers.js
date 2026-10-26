// Vercel Serverless Function for Customer Directory Synchronization
// Ensures new customer registrations sync across multiple devices

let inMemoryCustomers = [
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
    ratePerLitre: 54,
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

  // GET: Fetch all customers
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      count: inMemoryCustomers.length,
      data: inMemoryCustomers
    });
  }

  // POST: Add or update customer
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { id, name, houseNo, street, phone, defaultMorningQty, defaultEveningQty, ratePerLitre, notes } = body;

      if (!name || !phone) {
        return res.status(400).json({ success: false, message: 'Name and phone are required' });
      }

      const existingIndex = inMemoryCustomers.findIndex(c => c.id === id || c.phone.replace(/[^0-9]/g, '') === phone.replace(/[^0-9]/g, ''));
      const customerData = {
        id: id || `cust_${Date.now()}`,
        name,
        houseNo: houseNo || '—',
        street: street || '',
        phone,
        defaultMorningQty: Number(defaultMorningQty) || 1.0,
        defaultEveningQty: Number(defaultEveningQty) || 0.0,
        ratePerLitre: Number(ratePerLitre) || 56,
        routeOrder: existingIndex >= 0 ? inMemoryCustomers[existingIndex].routeOrder : inMemoryCustomers.length + 1,
        notes: notes || '',
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        inMemoryCustomers[existingIndex] = { ...inMemoryCustomers[existingIndex], ...customerData };
      } else {
        inMemoryCustomers.push(customerData);
      }

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
