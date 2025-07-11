-- إضافة حقل bonus إلى جدول salary_slips
ALTER TABLE salary_slips ADD COLUMN IF NOT EXISTS bonus DECIMAL(15,2) DEFAULT 0; 