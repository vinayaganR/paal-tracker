-- ============================================================
-- Paal Tracker (PaalVandi) Supabase PostgreSQL Schema
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)
-- ============================================================

-- 1. CUSTOMERS TABLE
CREATE TABLE IF NOT EXISTS public.customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    house_no TEXT NOT NULL,
    street TEXT DEFAULT '',
    phone TEXT NOT NULL UNIQUE,
    default_morning_qty NUMERIC(5, 2) NOT NULL DEFAULT 1.0,
    default_evening_qty NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    rate_per_litre NUMERIC(6, 2) NOT NULL DEFAULT 56.0,
    route_order INTEGER NOT NULL DEFAULT 1,
    notes TEXT DEFAULT '',
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for phone lookups and route ordering
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_route_order ON public.customers(route_order);

-- 2. DELIVERIES TABLE
CREATE TABLE IF NOT EXISTS public.deliveries (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift TEXT NOT NULL CHECK (shift IN ('MORNING', 'EVENING')),
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'DELIVERED' CHECK (status IN ('DELIVERED', 'SKIPPED', 'PENDING')),
    litres NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    extra_litres NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    delivered_time TEXT,
    note TEXT DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (date, shift, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_deliveries_date_shift ON public.deliveries(date, shift);
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON public.deliveries(customer_id);

-- 3. EXTRA MILK REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.extra_requests (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    house_no TEXT,
    phone TEXT,
    date DATE NOT NULL,
    shift TEXT NOT NULL CHECK (shift IN ('MORNING', 'EVENING')),
    extra_litres NUMERIC(5, 2) NOT NULL,
    reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    vendor_note TEXT DEFAULT '',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, date, shift)
);

CREATE INDEX IF NOT EXISTS idx_extra_requests_customer ON public.extra_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_extra_requests_date ON public.extra_requests(date);

-- 4. LEAVE REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.leave_requests (
    id TEXT PRIMARY KEY,
    customer_id TEXT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name TEXT,
    house_no TEXT,
    phone TEXT,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    shift TEXT NOT NULL DEFAULT 'BOTH' CHECK (shift IN ('BOTH', 'MORNING', 'EVENING')),
    reason TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
    vendor_note TEXT DEFAULT '',
    responded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (customer_id, from_date, to_date, shift)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_customer ON public.leave_requests(customer_id);

-- 5. OWNER / FARM SETTINGS TABLE (Authentication & Profile)
CREATE TABLE IF NOT EXISTS public.owner_settings (
    id TEXT PRIMARY KEY DEFAULT 'owner_default',
    farm_name TEXT NOT NULL DEFAULT 'dheena dhinesh farming',
    owner_name TEXT NOT NULL DEFAULT 'மாரிமுத்து (அப்பா)',
    phone TEXT NOT NULL DEFAULT '9842154321',
    pin_hash TEXT NOT NULL, -- SHA-256 hashed PIN
    upi_id TEXT DEFAULT 'dairyfarm@okaxis',
    address TEXT DEFAULT '12, காமராஜர் தெரு, பண்ணை தோட்டம்',
    default_rate NUMERIC(6, 2) DEFAULT 56.0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default owner credentials (PIN '1234' hashed with SHA-256)
-- SHA-256 of '1234' = '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4'
INSERT INTO public.owner_settings (id, farm_name, owner_name, phone, pin_hash, upi_id, address, default_rate)
VALUES (
    'owner_default',
    'dheena dhinesh farming',
    'மாரிமுத்து (அப்பா)',
    '9842154321',
    '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',
    'dairyfarm@okaxis',
    '12, காமராஜர் தெரு, பண்ணை தோட்டம்',
    56.0
) ON CONFLICT (id) DO NOTHING;

-- 6. MIGRATE INITIAL CUSTOMERS (Safely with ON CONFLICT DO NOTHING)
INSERT INTO public.customers (id, name, house_no, street, phone, default_morning_qty, default_evening_qty, rate_per_litre, route_order, notes, start_date, status)
VALUES
('cust_1', 'முத்துசாமி (Muthusamy)', '14/A', 'பாரதியார் வீதி (Bharathiyar St)', '9840112345', 1.0, 0.5, 56.0, 1, 'கேட்டில் உள்ள பாத்திரத்தில் ஊற்றவும் (Leave in gate can)', '2026-10-01', 'ACTIVE'),
('cust_2', 'சுந்தரம் ஆசிரியர் (Sundaram Teacher)', '28', 'பாரதியார் வீதி (Bharathiyar St)', '9789223456', 1.5, 0.0, 56.0, 2, 'மணி அடிக்கவும் (Ring bell)', '2026-10-01', 'ACTIVE'),
('cust_3', 'விஜயலட்சுமி அம்மாள் (Vijayalakshmi)', '5', 'அம்மன் கோவில் தெரு (Amman Kovil St)', '9443334567', 0.5, 0.5, 56.0, 3, 'பூனை வராதபடி மூடி வைக்கவும்', '2026-10-01', 'ACTIVE'),
('cust_4', 'சரவணன் மெடிக்கல்ஸ் (Saravanan)', '42', 'மெயின் ரோடு (Main Road)', '9944445678', 2.0, 1.0, 54.0, 4, 'கடை வாசலில் வைக்கவும்', '2026-10-01', 'ACTIVE'),
('cust_5', 'கார்த்திக் இன்ஜினியர் (Karthik)', '108', 'நேரு நகர் (Nehru Nagar)', '9841556789', 1.0, 0.0, 56.0, 5, 'கூகுள் பே மூலம் மாதாந்திர கட்டணம் செலுத்துவார்', '2026-10-01', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owner_settings ENABLE ROW LEVEL SECURITY;

-- Allow read access to active customers & public insert for registration
CREATE POLICY "Public Read Customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Public Insert Customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Service Role Full Access Customers" ON public.customers FOR ALL USING (auth.role() = 'service_role');

-- Allow deliveries access
CREATE POLICY "Public Read Deliveries" ON public.deliveries FOR SELECT USING (true);
CREATE POLICY "Public Insert/Update Deliveries" ON public.deliveries FOR ALL USING (true);

-- Allow extra requests
CREATE POLICY "Public Read Extra Requests" ON public.extra_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Extra Requests" ON public.extra_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Extra Requests" ON public.extra_requests FOR UPDATE USING (true);

-- Allow leave requests
CREATE POLICY "Public Read Leave Requests" ON public.leave_requests FOR SELECT USING (true);
CREATE POLICY "Public Insert Leave Requests" ON public.leave_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Leave Requests" ON public.leave_requests FOR UPDATE USING (true);

-- Owner settings: Read only public info, allow full access to service_role
CREATE POLICY "Public Read Owner Settings" ON public.owner_settings FOR SELECT USING (true);
CREATE POLICY "Service Role Full Access Owner Settings" ON public.owner_settings FOR ALL USING (auth.role() = 'service_role');
