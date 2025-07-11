# إعداد قاعدة البيانات على Supabase - دليل شامل

## ✅ ما تم إنجازه

تم إنشاء جميع الملفات المطلوبة لقاعدة البيانات:

### 📁 الملفات المُنشأة:

1. **`lib/supabase.ts`** - إعداد Supabase والدوال الأساسية
2. **`supabase/migrations/20250101000000_create_database_tables.sql`** - هجرة قاعدة البيانات
3. **`supabase/config.toml`** - إعداد Supabase CLI
4. **`README_DATABASE_SETUP.md`** - دليل إعداد قاعدة البيانات
5. **`ENV_SETUP.md`** - دليل إعداد متغيرات البيئة

## 🚀 الخطوات التالية

### 1. إنشاء مشروع Supabase

1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ مشروع جديد
3. احصل على Project URL و API Key

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env` في مجلد المشروع وأضف:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. تطبيق الهجرة

#### باستخدام Supabase CLI:
```bash
npm install -g supabase
supabase login
supabase link --project-ref your-project-ref
supabase db push
```

#### أو يدوياً من لوحة التحكم:
- اذهب إلى SQL Editor في Supabase
- انسخ محتوى ملف الهجرة وطبقه

### 4. اختبار الاتصال

```bash
npx expo start
```

## 📊 هيكل قاعدة البيانات

### الجداول:
- **users** - المستخدمين
- **incentive_slips** - بيانات الحافز
- **salary_slips** - بيانات الراتب  
- **profits_slips** - بيانات الأرباح

### الميزات:
- ✅ معرفات تسلسلية (SERIAL)
- ✅ فهارس محسنة للأداء
- ✅ Triggers تلقائية
- ✅ Row Level Security
- ✅ Cascade Delete
- ✅ Data Validation

## 🔧 الدوال المتاحة

### إدارة المستخدمين:
- `checkUserExists()` - التحقق من وجود المستخدم
- `createUser()` - إنشاء مستخدم جديد
- `linkToExistingAccount()` - ربط بحساب موجود
- `deleteUserData()` - حذف بيانات المستخدم

### إدارة البيانات:
- `saveIncentiveSlip()` - حفظ بيانات الحافز
- `saveSalarySlip()` - حفظ بيانات الراتب
- `saveProfitsSlip()` - حفظ بيانات الأرباح
- `getIncentiveSlips()` - استرجاع بيانات الحافز
- `getSalarySlips()` - استرجاع بيانات الراتب
- `getProfitsSlips()` - استرجاع بيانات الأرباح

## 📝 ملاحظات مهمة

1. **المكتبات موجودة** - `@supabase/supabase-js` مثبتة بالفعل
2. **التوافق** - جميع الأنواع متوافقة مع التطبيق الحالي
3. **الأمان** - RLS مفعل على جميع الجداول
4. **الأداء** - فهارس محسنة للاستعلامات السريعة

## 🆘 استكشاف الأخطاء

### مشكلة الاتصال:
- تحقق من صحة URL و API Key
- تأكد من أن المشروع نشط

### مشكلة الهجرة:
- تأكد من تطبيق الهجرة بنجاح
- تحقق من وجود الجداول في لوحة التحكم

### مشكلة RLS:
- تأكد من تفعيل RLS على جميع الجداول
- تحقق من وجود السياسات المطلوبة

## 📚 الملفات المرجعية

- `README_DATABASE_SETUP.md` - دليل مفصل لإعداد قاعدة البيانات
- `ENV_SETUP.md` - دليل إعداد متغيرات البيئة
- `lib/supabase.ts` - الكود والأنواع
- `supabase/migrations/20250101000000_create_database_tables.sql` - هجرة قاعدة البيانات

---

**🎉 تم إعداد قاعدة البيانات بالكامل! جاهزة للاستخدام.** 