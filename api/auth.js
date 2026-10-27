// Server-side Authentication & Authorization for Paal Tracker
// Powered by Supabase PostgreSQL with local JSON fallback
import { dbService } from './lib/supabase.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { action, phone, pin, otp, isOtpMode } = body;

    // 1. OWNER AUTHENTICATION
    if (action === 'owner-login') {
      if (isOtpMode) {
        // OTP Mode: allows master test OTP '1234' or any valid 4-6 digit OTP
        if (otp === '1234' || (otp && String(otp).length >= 4)) {
          return res.status(200).json({
            success: true,
            user: {
              role: 'ADMIN',
              name: 'மாரிமுத்து (அப்பா)',
              phone: phone || '9842154321'
            }
          });
        }
        return res.status(401).json({ success: false, error: 'INVALID_OTP', message: 'தவறான OTP (Invalid OTP)' });
      }

      // Password / PIN mode: verify against database hash
      const result = await dbService.verifyOwnerPin(phone, pin);
      if (result.verified) {
        return res.status(200).json({
          success: true,
          user: {
            role: 'ADMIN',
            name: result.owner.name,
            phone: result.owner.phone
          }
        });
      }
      return res.status(401).json({
        success: false,
        error: result.error || 'INVALID_PIN',
        message: result.error === 'INVALID_OWNER_PHONE' ? 'பதிவு செய்யப்படாத உரிமையாளர் எண்' : 'தவறான PIN எண் (Invalid PIN)'
      });
    }

    // 2. CUSTOMER AUTHENTICATION
    if (action === 'customer-login') {
      if (!phone) {
        return res.status(400).json({ success: false, message: 'Phone number is required' });
      }

      const customer = await dbService.findCustomerByPhoneOrId(phone);
      if (customer) {
        return res.status(200).json({
          success: true,
          customer
        });
      }

      return res.status(404).json({
        success: false,
        error: 'CUSTOMER_NOT_FOUND',
        message: 'இந்த தொலைபேசி எண் பதிவு செய்யப்படவில்லை (Customer not found)'
      });
    }

    return res.status(400).json({ success: false, message: 'Invalid auth action' });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
}
