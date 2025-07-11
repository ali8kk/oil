# إعداد قاعدة البيانات على Supabase

## الخطوات المطلوبة

### 1. إنشاء مشروع Supabase جديد

1. اذهب إلى [supabase.com](https://supabase.com)
2. سجل دخول أو أنشئ حساب جديد
3. اضغط على "New Project"
4. اختر اسم للمشروع (مثل: oil-app-database)
5. أدخل كلمة مرور قوية لقاعدة البيانات
6. اختر المنطقة الأقرب لك
7. انتظر حتى يتم إنشاء المشروع

### 2. الحصول على بيانات الاتصال

1. في لوحة تحكم Supabase، اذهب إلى Settings > API
2. انسخ:
   - **Project URL** (مثل: https://your-project.supabase.co)
   - **anon public key** (مفتاح طويل يبدأ بـ eyJ...)

### 3. إعداد متغيرات البيئة

1. أنشئ ملف `.env` في مجلد المشروع الرئيسي
2. أضف المتغيرات التالية:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. تطبيق الهجرة على قاعدة البيانات

#### الطريقة الأولى: باستخدام Supabase CLI (مُوصى بها)

1. ثبت Supabase CLI:
```bash
npm install -g supabase
```

2. سجل دخول إلى Supabase:
```bash
supabase login
```

3. اربط المشروع المحلي بمشروع Supabase:
```bash
cd project
supabase link --project-ref your-project-ref
```
(يمكنك الحصول على project-ref من إعدادات المشروع في لوحة التحكم)

4. طبق الهجرة:
```bash
supabase db push
```

#### الطريقة الثانية: يدوياً من لوحة التحكم

1. اذهب إلى SQL Editor في لوحة تحكم Supabase
2. انسخ محتوى ملف `supabase/migrations/20250101000000_create_database_tables.sql`
3. الصق الكود في محرر SQL واضغط Run

### 5. تثبيت المكتبات المطلوبة

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage
```

### 6. اختبار الاتصال

بعد إكمال الخطوات السابقة، يمكنك اختبار الاتصال بتشغيل التطبيق:

```bash
npx expo start
```

## هيكل قاعدة البيانات

### الجداول المُنشأة:

1. **users** - جدول المستخدمين
   - `id`: معرف فريد (SERIAL)
   - `computer_id`: معرف الحاسوب (فريد)
   - `created_at`: تاريخ الإنشاء
   - `updated_at`: تاريخ التحديث

2. **incentive_slips** - بيانات الحافز
   - `id`: معرف فريد
   - `user_id`: معرف المستخدم (مرتبط بجدول users)
   - `month`: الشهر (MM/YYYY)
   - `basic_salary`: الراتب الأساسي
   - `allowance`: البدلات
   - `bonus`: المكافآت
   - `deductions`: الخصومات
   - `total_incentive`: إجمالي الحافز

3. **salary_slips** - بيانات الراتب
   - نفس هيكل incentive_slips ولكن للرواتب

4. **profits_slips** - بيانات الأرباح
   - `profit_year`: السنة (YYYY)
   - `profit_period`: الفترة (first/second)
   - `basic_profits`: الأرباح الأساسية
   - `additional_profits`: الأرباح الإضافية
   - `deductions`: الخصومات
   - `total_profits`: إجمالي الأرباح

## الميزات المُضمنة:

- **فهارس محسنة** للأداء السريع
- **Triggers تلقائية** لتحديث `updated_at`
- **Row Level Security (RLS)** للحماية
- **Cascade Delete** لحذف البيانات المرتبطة
- **Data Validation** للتحقق من صحة البيانات

## استكشاف الأخطاء

### مشكلة الاتصال:
- تأكد من صحة URL و API Key
- تأكد من أن المشروع نشط في Supabase

### مشكلة الهجرة:
- تأكد من تطبيق الهجرة بنجاح
- تحقق من وجود الجداول في لوحة التحكم

### مشكلة RLS:
- تأكد من تفعيل RLS على جميع الجداول
- تحقق من وجود السياسات المطلوبة

## الدعم

إذا واجهت أي مشاكل، تحقق من:
1. سجلات الأخطاء في Console
2. إعدادات المشروع في Supabase
3. صحة متغيرات البيئة 