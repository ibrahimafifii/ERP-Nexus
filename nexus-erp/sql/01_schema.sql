-- ============================================================
-- NEXUS ERP — Full Schema
-- Touch Home Gallery
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BUSINESSES
-- ============================================================
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  name_ar TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  currency TEXT DEFAULT 'EGP',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id),
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'sales'
    CHECK (role IN ('owner','manager','accountant','sales','warehouse','packer','hr')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. WAREHOUSES
-- ============================================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CATEGORIES
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  parent_id UUID REFERENCES categories(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. PRODUCTS
-- ============================================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  name_ar TEXT,
  category_id UUID REFERENCES categories(id),
  unit TEXT DEFAULT 'piece',
  unit_price DECIMAL(12,2) DEFAULT 0,
  cost_price DECIMAL(12,2) DEFAULT 0,
  min_stock INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, sku)
);

-- ============================================================
-- 6. STOCK (quantity per product per warehouse)
-- ============================================================
CREATE TABLE stock (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  warehouse_id UUID REFERENCES warehouses(id) ON DELETE CASCADE,
  quantity DECIMAL(12,2) DEFAULT 0,
  reserved_quantity DECIMAL(12,2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, warehouse_id)
);

-- ============================================================
-- 7. STOCK MOVEMENTS
-- ============================================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('purchase','sale','transfer_in','transfer_out','adjustment','damage','return')),
  quantity DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2),
  reference_type TEXT,
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CUSTOMERS
-- ============================================================
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  customer_type TEXT DEFAULT 'retail',
  credit_limit DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. SUPPLIERS
-- ============================================================
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  balance DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 10. SALES INVOICES
-- ============================================================
CREATE TABLE sales_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  book_number INT,
  customer_id UUID REFERENCES customers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  sales_channel TEXT DEFAULT 'shop',
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft','confirmed','cancelled')),
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, invoice_number)
);

-- ============================================================
-- 11. SALES INVOICE ITEMS
-- ============================================================
CREATE TABLE sales_invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES sales_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(12,2) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. PURCHASES
-- ============================================================
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  purchase_number TEXT NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  warehouse_id UUID REFERENCES warehouses(id),
  purchase_date DATE NOT NULL DEFAULT CURRENT_DATE,
  subtotal DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, purchase_number)
);

-- ============================================================
-- 13. PURCHASE ITEMS
-- ============================================================
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL,
  total_cost DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. CHART OF ACCOUNTS
-- ============================================================
CREATE TABLE chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  account_code TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_name_ar TEXT,
  account_type TEXT NOT NULL
    CHECK (account_type IN ('asset','liability','equity','revenue','expense')),
  parent_id UUID REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, account_code)
);

-- ============================================================
-- 15. JOURNAL ENTRIES
-- ============================================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  entry_number TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  reference_type TEXT,
  reference_id UUID,
  is_posted BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, entry_number)
);

-- ============================================================
-- 16. JOURNAL ENTRY LINES
-- ============================================================
CREATE TABLE journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id),
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. EMPLOYEES
-- ============================================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  employee_code TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  position TEXT,
  department TEXT,
  hire_date DATE,
  base_salary DECIMAL(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXTRA: EXPENSES
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  category TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXTRA: DAMAGE REPORTS
-- ============================================================
CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  warehouse_id UUID REFERENCES warehouses(id),
  quantity DECIMAL(12,2) NOT NULL,
  damage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  estimated_loss DECIMAL(12,2),
  reported_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- EXTRA: AUDIT LOG
-- ============================================================
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID REFERENCES businesses(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role, business_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales'),
    (NEW.raw_user_meta_data->>'business_id')::UUID
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- RLS — Enable on all tables
-- ============================================================
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user's business_id
CREATE OR REPLACE FUNCTION my_business_id()
RETURNS UUID AS $$
  SELECT business_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Helper function: get current user's role
CREATE OR REPLACE FUNCTION my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- RLS Policies (same business = full access)
CREATE POLICY "business_isolation" ON businesses
  FOR ALL USING (id = my_business_id());

CREATE POLICY "business_isolation" ON profiles
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON warehouses
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON categories
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON products
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON stock
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON stock_movements
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON customers
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON suppliers
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON sales_invoices
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON sales_invoice_items
  FOR ALL USING (
    invoice_id IN (
      SELECT id FROM sales_invoices WHERE business_id = my_business_id()
    )
  );

CREATE POLICY "business_isolation" ON purchases
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON purchase_items
  FOR ALL USING (
    purchase_id IN (
      SELECT id FROM purchases WHERE business_id = my_business_id()
    )
  );

CREATE POLICY "business_isolation" ON chart_of_accounts
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON journal_entries
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON journal_entry_lines
  FOR ALL USING (
    journal_entry_id IN (
      SELECT id FROM journal_entries WHERE business_id = my_business_id()
    )
  );

CREATE POLICY "business_isolation" ON employees
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON expenses
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON damage_reports
  FOR ALL USING (business_id = my_business_id());

CREATE POLICY "business_isolation" ON audit_log
  FOR ALL USING (business_id = my_business_id());
