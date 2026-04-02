# Nexus ERP — Touch Home Gallery

نظام ERP متكامل مبني على Vite + React + Supabase

---

## خطوات الإعداد (مرة واحدة فقط)

### 1. إعداد Supabase

**أ. شغّل الـ Schema:**
- روح `supabase.com` ← مشروعك ← `SQL Editor`
- انسخ محتوى ملف `sql/01_schema.sql` والصقه واضغط Run

**ب. شغّل الـ Seed:**
- انسخ محتوى ملف `sql/02_seed.sql` والصقه واضغط Run

**ج. أنشئ حساب المالك:**
- روح `Authentication` ← `Users` ← `Add User`
- أدخل الإيميل وكلمة المرور
- بعد ما تنشئه، انسخ الـ UUID بتاعه
- روح `SQL Editor` وشغّل:

```sql
UPDATE profiles
SET
  business_id = 'a1b2c3d4-0000-0000-0000-000000000001',
  full_name = 'إبراهيم عفيفي',
  role = 'owner'
WHERE id = 'الـ UUID اللي نسخته';
```

---

### 2. إعداد Vercel

في مشروع Vercel ← `Settings` ← `Environment Variables`, أضف:

```
VITE_SUPABASE_URL = https://lweuqsaxnxlacggcfpml.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 3. رفع على GitHub

```bash
git add .
git commit -m "Initial Nexus ERP setup"
git push
```

Vercel هيعمل deploy تلقائي.

---

## هيكل المشروع

```
src/
├── lib/supabase.ts        ← Supabase client
├── contexts/AuthContext   ← Auth state
├── components/
│   ├── Layout.tsx         ← Sidebar + header
│   └── ProtectedRoute.tsx ← Route guard
└── pages/
    ├── Login.tsx          ← صفحة الدخول
    ├── Dashboard.tsx      ← الرئيسية بـ KPIs حقيقية
    └── Placeholders.tsx   ← باقي الصفحات (قيد التطوير)
```

---

## المراحل القادمة

- **المرحلة 2:** إدارة المخزون (CRUD كامل)
- **المرحلة 3:** نقطة البيع (POS)
- **المرحلة 4:** المحاسبة + الموارد البشرية
- **المرحلة 5:** التقارير + الاستيراد
