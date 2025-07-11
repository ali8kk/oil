# نشر تطبيق Oil Salary على Netlify

## الخطوات:

### 1. رفع الكود إلى GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/username/oil-salary-app.git
git push -u origin main
```

### 2. النشر على Netlify

1. اذهب إلى [netlify.com](https://netlify.com)
2. سجل دخولك أو أنشئ حساب جديد
3. اضغط على "New site from Git"
4. اختر GitHub
5. اختر repository الخاص بك
6. في إعدادات البناء:
   - **Build command:** `npm run build:web`
   - **Publish directory:** `dist`
7. اضغط "Deploy site"

### 3. إعداد متغيرات البيئة (اختياري)

إذا كنت تريد استخدام Supabase:
1. في لوحة تحكم Netlify، اذهب إلى Site settings > Environment variables
2. أضف:
   - `EXPO_PUBLIC_SUPABASE_URL` = رابط Supabase الخاص بك
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY` = المفتاح العام لـ Supabase

### 4. النطاق المخصص (اختياري)

يمكنك إضافة نطاق مخصص من إعدادات الموقع في Netlify.

## المميزات:

✅ **يعمل على جميع الأجهزة** - هاتف، تابلت، كمبيوتر  
✅ **تحديث فوري** - أي تغيير في الكود يظهر مباشرة  
✅ **لا حاجة لبناء APK** - تجنب مشاكل Android  
✅ **سهولة النشر** - رفع الكود فقط  
✅ **مجاني** - Netlify يوفر خطة مجانية ممتازة  

## الرابط:

بعد النشر، ستحصل على رابط مثل:
`https://your-app-name.netlify.app` 