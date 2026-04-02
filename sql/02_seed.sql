-- NEXUS ERP v2 — Seed Data
-- Run AFTER 01_schema.sql

INSERT INTO businesses (id, name, name_ar, currency)
VALUES ('a1b2c3d4-0000-0000-0000-000000000001','Touch Home Gallery','تاتش هوم جاليري','EGP')
ON CONFLICT (id) DO NOTHING;

-- Warehouses
INSERT INTO warehouses (business_id, name, name_ar, location) VALUES
('a1b2c3d4-0000-0000-0000-000000000001','Main Warehouse','المستودع الرئيسي','Cairo'),
('a1b2c3d4-0000-0000-0000-000000000001','China Warehouse','مستودع الصين','Container Import'),
('a1b2c3d4-0000-0000-0000-000000000001','Shop Display','العرض بالمحل','Cairo Store')
ON CONFLICT DO NOTHING;

-- Categories (30 categories)
INSERT INTO categories (business_id, name, name_ar) VALUES
('a1b2c3d4-0000-0000-0000-000000000001','Ramadan Collection','كوليكشن رمضان'),
('a1b2c3d4-0000-0000-0000-000000000001','Artificial Trees','أشجار صناعية'),
('a1b2c3d4-0000-0000-0000-000000000001','Artificial Flowers','زهور صناعية'),
('a1b2c3d4-0000-0000-0000-000000000001','Artificial Plants','نباتات صناعية'),
('a1b2c3d4-0000-0000-0000-000000000001','Mini Artificial Plants & Flowers','نباتات وزهور صناعية صغيرة'),
('a1b2c3d4-0000-0000-0000-000000000001','Planter Holders','حوامل نباتات'),
('a1b2c3d4-0000-0000-0000-000000000001','Pots','أصص'),
('a1b2c3d4-0000-0000-0000-000000000001','Antiques','تحف'),
('a1b2c3d4-0000-0000-0000-000000000001','Wall Decor','ديكور حوائط'),
('a1b2c3d4-0000-0000-0000-000000000001','Mirrors','مرايا'),
('a1b2c3d4-0000-0000-0000-000000000001','Clocks','ساعات'),
('a1b2c3d4-0000-0000-0000-000000000001','Vases','فازات'),
('a1b2c3d4-0000-0000-0000-000000000001','Floor Vases','فازات أرضية'),
('a1b2c3d4-0000-0000-0000-000000000001','Tables & Consoles','ترابيزات وكونسولات'),
('a1b2c3d4-0000-0000-0000-000000000001','Lighting Units','إضاءة'),
('a1b2c3d4-0000-0000-0000-000000000001','Candle Holders','حاملات شموع'),
('a1b2c3d4-0000-0000-0000-000000000001','Tissue Box Holders','حاملات مناديل'),
('a1b2c3d4-0000-0000-0000-000000000001','Ashtrays','طفايات سجائر'),
('a1b2c3d4-0000-0000-0000-000000000001','Bonbonnieres','بونبونيير'),
('a1b2c3d4-0000-0000-0000-000000000001','Trays & Fruit Plates','صواني وأطباق فاكهة'),
('a1b2c3d4-0000-0000-0000-000000000001','Candles','شموع'),
('a1b2c3d4-0000-0000-0000-000000000001','Magazines','مجلات'),
('a1b2c3d4-0000-0000-0000-000000000001','Decorative Books','كتب ديكور'),
('a1b2c3d4-0000-0000-0000-000000000001','Bathroom Sets','طقم حمام'),
('a1b2c3d4-0000-0000-0000-000000000001','Picture Frames','براويز'),
('a1b2c3d4-0000-0000-0000-000000000001','Organizer Boxes','صناديق تنظيم'),
('a1b2c3d4-0000-0000-0000-000000000001','Calendars','تقويمات'),
('a1b2c3d4-0000-0000-0000-000000000001','Table Mat','مفارش طاولة'),
('a1b2c3d4-0000-0000-0000-000000000001','Incense Burners','مباخر'),
('a1b2c3d4-0000-0000-0000-000000000001','Islamic Antiques','تحف إسلامية')
ON CONFLICT DO NOTHING;

-- Chart of Accounts
INSERT INTO chart_of_accounts (business_id, account_code, account_name, account_name_ar, account_type) VALUES
('a1b2c3d4-0000-0000-0000-000000000001','10','Cash & Bank','النقدية والبنوك','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','1010','Cash on Hand','الصندوق','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','1020','Bank Account','الحساب البنكي','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','12','Accounts Receivable','العملاء - مدينون','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','30','Inventory','المخزون','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','22','Fixed Assets','الأصول الثابتة','asset'),
('a1b2c3d4-0000-0000-0000-000000000001','40','Accounts Payable','الموردون - دائنون','liability'),
('a1b2c3d4-0000-0000-0000-000000000001','401','Supplier Payables','ذمم الموردين','liability'),
('a1b2c3d4-0000-0000-0000-000000000001','50','Owner Equity','حقوق الملكية','equity'),
('a1b2c3d4-0000-0000-0000-000000000001','501','Capital','رأس المال','equity'),
('a1b2c3d4-0000-0000-0000-000000000001','502','Retained Earnings','الأرباح المحتجزة','equity'),
('a1b2c3d4-0000-0000-0000-000000000001','70','Sales Revenue','إيرادات المبيعات','revenue'),
('a1b2c3d4-0000-0000-0000-000000000001','7010','Product Sales','مبيعات المنتجات','revenue'),
('a1b2c3d4-0000-0000-0000-000000000001','7020','Other Revenue','إيرادات أخرى','revenue'),
('a1b2c3d4-0000-0000-0000-000000000001','60','Cost of Goods Sold','تكلفة البضاعة المباعة','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','61','Operating Expenses','مصروفات التشغيل','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6110','Salaries','الرواتب','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6120','Rent','الإيجار','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6130','Utilities','المرافق','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6140','Shipping & Logistics','الشحن والخدمات اللوجستية','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6150','Marketing','التسويق','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6160','Damage & Loss','خسائر التلف','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6170','Miscellaneous','مصروفات متنوعة','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6180','Import Costs','تكاليف الاستيراد','expense'),
('a1b2c3d4-0000-0000-0000-000000000001','6190','Bank Charges','مصاريف بنكية','expense')
ON CONFLICT (business_id, account_code) DO NOTHING;

-- ============================================================
-- بعد ما تشغّل الـ seed، روح Authentication → Users
-- انسخ الـ UUID بتاعك وشغّل:
--
-- UPDATE profiles
-- SET business_id = 'a1b2c3d4-0000-0000-0000-000000000001',
--     full_name   = 'إبراهيم عفيفي',
--     role        = 'owner'
-- WHERE id = 'YOUR-UUID-HERE';
-- ============================================================
