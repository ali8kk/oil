# تغيير ID المستخدمين إلى أرقام تسلسلية

## نظرة عامة

هذا الملف يوضح كيفية تغيير ID المستخدمين في قاعدة البيانات من UUID إلى أرقام تسلسلية بسيطة (1, 2, 3, ...).

## الملفات المطلوبة

### 1. ملف الهجرة الجديد
- `project/supabase/migrations/20250706000000_serial_user_ids.sql`

## كيفية تطبيق الهجرة

### الطريقة الأولى: عبر Supabase CLI

```bash
# الانتقال إلى مجلد المشروع
cd project

# تطبيق الهجرة
npx supabase db push

# أو إذا كنت تستخدم Supabase CLI مباشرة
supabase db push
```

### الطريقة الثانية: عبر Supabase Dashboard

1. افتح [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. اذهب إلى **SQL Editor**
4. انسخ محتوى ملف الهجرة `20250706000000_serial_user_ids.sql`
5. الصق الكود واضغط **Run**

## ما يحدث أثناء الهجرة

### 1. إنشاء جداول مؤقتة
- `users_new` مع `id SERIAL PRIMARY KEY`
- `incentive_slips_new` مع `user_id integer`
- `salary_slips_new` مع `user_id integer`
- `profits_slips_new` مع `user_id integer`

### 2. نسخ البيانات
- نسخ جميع بيانات المستخدمين من الجدول القديم إلى الجديد
- نسخ جميع القصاصات مع تحديث `user_id` ليربط بالمستخدمين الجدد

### 3. حذف الجداول القديمة
- حذف الجداول القديمة التي تستخدم UUID

### 4. إعادة تسمية الجداول
- إعادة تسمية الجداول الجديدة لتحل محل القديمة

### 5. إعادة إنشاء العلاقات
- إضافة Foreign Keys
- إعادة إنشاء الفهارس
- إعادة تفعيل Row Level Security
- إعادة إنشاء Triggers و Policies

## النتيجة النهائية

بعد تطبيق الهجرة:

### جدول المستخدمين
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,  -- 1, 2, 3, ...
  computer_id text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  -- ... باقي الأعمدة
);
```

### جداول القصاصات
```sql
CREATE TABLE incentive_slips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer NOT NULL REFERENCES users(id),  -- ربط برقم تسلسلي
  -- ... باقي الأعمدة
);
```

## التحقق من النتيجة

بعد تطبيق الهجرة، يمكنك التحقق من النتيجة:

```sql
-- عرض المستخدمين مع ID الجديد
SELECT id, computer_id, name FROM users ORDER BY id;

-- عرض القصاصات مع ربط المستخدمين
SELECT 
  is.id,
  is.user_id,
  u.computer_id,
  is.month,
  is.total_incentive
FROM incentive_slips is
JOIN users u ON is.user_id = u.id
ORDER BY is.user_id, is.created_at;
```

## ملاحظات مهمة

1. **النسخ الاحتياطي**: تأكد من عمل نسخة احتياطية من قاعدة البيانات قبل تطبيق الهجرة
2. **وقت التطبيق**: قد يستغرق التطبيق وقتاً طويلاً إذا كان لديك بيانات كثيرة
3. **التطبيق**: الكود الحالي في التطبيق سيعمل بدون تغيير لأن `userId` يتم التعامل معه كـ `string`

## استرجاع البيانات (إذا لزم الأمر)

إذا أردت العودة إلى UUID، يمكنك إنشاء هجرة عكسية:

```sql
-- إنشاء جدول مؤقت مع UUID
CREATE TABLE users_uuid AS 
SELECT gen_random_uuid() as id, * FROM users;

-- حذف الجدول الحالي وإعادة تسمية الجدول المؤقت
DROP TABLE users;
ALTER TABLE users_uuid RENAME TO users;
```

## الفوائد

1. **سهولة القراءة**: الأرقام التسلسلية أسهل في القراءة والفهم
2. **أداء أفضل**: الأرقام الصحيحة أسرع في البحث والمقارنة
3. **توفير المساحة**: الأرقام الصحيحة تأخذ مساحة أقل من UUID
4. **سهولة التتبع**: يمكن تتبع ترتيب إنشاء الحسابات بسهولة 