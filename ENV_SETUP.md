# إعداد متغيرات البيئة

## إنشاء ملف .env

1. أنشئ ملف `.env` في مجلد المشروع الرئيسي (نفس مستوى package.json)
2. أضف المحتوى التالي:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## كيفية الحصول على القيم

### 1. Project URL
- اذهب إلى Supabase Dashboard
- اختر مشروعك
- اذهب إلى Settings > API
- انسخ "Project URL"

### 2. Anon Key
- في نفس الصفحة (Settings > API)
- انسخ "anon public" key
- يبدأ عادة بـ `eyJ...`

## مثال

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNjQ5NjAwMCwiZXhwIjoxOTUyMDcyMDAwfQ.example-key
```

## ملاحظات مهمة

1. **لا تشارك ملف .env** - أضفه إلى .gitignore
2. **استخدم EXPO_PUBLIC_** كبادئة للمتغيرات التي تحتاجها في التطبيق
3. **أعد تشغيل التطبيق** بعد إضافة ملف .env
4. **تأكد من صحة القيم** قبل تشغيل التطبيق

## اختبار الإعداد

بعد إعداد المتغيرات، يمكنك اختبار الاتصال بتشغيل:

```bash
npx expo start
```

إذا ظهرت أخطاء متعلقة بـ Supabase، تحقق من:
- صحة URL و API Key
- وجود مشروع Supabase نشط
- تطبيق الهجرة بنجاح 