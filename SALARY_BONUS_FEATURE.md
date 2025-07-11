# إضافة حقل المكافأة إلى قصاصات الراتب

## الميزة الجديدة

تم إضافة حقل "المكافأة" إلى قصاصات الراتب، بحيث يمكن إدخال مكافآت إضافية مع كل قصاصة راتب. هذه المكافآت يتم تجميعها مع مكافآت السنة المالية في القائمة الرئيسية وحسابها ضمن الإحصائيات.

## التغييرات المطبقة

### 1. قاعدة البيانات

#### إضافة حقل `bonus_amount` إلى جدول `salary_slips`
```sql
-- ملف الهجرة الجديد: 20250103000000_add_bonus_to_salary_slips.sql
ALTER TABLE salary_slips ADD COLUMN IF NOT EXISTS bonus DECIMAL(15,2) DEFAULT 0;
```

#### تحديث واجهة `SalarySlip` في `supabase.ts`
```typescript
export interface SalarySlip {
  id: number;
  user_id: number;
  month: string; // MM/YYYY
  basic_salary: number;
  allowance: number;
  bonus: number;
  deductions: number;
  total_salary: number;
  bonus_amount: number; // حقل المكافأة الجديد
  created_at: string;
  updated_at: string;
}
```

### 2. واجهة المستخدم

#### تحديث واجهة `SalaryData` في `SalaryModal.tsx`
```typescript
export interface SalaryData {
  totalSalary: string;
  bonus: string; // حقل المكافأة الجديد
  month: string;
  id?: number;
}
```

#### إضافة حقل المكافأة إلى نموذج إدخال قصاصة الراتب
- تم إضافة حقل "المكافأة (بالدينار)" بعد حقل "الراتب الكلي"
- يتم تنسيق الأرقام تلقائياً (إضافة فواصل)
- الحقل اختياري (يمكن تركه فارغاً)

### 3. منطق التطبيق

#### تحديث دوال حفظ وتحديث قصاصات الراتب
تم تحديث جميع دوال `addSalarySlip`، `updateSalarySlip`، `deleteSalarySlip` لتشمل حقل `bonus_amount`:

```typescript
// مثال على حفظ قصاصة راتب
const savedSlip = await databaseService.saveSalarySlip({
  user_id: Number(currentUserId),
  month: slip.month,
  basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
  allowance: 0,
  bonus: 0,
  deductions: 0,
  total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
  bonus_amount: parseFloat(slip.bonus?.replace(/,/g, '') || '0') // حقل المكافأة الجديد
});
```

#### تحديث دالة `updateMainDataFromSlip`
تم تحديث الدالة لتشمل حساب المكافآت من قصاصات الراتب:

```typescript
// تحديث المكافآت من قصاصات الراتب
const currentRewards = parseFloat(userData.totalRewards?.replace(/,/g, '') || '0');
const slipBonus = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
const newRewards = operation === 'add' ? currentRewards + slipBonus : currentRewards - slipBonus;

// تحديث المكافآت
setUserData(prev => ({
  ...prev,
  totalRewards: formatNumber(Math.max(0, newRewards))
}));
```

### 4. الإحصائيات

#### تحديث مخطط المكافآت السنوية
تم تحديث دالة `getYearlyRewardsChartData` لتشمل المكافآت من قصاصات الراتب:

```typescript
// إضافة المكافآت من قصاصات الراتب
salarySlips.forEach(slip => {
  const [month, year] = slip.month.split('/');
  const bonus = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
  const slipYear = parseInt(year);
  
  if (!yearlyData[slipYear]) {
    yearlyData[slipYear] = 0;
  }
  yearlyData[slipYear] += bonus;
});
```

#### تحديث مخطط المكافآت الشهرية
تم تحديث دالة `getMonthlyRewardsChartData` لتشمل المكافآت من قصاصات الراتب أيضاً.

## كيفية الاستخدام

1. **إضافة قصاصة راتب جديدة**:
   - أدخل الراتب الكلي
   - أدخل المكافأة (اختياري)
   - اختر الشهر والسنة
   - احفظ القصاصة

2. **تعديل قصاصة راتب موجودة**:
   - يمكن تعديل المكافأة مع باقي البيانات
   - يتم تحديث المكافآت الإجمالية تلقائياً

3. **حذف قصاصة راتب**:
   - يتم خصم المكافأة من إجمالي المكافآت تلقائياً

## المزامنة مع قاعدة البيانات

- يتم حفظ حقل المكافأة في قاعدة البيانات مع كل قصاصة راتب
- يتم استدعاء المكافآت من قاعدة البيانات عند تحميل البيانات
- يتم تحديث المكافآت في قاعدة البيانات عند التعديل

## الإحصائيات والمخططات

- **مخطط المكافآت السنوية**: يعرض إجمالي المكافآت من قصاصات الحوافز والرواتب حسب السنة
- **مخطط المكافآت الشهرية**: يعرض إجمالي المكافآت من قصاصات الحوافز والرواتب حسب الشهر
- **القائمة الرئيسية**: تعرض إجمالي المكافآت من جميع المصادر

## ملاحظات مهمة

1. **التوافق مع البيانات الموجودة**: القصاصات الموجودة ستحتوي على قيمة 0 للمكافأة
2. **التحديث التلقائي**: يتم تحديث إجمالي المكافآت تلقائياً عند إضافة/تعديل/حذف قصاصات الراتب
3. **المزامنة**: يتم مزامنة المكافآت مع قاعدة البيانات مثل باقي البيانات
4. **الإحصائيات**: يتم حساب المكافآت من قصاصات الراتب في جميع الإحصائيات والمخططات 