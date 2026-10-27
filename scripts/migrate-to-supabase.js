// Standalone migration script to upload local data/db.json records to Supabase PostgreSQL
// Run: node scripts/migrate-to-supabase.js
import fs from 'fs';
import path from 'path';

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
  ''
);

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY) environment variables are required.');
  console.log('\nUsage:');
  console.log('  $env:SUPABASE_URL="https://xyz.supabase.co"');
  console.log('  $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."');
  console.log('  node scripts/migrate-to-supabase.js\n');
  process.exit(1);
}

const dbFile = path.resolve('data/db.json');
if (!fs.existsSync(dbFile)) {
  console.error(`❌ Error: db.json not found at ${dbFile}`);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbFile, 'utf-8'));

async function postToSupabase(endpoint, rows) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to insert into ${endpoint} (${res.status}): ${txt}`);
  }
  return res.json();
}

async function runMigration() {
  console.log('🚀 Starting migration to Supabase PostgreSQL...');
  console.log(`📍 Supabase Project: ${SUPABASE_URL}`);

  // 1. Customers
  if (db.customers && db.customers.length > 0) {
    console.log(`\n📦 Migrating ${db.customers.length} customers...`);
    const customerRows = db.customers.map(c => ({
      id: c.id,
      name: c.name,
      house_no: c.houseNo || '—',
      street: c.street || '',
      phone: c.phone,
      default_morning_qty: Number(c.defaultMorningQty) || 1.0,
      default_evening_qty: Number(c.defaultEveningQty) || 0.0,
      rate_per_litre: Number(c.ratePerLitre) || 56.0,
      route_order: Number(c.routeOrder) || 1,
      notes: c.notes || '',
      start_date: c.startDate || '2026-10-01',
      registered_at: c.registeredAt || new Date().toISOString(),
      status: c.status || 'ACTIVE'
    }));
    await postToSupabase('customers', customerRows);
    console.log(`✅ Successfully migrated ${customerRows.length} customers!`);
  }

  // 2. Deliveries
  if (db.deliveries && db.deliveries.length > 0) {
    console.log(`\n📦 Migrating ${db.deliveries.length} delivery records...`);
    const deliveryRows = db.deliveries.map(d => ({
      date: d.date,
      shift: d.shift,
      customer_id: d.customerId,
      status: d.status || 'DELIVERED',
      litres: Number(d.litres) || 0.0,
      extra_litres: Number(d.extraLitres) || 0.0,
      delivered_time: d.deliveredTime || null,
      note: d.note || ''
    }));
    await postToSupabase('deliveries', deliveryRows);
    console.log(`✅ Successfully migrated ${deliveryRows.length} delivery records!`);
  }

  // 3. Extra Requests
  if (db.extraRequests && db.extraRequests.length > 0) {
    console.log(`\n📦 Migrating ${db.extraRequests.length} extra milk requests...`);
    const extraRows = db.extraRequests.map(r => ({
      id: r.id,
      customer_id: r.customerId,
      customer_name: r.customerName,
      house_no: r.houseNo,
      phone: r.phone,
      date: r.date,
      shift: r.shift,
      extra_litres: Number(r.extraLitres) || 1.0,
      reason: r.reason || '',
      status: r.status || 'PENDING',
      vendor_note: r.vendorNote || '',
      created_at: r.createdAt || new Date().toISOString()
    }));
    await postToSupabase('extra_requests', extraRows);
    console.log(`✅ Successfully migrated ${extraRows.length} extra requests!`);
  }

  // 4. Leave Requests
  if (db.leaveRequests && db.leaveRequests.length > 0) {
    console.log(`\n📦 Migrating ${db.leaveRequests.length} leave requests...`);
    const leaveRows = db.leaveRequests.map(l => ({
      id: l.id,
      customer_id: l.customerId,
      customer_name: l.customerName,
      house_no: l.houseNo,
      phone: l.phone,
      from_date: l.fromDate,
      to_date: l.toDate,
      shift: l.shift || 'BOTH',
      reason: l.reason || '',
      status: l.status || 'PENDING',
      vendor_note: l.vendorNote || '',
      created_at: l.createdAt || new Date().toISOString()
    }));
    await postToSupabase('leave_requests', leaveRows);
    console.log(`✅ Successfully migrated ${leaveRows.length} leave requests!`);
  }

  console.log('\n🎉 ALL DATA MIGRATED TO SUPABASE SUCCESSFULLY!\n');
}

runMigration().catch(err => {
  console.error('\n❌ Migration failed:', err.message);
  process.exit(1);
});
