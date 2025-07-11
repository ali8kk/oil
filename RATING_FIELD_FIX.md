# إصلاح مشكلة حقل التقييم في قصاصات الحافز

## المشكلة
كانت هناك مشكلة في استدعاء بيانات التقييم من قاعدة البيانات لقصاصات الحافز. عند استدعاء البيانات، كانت جميع قصاصات الحافز تظهر بتقييم "متوسط" فقط، على الرغم من أن التقييمات المختلفة تم حفظها بشكل صحيح في قاعدة البيانات.

## سبب المشكلة
1. **جدول `incentive_slips` في قاعدة البيانات لم يكن يحتوي على حقل `rating`**
2. **واجهة `IncentiveSlip` في `supabase.ts` لم تكن تحتوي على حقل `rating`**
3. **دالة `loadFromDatabase` كانت تعين قيمة افتراضية `'متوسط'` بدلاً من استدعاء القيمة الفعلية من قاعدة البيانات**

## الحلول المطبقة

### 1. إضافة حقل `rating` إلى جدول `incentive_slips`
```sql
-- في ملف الهجرة الجديد: 20250102000000_add_rating_to_incentive_slips.sql
ALTER TABLE incentive_slips ADD COLUMN IF NOT EXISTS rating VARCHAR(50) DEFAULT 'متوسط';
```

### 2. تحديث واجهة `IncentiveSlip` في `supabase.ts`
```typescript
export interface IncentiveSlip {
  id: number;
  user_id: number;
  month: string; // MM/YYYY
  basic_salary: number;
  allowance: number;
  bonus: number;
  deductions: number;
  total_incentive: number;
  rating: string; // تم إضافة هذا الحقل
  created_at: string;
  updated_at: string;
}
```

### 3. إصلاح دالة `loadFromDatabase` في `UserDataContext.tsx`
```typescript
// قبل الإصلاح
rating: 'متوسط' // القيمة الافتراضية

// بعد الإصلاح
rating: slip.rating || 'متوسط'
```

### 4. التأكد من أن جميع دوال الحفظ والتحديث تستخدم حقل `rating`
تم التحقق من أن جميع الدوال التالية تستخدم حقل `rating` بشكل صحيح:
- `addIncentiveSlip`
- `updateIncentiveSlip`
- `saveToDatabase`
- `syncPendingLocalData`
- `handleDatabaseError`

## النتيجة
بعد تطبيق هذه الإصلاحات، سيتم استدعاء قيم التقييم الفعلية من قاعدة البيانات بدلاً من تعيين قيمة افتراضية "متوسط" لجميع القصاصات.

## ملاحظات مهمة
- تم إضافة حقل `rating` مع قيمة افتراضية `'متوسط'` لضمان التوافق مع البيانات الموجودة
- جميع دوال الحفظ والتحديث تدعم حقل `rating` بشكل صحيح
- القصاصات الجديدة ستستخدم القيمة المدخلة من المستخدم، والقصاصات القديمة ستستخدم القيمة المحفوظة في قاعدة البيانات

## اختبار الإصلاح
1. قم بتشغيل التطبيق
2. أضف قصاصة حافز جديدة مع تقييم مختلف عن "متوسط"
3. احفظ القصاصة
4. أعد تشغيل التطبيق
5. تحقق من أن التقييم يظهر بشكل صحيح في القصاصة 