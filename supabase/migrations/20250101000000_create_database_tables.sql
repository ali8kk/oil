-- إنشاء جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  computer_id VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول بيانات الحافز
CREATE TABLE IF NOT EXISTS incentive_slips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- MM/YYYY
  basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  bonus DECIMAL(15,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_incentive DECIMAL(15,2) NOT NULL DEFAULT 0,
  rating VARCHAR(50) DEFAULT 'متوسط',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول بيانات الراتب
CREATE TABLE IF NOT EXISTS salary_slips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month VARCHAR(7) NOT NULL, -- MM/YYYY
  basic_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  allowance DECIMAL(15,2) NOT NULL DEFAULT 0,
  bonus DECIMAL(15,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_salary DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء جدول بيانات الأرباح
CREATE TABLE IF NOT EXISTS profits_slips (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  profit_year VARCHAR(4) NOT NULL, -- YYYY
  profit_period VARCHAR(10) NOT NULL CHECK (profit_period IN ('first', 'second')),
  basic_profits DECIMAL(15,2) NOT NULL DEFAULT 0,
  additional_profits DECIMAL(15,2) NOT NULL DEFAULT 0,
  deductions DECIMAL(15,2) NOT NULL DEFAULT 0,
  total_profits DECIMAL(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- إنشاء فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_users_computer_id ON users(computer_id);
CREATE INDEX IF NOT EXISTS idx_incentive_slips_user_id ON incentive_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_incentive_slips_month ON incentive_slips(month);
CREATE INDEX IF NOT EXISTS idx_salary_slips_user_id ON salary_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_salary_slips_month ON salary_slips(month);
CREATE INDEX IF NOT EXISTS idx_profits_slips_user_id ON profits_slips(user_id);
CREATE INDEX IF NOT EXISTS idx_profits_slips_year ON profits_slips(profit_year);

-- إنشاء دالة لتحديث updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- إنشاء triggers لتحديث updated_at تلقائياً
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incentive_slips_updated_at BEFORE UPDATE ON incentive_slips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salary_slips_updated_at BEFORE UPDATE ON salary_slips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profits_slips_updated_at BEFORE UPDATE ON profits_slips
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- إعداد RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incentive_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE salary_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE profits_slips ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمستخدمين
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own data" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their own data" ON users
  FOR DELETE USING (true);

-- سياسات الأمان لبيانات الحافز
CREATE POLICY "Users can view their incentive slips" ON incentive_slips
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their incentive slips" ON incentive_slips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their incentive slips" ON incentive_slips
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their incentive slips" ON incentive_slips
  FOR DELETE USING (true);

-- سياسات الأمان لبيانات الراتب
CREATE POLICY "Users can view their salary slips" ON salary_slips
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their salary slips" ON salary_slips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their salary slips" ON salary_slips
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their salary slips" ON salary_slips
  FOR DELETE USING (true);

-- سياسات الأمان لبيانات الأرباح
CREATE POLICY "Users can view their profits slips" ON profits_slips
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their profits slips" ON profits_slips
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their profits slips" ON profits_slips
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their profits slips" ON profits_slips
  FOR DELETE USING (true); 