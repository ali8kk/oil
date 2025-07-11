import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// أنواع البيانات
export interface User {
  id: number;
  computer_id: string;
  password_hash: string;
  name: string;
  vacation_balance: string;
  sick_leave_balance: string;
  next_promotion_date: string;
  next_allowance_date: string;
  total_rewards: string;
  start_date: string;
  total_incentive: string;
  total_salary: string;
  total_profits: string;
  last_rewards_reset_date: string;
  regular_leave_bonus: string;
  sick_leave_bonus: string;
  grade: string;
  stage: string;
  courses_names: string[];
  courses_completed: boolean[];
  created_at: string;
  updated_at: string;
}

export interface IncentiveSlip {
  id: number;
  user_id: number;
  month: string; // MM/YYYY
  basic_salary: number;
  allowance: number;
  bonus: number;
  deductions: number;
  total_incentive: number;
  rating: string;
  created_at: string;
  updated_at: string;
}

export interface SalarySlip {
  id: number;
  user_id: number;
  month: string; // MM/YYYY
  basic_salary: number;
  allowance: number;
  bonus: number; // حقل المكافأة (يستخدم الحقل الموجود في قاعدة البيانات)
  deductions: number;
  total_salary: number;
  created_at: string;
  updated_at: string;
}

export interface ProfitsSlip {
  id: number;
  user_id: number;
  profit_year: string; // YYYY
  profit_period: string; // "first" or "second"
  basic_profits: number;
  additional_profits: number;
  deductions: number;
  total_profits: number;
  rating: string;
  created_at: string;
  updated_at: string;
}

// إعداد Supabase
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// دوال قاعدة البيانات
export const databaseService = {
  // التحقق من وجود المستخدم
  async checkUserExists(computerId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('computer_id', computerId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking user:', error);
      return null;
    }
    
    return data;
  },

  // إنشاء مستخدم جديد
  async createUser(computerId: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        computer_id: computerId,
        password_hash: '',
        name: '',
        vacation_balance: '',
        sick_leave_balance: '',
        next_promotion_date: '',
        next_allowance_date: '',
        total_rewards: '',
        start_date: '',
        total_incentive: '',
        total_salary: '',
        total_profits: '',
        last_rewards_reset_date: '',
        regular_leave_bonus: '3',
        sick_leave_bonus: '3',
        grade: '10',
        stage: '1',
        courses_names: ['سلامة', 'حاسوب', 'اختصاص', 'إدارية'],
        courses_completed: [false, false, false, false]
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user:', error);
      return null;
    }
    
    return data;
  },

  // ربط التطبيق بحساب موجود
  async linkToExistingAccount(computerId: string): Promise<User | null> {
    const user = await this.checkUserExists(computerId);
    if (user) {
      return user;
    }
    return null;
  },

  // حفظ بيانات الحافز
  async saveIncentiveSlip(slip: Omit<IncentiveSlip, 'id' | 'created_at' | 'updated_at'> & { rating?: string }): Promise<IncentiveSlip | null> {
    const { data, error } = await supabase
      .from('incentive_slips')
      .insert([{ ...slip }])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving incentive slip:', error);
      return null;
    }
    
    return data;
  },

  // حفظ بيانات الراتب
  async saveSalarySlip(slip: Omit<SalarySlip, 'id' | 'created_at' | 'updated_at'>): Promise<SalarySlip | null> {
    const { data, error } = await supabase
      .from('salary_slips')
      .insert([slip])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving salary slip:', error);
      return null;
    }
    
    return data;
  },

  // حفظ بيانات الأرباح
  async saveProfitsSlip(slip: Omit<ProfitsSlip, 'id' | 'created_at' | 'updated_at'>): Promise<ProfitsSlip | null> {
    const { data, error } = await supabase
      .from('profits_slips')
      .insert([slip])
      .select()
      .single();
    
    if (error) {
      console.error('Error saving profits slip:', error);
      return null;
    }
    
    return data;
  },

  // استرجاع بيانات الحافز
  async getIncentiveSlips(userId: string): Promise<IncentiveSlip[]> {
    const { data, error } = await supabase
      .from('incentive_slips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching incentive slips:', error);
      return [];
    }
    
    return data || [];
  },

  // استرجاع بيانات الراتب
  async getSalarySlips(userId: string): Promise<SalarySlip[]> {
    const { data, error } = await supabase
      .from('salary_slips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching salary slips:', error);
      return [];
    }
    
    return data || [];
  },

  // استرجاع بيانات الأرباح
  async getProfitsSlips(userId: string): Promise<ProfitsSlip[]> {
    const { data, error } = await supabase
      .from('profits_slips')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching profits slips:', error);
      return [];
    }
    
    return data || [];
  },

  // حذف بيانات المستخدم
  async deleteUserData(userId: number): Promise<boolean> {
    // حذف بيانات الحافز
    const { error: incentiveError } = await supabase
      .from('incentive_slips')
      .delete()
      .eq('user_id', userId);
    
    if (incentiveError) {
      console.error('Error deleting incentive slips:', incentiveError);
    }

    // حذف بيانات الراتب
    const { error: salaryError } = await supabase
      .from('salary_slips')
      .delete()
      .eq('user_id', userId);
    
    if (salaryError) {
      console.error('Error deleting salary slips:', salaryError);
    }

    // حذف بيانات الأرباح
    const { error: profitsError } = await supabase
      .from('profits_slips')
      .delete()
      .eq('user_id', userId);
    
    if (profitsError) {
      console.error('Error deleting profits slips:', profitsError);
    }

    // حذف المستخدم
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
    
    if (userError) {
      console.error('Error deleting user:', userError);
      return false;
    }

    return true;
  },

  // تحديث بيانات الحافز
  async updateIncentiveSlip(id: number, slip: Omit<IncentiveSlip, 'id' | 'created_at' | 'updated_at'> & { rating?: string }): Promise<IncentiveSlip | null> {
    const { data, error } = await supabase
      .from('incentive_slips')
      .update({ ...slip })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating incentive slip:', error);
      return null;
    }
    
    return data;
  },

  // حذف بيانات الحافز
  async deleteIncentiveSlip(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('incentive_slips')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting incentive slip:', error);
      return false;
    }
    
    return true;
  },

  // تحديث بيانات الراتب
  async updateSalarySlip(id: number, slip: Omit<SalarySlip, 'id' | 'created_at' | 'updated_at'>): Promise<SalarySlip | null> {
    const { data, error } = await supabase
      .from('salary_slips')
      .update(slip)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating salary slip:', error);
      return null;
    }
    
    return data;
  },

  // حذف بيانات الراتب
  async deleteSalarySlip(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('salary_slips')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting salary slip:', error);
      return false;
    }
    
    return true;
  },

  // تحديث بيانات الأرباح
  async updateProfitsSlip(id: number, slip: Omit<ProfitsSlip, 'id' | 'created_at' | 'updated_at'>): Promise<ProfitsSlip | null> {
    const { data, error } = await supabase
      .from('profits_slips')
      .update(slip)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating profits slip:', error);
      return null;
    }
    
    return data;
  },

  // حذف بيانات الأرباح
  async deleteProfitsSlip(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('profits_slips')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting profits slip:', error);
      return false;
    }
    
    return true;
  },

  // تحديث بيانات المستخدم
  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const { data: updated, error } = await supabase
      .from('users')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Error updating user:', error);
      return null;
    }
    return updated;
  },

  // جلب بيانات المستخدم بواسطة id
  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) {
      console.error('Error fetching user by id:', error);
      return null;
    }
    return data;
  },

  // التحقق من كلمة السر
  async checkPassword(computerId: string, password: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('computer_id', computerId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking password:', error);
      return false;
    }
    
    return data?.password_hash === password;
  },
}; 