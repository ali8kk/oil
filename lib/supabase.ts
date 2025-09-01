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

// التحقق من وجود متغيرات البيئة
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are not set. Database features will be disabled.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// دالة لمسح الجلسات المخزنة (مفيدة عند تغيير JWT Key)
export const clearSupabaseSession = async () => {
  try {
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('supabase.auth.token');
    await AsyncStorage.removeItem('supabase.auth.refreshToken');
    console.log('Supabase session cleared successfully');
  } catch (error) {
    console.error('Error clearing Supabase session:', error);
  }
};

// دالة للتحقق من اتصال Supabase
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// دالة لإعادة تهيئة الاتصال (مفيدة بعد تغيير JWT Key)
export const reinitializeSupabaseConnection = async () => {
  try {
    // مسح الجلسات القديمة
    await clearSupabaseSession();
    
    // إعادة إنشاء العميل
    const newSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    
    console.log('Supabase connection reinitialized successfully');
    return newSupabase;
  } catch (error) {
    console.error('Error reinitializing Supabase connection:', error);
    return null;
  }
};

// دالة لاختبار الاتصال بقاعدة البيانات
export const testDatabaseConnection = async () => {
  try {
    console.log('Testing database connection...');
    
    // اختبار الاتصال البسيط
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Database connection test failed:', error);
      return {
        success: false,
        error: error.message,
        details: error
      };
    }
    
    console.log('Database connection test successful');
    return {
      success: true,
      message: 'تم الاتصال بقاعدة البيانات بنجاح'
    };
  } catch (error) {
    console.error('Database connection test error:', error);
    return {
      success: false,
      error: 'خطأ في الاتصال بقاعدة البيانات',
      details: error
    };
  }
};

// دالة لفحص إعدادات Supabase
export const checkSupabaseConfig = () => {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('=== Supabase Configuration Check ===');
  console.log('URL exists:', !!url);
  console.log('Key exists:', !!key);
  
  if (url) {
    console.log('URL format:', url.startsWith('https://') ? 'Valid' : 'Invalid');
    console.log('URL length:', url.length);
  }
  
  if (key) {
    console.log('Key format:', key.startsWith('eyJ') ? 'Valid JWT' : 'Invalid format');
    console.log('Key length:', key.length);
  }
  
  const issues = [];
  
  if (!url) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL غير موجود');
  } else if (!url.startsWith('https://')) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL يجب أن يبدأ بـ https://');
  } else if (!url.includes('.supabase.co')) {
    issues.push('EXPO_PUBLIC_SUPABASE_URL يجب أن يحتوي على .supabase.co');
  }
  
  if (!key) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY غير موجود');
  } else if (!key.startsWith('eyJ')) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY يجب أن يبدأ بـ eyJ');
  } else if (key.length < 100) {
    issues.push('EXPO_PUBLIC_SUPABASE_ANON_KEY قصير جداً');
  }
  
  return {
    url,
    key: key ? `${key.substring(0, 20)}...` : null,
    issues,
    isValid: issues.length === 0
  };
};

// دالة لاختبار الاتصال المباشر
export const testDirectConnection = async () => {
  try {
    console.log('Testing direct connection to Supabase...');
    
    const config = checkSupabaseConfig();
    console.log('Configuration check:', config);
    
    if (!config.isValid) {
      return {
        success: false,
        error: 'إعدادات Supabase غير صحيحة',
        details: config.issues
      };
    }
    
    // اختبار الاتصال المباشر
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''}`
      }
    });
    
    console.log('Direct connection response status:', response.status);
    
    if (response.ok) {
      return {
        success: true,
        message: 'تم الاتصال بـ Supabase بنجاح',
        status: response.status
      };
    } else {
      const errorText = await response.text();
      return {
        success: false,
        error: `فشل الاتصال: ${response.status}`,
        details: errorText
      };
    }
  } catch (error) {
    console.error('Direct connection test error:', error);
    return {
      success: false,
      error: 'خطأ في الاتصال المباشر',
      details: error
    };
  }
};

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
        total_rewards: '0',
        start_date: '',
        total_incentive: '',
        total_salary: '',
        total_profits: '',
        last_rewards_reset_date: '',
        regular_leave_bonus: '3',
        sick_leave_bonus: '2.5',
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

  // إنشاء مستخدم جديد مع كلمة سر
  async createUserWithPassword(computerId: string, password: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        computer_id: computerId,
        password_hash: password, // في الإنتاج يجب تشفير كلمة السر
        name: '',
        vacation_balance: '',
        sick_leave_balance: '',
        next_promotion_date: '',
        next_allowance_date: '',
        total_rewards: '0',
        start_date: '',
        total_incentive: '',
        total_salary: '',
        total_profits: '',
        last_rewards_reset_date: '',
        regular_leave_bonus: '3',
        sick_leave_bonus: '2.5',
        grade: '10',
        stage: '1',
        courses_names: ['سلامة', 'حاسوب', 'اختصاص', 'إدارية'],
        courses_completed: [false, false, false, false]
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating user with password:', error);
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
    try {
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
    } catch (error) {
      console.error('Exception in saveIncentiveSlip:', error);
      return null;
    }
  },

  // حفظ بيانات الراتب
  async saveSalarySlip(slip: Omit<SalarySlip, 'id' | 'created_at' | 'updated_at'>): Promise<SalarySlip | null> {
    try {
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
    } catch (error) {
      console.error('Exception in saveSalarySlip:', error);
      return null;
    }
  },

  // حفظ بيانات الأرباح
  async saveProfitsSlip(slip: Omit<ProfitsSlip, 'id' | 'created_at' | 'updated_at'>): Promise<ProfitsSlip | null> {
    try {
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
    } catch (error) {
      console.error('Exception in saveProfitsSlip:', error);
      return null;
    }
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

  // الحصول على عدد المستخدمين
  async getUsersCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error('Error getting users count:', error);
        return 0;
      }
      
      return count || 0;
    } catch (error) {
      console.error('Network error getting users count:', error);
      return 0;
    }
  },

  // الحصول على معلومات المستخدم الحالي
  async getCurrentUserInfo(userId: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error getting current user info:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Network error getting current user info:', error);
      return null;
    }
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
      .maybeSingle();
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