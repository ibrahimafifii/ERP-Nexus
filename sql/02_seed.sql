-- ============================================================
-- NEXUS ERP — Seed Data
-- Touch Home Gallery
-- Run AFTER 01_schema.sql
-- ============================================================

-- Step 1: Insert the business
INSERT INTO businesses (id, name, name_ar, currency)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Touch Home Gallery',
  'تاتش هوم جاليري',
  'EGP'
);

-- Step 2: Insert warehouses
INSERT INTO warehouses (business_id, name, name_ar, location) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Main Warehouse', 'المستودع الرئيسي', 'Cairo'),
('a1b2c3d4-0000-0000-0000-000000000001', 'China Warehouse', 'مستودع الصين', 'Container Import'),
('a1b2c3d4-0000-0000-0000-000000000001', 'Shop Display', 'العرض بالمحل', 'Cairo Store');

-- Step 3: Insert categories
INSERT INTO categories (business_id, name, name_ar) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', 'Bedroom', 'غرف النوم'),
('a1b2c3d4-0000-0000-0000-000000000001', 'Living Room', 'الصالة'),
('a1b2c3d4-0000-0000-0000-000000000001', 'Kitchen', 'المطبخ'),
('a1b2c3d4-0000-0000-0000-000000000001', 'Bathroom', 'الحمام'),
('a1b2c3d4-0000-0000-0000-000000000001', 'Accessories', 'الإكسسوارات');

-- Step 4: Chart of Accounts (French standard)
INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_name_ar, account_type) VALUES
('a1b2c3d4-0000-0000-0000-000000000001', '10', 'Cash & Bank', 'النقدية والبنوك', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '1010', 'Cash on Hand', 'الصندوق', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '1020', 'Bank Account', 'الحساب البنكي', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '12', 'Accounts Receivable', 'العملاء - مدينون', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '30', 'Inventory', 'المخزون', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '22', 'Fixed Assets', 'الأصول الثابتة', 'asset'),
('a1b2c3d4-0000-0000-0000-000000000001', '40', 'Accounts Payable', 'الموردون - دائنون', 'liability'),
('a1b2c3d4-0000-0000-0000-000000000001', '401', 'Supplier Payables', 'ذمم الموردين', 'liability'),
('a1b2c3d4-0000-0000-0000-000000000001', '50', 'Owner Equity', 'حقوق الملكية', 'equity'),
('a1b2c3d4-0000-0000-0000-000000000001', '501', 'Capital', 'رأس المال', 'equity'),
('a1b2c3d4-0000-0000-0000-000000000001', '502', 'Retained Earnings', 'الأرباح المحتجزة', 'equity'),
('a1b2c3d4-0000-0000-0000-000000000001', '70', 'Sales Revenue', 'إيرادات المبيعات', 'revenue'),
('a1b2c3d4-0000-0000-0000-000000000001', '7010', 'Product Sales', 'مبيعات المنتجات', 'revenue'),
('a1b2c3d4-0000-0000-0000-000000000001', '7020', 'Other Revenue', 'إيرادات أخرى', 'revenue'),
('a1b2c3d4-0000-0000-0000-000000000001', '60', 'Cost of Goods Sold', 'تكلفة البضاعة المباعة', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '61', 'Operating Expenses', 'مصروفات التشغيل', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6110', 'Salaries', 'الرواتب', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6120', 'Rent', 'الإيجار', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6130', 'Utilities', 'المرافق', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6140', 'Shipping & Logistics', 'الشحن والخدمات اللوجستية', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6150', 'Marketing', 'التسويق', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6160', 'Damage & Loss', 'خسائر التلف', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6170', 'Miscellaneous', 'مصروفات متنوعة', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6180', 'Import Costs', 'تكاليف الاستيراد', 'expense'),
('a1b2c3d4-0000-0000-0000-000000000001', '6190', 'Bank Charges', 'مصاريف بنكية', 'expense');

-- ============================================================
-- IMPORTANT: After running this seed, create your owner account:
-- Go to Supabase → Authentication → Users → Add User
-- Email: your email
-- Password: your password
-- Then run this UPDATE (replace USER_ID with the ID from Supabase Auth):
--
-- UPDATE profiles
-- SET
--   business_id = 'a1b2c3d4-0000-0000-0000-000000000001',
--   full_name = 'إبراهيم عفيفي',
--   role = 'owner'
-- WHERE id = 'USER_ID_FROM_SUPABASE_AUTH';
-- ============================================================
