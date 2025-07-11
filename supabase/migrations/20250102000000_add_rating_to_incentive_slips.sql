-- إضافة حقل rating إلى جدول incentive_slips
ALTER TABLE incentive_slips ADD COLUMN IF NOT EXISTS rating VARCHAR(50) DEFAULT 'متوسط'; 