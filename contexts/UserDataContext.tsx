import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text } from 'react-native';
import { IncentiveData } from '../components/IncentiveModal';
import { SalaryData } from '../components/SalaryModal';
import { ProfitsData } from '../components/ProfitsModal';
import { databaseService, User, IncentiveSlip, SalarySlip, ProfitsSlip, isSupabaseConfigured } from '../lib/supabase';
import { router } from 'expo-router';

export interface UserData {
  name: string;
  computerId: string;
  password: string;
  vacationBalance: string;
  sickLeaveBalance: string;
  nextPromotionDate: string;
  nextAllowanceDate: string;
  totalRewards: string;
  startDate: string;
  totalIncentive: string;
  totalSalary: string;
  totalProfits: string;
  lastRewardsResetDate: string;
  regularLeaveBonus: string;
  sickLeaveBonus: string;
  grade: string;
  stage: string;
  coursesNames: string[];
  coursesCompleted: boolean[];
}

interface UserDataContextType {
  userData: UserData;
  currentUserId: string | null;
  isConnectedToDatabase: boolean;
  updateUserData: (data: Partial<UserData>) => Promise<void>;
  calculateServiceDuration: (startDate: string) => string;
  calculateServiceDays: (startDate: string) => number;
  getCurrentFiscalYear: () => string;
  checkAndResetRewards: () => void;
  isLoading: boolean;
  showSaveToast: boolean;
  toastMessage: string;
  triggerSaveToast: (customMessage?: string) => void;
  // Sync loading state
  isSyncing: boolean;
  manualSyncing: boolean;
  syncError: boolean;
  setManualSyncing: React.Dispatch<React.SetStateAction<boolean>>;
  setSyncError: React.Dispatch<React.SetStateAction<boolean>>;
  // Database functions
  linkToDatabase: (computerId: string, password: string) => Promise<{ success: boolean; message: string }>;
  logoutFromDatabase: () => Promise<{ success: boolean; message: string }>;
  syncToDatabase: () => Promise<{ success: boolean; message: string }>;
  saveToDatabase: () => Promise<{ success: boolean; message: string }>;
  // Auth functions
  loginUser: (computerId: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (computerId: string, password: string) => Promise<{ success: boolean; message: string }>;
  // Incentive slips
  incentiveSlips: (IncentiveData & { id?: number })[];
  addIncentiveSlip: (slip: IncentiveData) => Promise<void>;
  updateIncentiveSlip: (index: number, slip: IncentiveData) => Promise<void>;
  deleteIncentiveSlip: (index: number) => Promise<void>;
  // Salary slips
  salarySlips: (SalaryData & { id?: number })[];
  addSalarySlip: (slip: SalaryData) => Promise<void>;
  updateSalarySlip: (index: number, slip: SalaryData) => Promise<void>;
  deleteSalarySlip: (index: number) => Promise<void>;
  // Profits slips
  profitsSlips: (ProfitsData & { id?: number })[];
  addProfitsSlip: (slip: ProfitsData) => Promise<void>;
  updateProfitsSlip: (index: number, slip: ProfitsData) => Promise<void>;
  deleteProfitsSlip: (index: number) => Promise<void>;
  updateCourseCompletion: (index: number, completed: boolean) => Promise<void>;
  debugUserData: () => void;
  testIncentiveSlipOperations: () => Promise<void>;
  testUpdateMainDataFromSlip: () => Promise<void>;
  debugIncentiveProblem: () => Promise<void>;
  fixIncentiveTotal: () => Promise<void>;
  testDirectIncentiveUpdate: () => Promise<void>;
  debugRewardsProblem: () => Promise<void>;
  fixRewardsTotal: () => Promise<void>;
  cleanupLocalData: () => Promise<void>;
  syncPendingLocalData: () => Promise<void>;
  cleanupDuplicateSlips: () => Promise<void>;
  handleDatabaseError: (error: any, operation: string, slipData: any, index?: number) => Promise<boolean>;
  // دوال المكافآت الجديدة
  calculateRewardsForYear: (year: string) => number;
  updateCurrentYearRewards: () => Promise<void>;
  updateBaseRewards: (newBaseRewards: string) => Promise<void>;
}

const defaultUserData: UserData = {
  name: '',
  computerId: '',
  password: '',
  vacationBalance: '',
  sickLeaveBalance: '',
  nextPromotionDate: '',
  nextAllowanceDate: '',
  totalRewards: '0',
  startDate: '',
  totalIncentive: '',
  totalSalary: '',
  totalProfits: '',
  lastRewardsResetDate: '',
  regularLeaveBonus: '3',
  sickLeaveBonus: '2.5',
  grade: '10',
  stage: '1',
  coursesNames: ['سلامة', 'حاسوب', 'اختصاص', 'إدارية'],
  coursesCompleted: [false, false, false, false]
};

// متغير منفصل لتخزين القيمة الأساسية للمكافآت
const BASE_REWARDS_KEY = '@base_rewards';

const STORAGE_KEY = '@user_data';
const INCENTIVE_SLIPS_KEY = '@incentive_slips';
const SALARY_SLIPS_KEY = '@salary_slips';
const PROFITS_SLIPS_KEY = '@profits_slips';
const USER_ID_KEY = '@current_user_id';
const IS_CONNECTED_KEY = '@is_connected';

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [userData, setUserData] = useState<UserData>(defaultUserData);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isConnectedToDatabase, setIsConnectedToDatabase] = useState(false);
  const [isNewConnection, setIsNewConnection] = useState(false);
  const [incentiveSlips, setIncentiveSlips] = useState<(IncentiveData & { id?: number })[]>([]);
  const [salarySlips, setSalarySlips] = useState<(SalaryData & { id?: number })[]>([]);
  const [profitsSlips, setProfitsSlips] = useState<(ProfitsData & { id?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('تم حفظ التغييرات بنجاح! ✅');
  const [isSyncing, setIsSyncing] = useState(false);
  const [manualSyncing, setManualSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [hasError, setHasError] = useState(false);

  // تحميل البيانات من التخزين المحلي عند بدء التطبيق
  useEffect(() => {
    console.log('useEffect - تحميل البيانات من التخزين المحلي عند بدء التطبيق');
    loadAllData().catch((error) => {
      console.error('Error in loadAllData:', error);
      setHasError(true);
      setIsLoading(false);
    });
  }, []);

  // تحميل البيانات من قاعدة البيانات عند الاتصال
  useEffect(() => {
    console.log('useEffect - تحميل البيانات من قاعدة البيانات:', {
      currentUserId,
      isConnectedToDatabase,
      isNewConnection
    });
    
    // فقط نحمل البيانات إذا كان المستخدم متصل وهذا ليس اتصال جديد
    if (currentUserId && isConnectedToDatabase && !isNewConnection) {
      console.log('useEffect - استدعاء loadFromDatabase');
      loadFromDatabase();
    }
  }, [currentUserId, isConnectedToDatabase]);

  const loadAllData = async () => {
    try {
      console.log('Starting to load all data...');
      
      // تحميل البيانات بشكل متسلسل لتجنب الأخطاء
      await loadUserData();
      await loadCurrentUserId();
      await loadIncentiveSlips();
      await loadSalarySlips();
      await loadProfitsSlips();
      
      // تحميل القيمة الأساسية للمكافآت
      const baseRewardsString = await AsyncStorage.getItem(BASE_REWARDS_KEY);
      console.log('loadAllData - القيمة الأساسية من التخزين:', baseRewardsString);
      
      // إعادة تعيين القيمة الأساسية إلى 0 للمستخدمين الجدد أو إذا كانت القيمة غير صحيحة
      if (!baseRewardsString || baseRewardsString === '250' || baseRewardsString === '250.0' || baseRewardsString === '250,000') {
        await AsyncStorage.setItem(BASE_REWARDS_KEY, '0');
        console.log('تم إعادة تعيين القيمة الأساسية للمكافآت إلى: 0');
      } else {
        console.log('القيمة الأساسية للمكافآت موجودة:', baseRewardsString);
      }
      
      // التحقق من التواريخ وتحديثها بعد تحميل البيانات المحلية
      await checkAndUpdateAllowanceDate();
      await checkAndUpdatePromotionDate();
      
      // تحديث المكافآت الكلية بعد تحميل جميع البيانات
      await updateCurrentYearRewards();
      
      console.log('All data loaded successfully');
    } catch (error) {
      console.error('Error loading data:', error);
      // لا نضع setHasError(true) هنا لأننا نريد التطبيق أن يعمل حتى مع الأخطاء
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const storedData = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        console.log('loadUserData - البيانات من التخزين المحلي:', {
          vacationBalance: parsedData.vacationBalance,
          sickLeaveBalance: parsedData.sickLeaveBalance
        });
        
        // التأكد من وجود الحقول الجديدة
        const updatedData = { ...defaultUserData, ...parsedData };
        
        // إعادة تعيين totalRewards إلى 0 إذا كانت القيمة غير صحيحة
        if (!updatedData.totalRewards || updatedData.totalRewards === '250' || updatedData.totalRewards === '250.0' || updatedData.totalRewards === '250,000') {
          updatedData.totalRewards = '0';
        }
        
        setUserData(updatedData);
        console.log('loadUserData - تم تحديث البيانات من التخزين المحلي');
      } else {
        console.log('No stored user data found, using defaults');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      // استخدم البيانات الافتراضية في حالة الخطأ
      setUserData(defaultUserData);
    }
  };

  const loadCurrentUserId = async () => {
    try {
      const userId = await AsyncStorage.getItem(USER_ID_KEY);
      if (userId) {
        setCurrentUserId(userId);
        setIsConnectedToDatabase(true);
        console.log('User ID loaded successfully');
      } else {
        console.log('No stored user ID found');
      }
    } catch (error) {
      console.error('Error loading user ID:', error);
    }
  };

  const loadIncentiveSlips = async () => {
    try {
      const storedSlips = await AsyncStorage.getItem(INCENTIVE_SLIPS_KEY);
      if (storedSlips) {
        setIncentiveSlips(JSON.parse(storedSlips));
        console.log('Incentive slips loaded successfully');
      } else {
        console.log('No stored incentive slips found');
      }
    } catch (error) {
      console.error('Error loading incentive slips:', error);
      setIncentiveSlips([]);
    }
  };

  const loadSalarySlips = async () => {
    try {
      const storedSlips = await AsyncStorage.getItem(SALARY_SLIPS_KEY);
      if (storedSlips) {
        setSalarySlips(JSON.parse(storedSlips));
        console.log('Salary slips loaded successfully');
      } else {
        console.log('No stored salary slips found');
      }
    } catch (error) {
      console.error('Error loading salary slips:', error);
      setSalarySlips([]);
    }
  };

  const loadProfitsSlips = async () => {
    try {
      const storedSlips = await AsyncStorage.getItem(PROFITS_SLIPS_KEY);
      if (storedSlips) {
        const parsedSlips = JSON.parse(storedSlips);
        // إضافة حقل rating للقصاصات القديمة التي لا تحتوي عليه
        const updatedSlips = parsedSlips.map((slip: any) => ({
          ...slip,
          rating: slip.rating || 'متوسط'
        }));
        setProfitsSlips(updatedSlips);
        console.log('Profits slips loaded successfully');
      } else {
        console.log('No stored profits slips found');
      }
    } catch (error) {
      console.error('Error loading profits slips:', error);
      setProfitsSlips([]);
    }
  };

  const loadFromDatabase = async () => {
    try {
      console.log('Loading data from database...');
      
      if (!isSupabaseConfigured()) {
        console.log('Supabase not configured, skipping database load');
        return;
      }
      
      if (!currentUserId) {
        console.log('No current user ID, skipping database load');
        return;
      }
      
      // تنظيف القصاصات المكررة أولاً
      await cleanupDuplicateSlips();
      
      // جلب بيانات المستخدم
      const user = await databaseService.getUserById(currentUserId);
      if (user) {
        console.log('loadFromDatabase - البيانات من قاعدة البيانات:', {
          vacationBalance: user.vacation_balance,
          sickLeaveBalance: user.sick_leave_balance,
          totalRewards: user.total_rewards
        });
        
        const newUserData: UserData = {
          name: user.name,
          computerId: user.computer_id,
          password: user.password_hash,
          vacationBalance: user.vacation_balance,
          sickLeaveBalance: user.sick_leave_balance,
          nextPromotionDate: user.next_promotion_date,
          nextAllowanceDate: user.next_allowance_date,
          totalRewards: user.total_rewards,
          startDate: user.start_date,
          totalIncentive: user.total_incentive,
          totalSalary: user.total_salary,
          totalProfits: user.total_profits,
          lastRewardsResetDate: user.last_rewards_reset_date,
          regularLeaveBonus: user.regular_leave_bonus,
          sickLeaveBonus: user.sick_leave_bonus,
          grade: user.grade,
          stage: user.stage,
          coursesNames: user.courses_names,
          coursesCompleted: user.courses_completed,
        };
        
        console.log('loadFromDatabase - الأرصدة الحالية قبل التحديث:', {
          vacationBalance: userData.vacationBalance,
          sickLeaveBalance: userData.sickLeaveBalance
        });
        
        setUserData(newUserData);
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
        console.log('loadFromDatabase - تم تحديث البيانات من قاعدة البيانات');
      }
      
      // جلب قصاصات الحوافز
      const dbIncentiveSlips = await databaseService.getIncentiveSlips(currentUserId);
      const incentiveSlipsData = dbIncentiveSlips.map(slip => ({
        id: slip.id,
        month: slip.month,
        points: slip.basic_salary.toString(),
        regularLeave: slip.allowance.toString(),
        rewards: slip.bonus.toString(),
        sickLeave: slip.deductions.toString(),
        totalIncentive: slip.total_incentive.toString(),
        rating: slip.rating || 'متوسط'
      }));
      setIncentiveSlips(incentiveSlipsData);
      await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(incentiveSlipsData));
      console.log('Incentive slips loaded from database:', incentiveSlipsData.length);
      
      // جلب قصاصات الراتب
      const dbSalarySlips = await databaseService.getSalarySlips(currentUserId);
      const salarySlipsData = dbSalarySlips.map(slip => ({
        id: slip.id,
        month: slip.month,
        totalSalary: slip.total_salary.toString(),
        bonus: slip.bonus?.toString() || '0'
      }));
      setSalarySlips(salarySlipsData);
      await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(salarySlipsData));
      console.log('Salary slips loaded from database:', salarySlipsData.length);
      
      // جلب قصاصات الأرباح
      const dbProfitsSlips = await databaseService.getProfitsSlips(currentUserId);
      const profitsSlipsData = dbProfitsSlips.map(slip => ({
        id: slip.id,
        profitYear: slip.profit_year,
        profitPeriod: slip.profit_period === 'first' ? '50% الأولى' : '50% الثانية',
        profitPoints: slip.basic_profits.toString(),
        totalProfits: slip.total_profits.toString(),
        rating: slip.rating || 'متوسط'
      }));
      setProfitsSlips(profitsSlipsData);
      await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(profitsSlipsData));
      console.log('Profits slips loaded from database:', profitsSlipsData.length);
      
      // مزامنة القصاصات المحلية الجديدة مع قاعدة البيانات
      await syncPendingLocalData();
      
      // التحقق من التواريخ وتحديثها بعد تحميل البيانات
      await checkAndUpdateAllowanceDate();
      await checkAndUpdatePromotionDate();
      
      console.log('All data loaded from database successfully');
    } catch (error) {
      console.log('Error loading from database:', error);
    }
  };

  // دالة لإعادة حساب القيم الإجمالية من القصاصات
  const recalculateTotalsFromSlips = async (
    incentiveSlipsData: (IncentiveData & { id?: number })[], 
    salarySlipsData: (SalaryData & { id?: number })[], 
    profitsSlipsData: (ProfitsData & { id?: number })[]
  ) => {
    const formatNumber = (num: number) => num.toLocaleString('en-US');
    
    // حساب إجمالي الحوافز
    const totalIncentive = incentiveSlipsData.reduce((total, slip) => {
      const incentiveValue = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
      return total + incentiveValue;
    }, 0);
    
    // حساب إجمالي الرواتب
    const totalSalary = salarySlipsData.reduce((total, slip) => {
      const salaryValue = parseFloat(slip.totalSalary?.replace(/,/g, '') || '0');
      return total + salaryValue;
    }, 0);
    
    // حساب إجمالي الأرباح
    const totalProfits = profitsSlipsData.reduce((total, slip) => {
      const profitsValue = parseFloat(slip.totalProfits?.replace(/,/g, '') || '0');
      return total + profitsValue;
    }, 0);
    
    // حساب إجمالي المكافآت من قصاصات الحافز
    const totalRewardsFromSlips = incentiveSlipsData.reduce((total, slip) => {
      const rewardsValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
      return total + rewardsValue;
    }, 0);
    // جمع قيمة المكافأة الكلية من الإعدادات (userData.totalRewards)
    const totalRewardsFromSettings = parseFloat(userData.totalRewards?.replace(/,/g, '') || '0');
    // مكافآت السنة = من الإعدادات + من القصاصات
    const totalRewards = totalRewardsFromSettings + totalRewardsFromSlips;

    // لا نحسب أرصدة الإجازات هنا - يتم تحديثها مباشرة في دوال إضافة/تحديث/حذف القصاصات
    // نحتفظ بالقيم الحالية من الإعدادات
    const vacationBalance = parseInt(userData.vacationBalance) || 0;
    const sickLeaveBalance = parseInt(userData.sickLeaveBalance) || 0;

    // تحديث البيانات مع القيم المحسوبة
    const updatedData = {
      totalIncentive: formatNumber(totalIncentive),
      totalSalary: formatNumber(totalSalary),
      totalProfits: formatNumber(totalProfits),
      totalRewards: formatNumber(totalRewards),
      vacationBalance: vacationBalance.toString(),
      sickLeaveBalance: sickLeaveBalance.toString(),
    };

    await updateUserData(updatedData);

    console.log('تم إعادة حساب القيم الإجمالية:', {
      totalIncentive: formatNumber(totalIncentive),
      totalSalary: formatNumber(totalSalary),
      totalProfits: formatNumber(totalProfits),
      totalRewards: formatNumber(totalRewards),
      vacationBalance,
      sickLeaveBalance,
    });
  };

    const updateUserData = async (data: Partial<UserData>) => {
    try {
      console.log('updateUserData - البيانات المراد تحديثها:', data);
      console.log('updateUserData - الأرصدة الحالية قبل التحديث:', {
        vacationBalance: userData.vacationBalance,
        sickLeaveBalance: userData.sickLeaveBalance
      });
      
      setIsSyncing(true);
      let newUserData = { ...userData, ...data };
      
      console.log('updateUserData - الأرصدة الجديدة بعد التحديث:', {
        vacationBalance: newUserData.vacationBalance,
        sickLeaveBalance: newUserData.sickLeaveBalance
      });
      
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        // حدث في قاعدة البيانات
        const dbData: any = {};
        if (data.name !== undefined) dbData.name = data.name;
        if (data.vacationBalance !== undefined) dbData.vacation_balance = data.vacationBalance;
        if (data.sickLeaveBalance !== undefined) dbData.sick_leave_balance = data.sickLeaveBalance;
        if (data.nextPromotionDate !== undefined) dbData.next_promotion_date = data.nextPromotionDate;
        if (data.nextAllowanceDate !== undefined) dbData.next_allowance_date = data.nextAllowanceDate;
        if (data.totalRewards !== undefined) dbData.total_rewards = data.totalRewards;
        if (data.startDate !== undefined) dbData.start_date = data.startDate;
        if (data.totalIncentive !== undefined) dbData.total_incentive = data.totalIncentive;
        if (data.totalSalary !== undefined) dbData.total_salary = data.totalSalary;
        if (data.totalProfits !== undefined) dbData.total_profits = data.totalProfits;
        if (data.lastRewardsResetDate !== undefined) dbData.last_rewards_reset_date = data.lastRewardsResetDate;
        if (data.regularLeaveBonus !== undefined) dbData.regular_leave_bonus = data.regularLeaveBonus;
        if (data.sickLeaveBonus !== undefined) dbData.sick_leave_bonus = data.sickLeaveBonus;
        if (data.grade !== undefined) dbData.grade = data.grade;
        if (data.stage !== undefined) dbData.stage = data.stage;
        if (data.coursesNames !== undefined) dbData.courses_names = data.coursesNames;
        if (data.coursesCompleted !== undefined) dbData.courses_completed = data.coursesCompleted;
        if (data.computerId !== undefined) dbData.computer_id = data.computerId;
        if (data.password !== undefined) dbData.password_hash = data.password;
        if (Object.keys(dbData).length > 0) {
                console.log('updateUserData - حفظ البيانات في قاعدة البيانات:', dbData);
      const result = await databaseService.updateUser(currentUserId, dbData);
      if (result === null) {
        console.log('updateUserData - المستخدم غير موجود في قاعدة البيانات');
        setSyncError(true);
        setTimeout(() => setSyncError(false), 3000);
      } else {
        console.log('updateUserData - تم حفظ البيانات في قاعدة البيانات بنجاح');
      }
        }
      }
      setUserData(newUserData);
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
        console.log('updateUserData - تم حفظ البيانات في التخزين المحلي');
      } catch (error) {
        console.log('Error saving user data locally:', error);
      }
    } catch (error) {
      console.log('Error updating user data:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const addIncentiveSlip = async (slip: IncentiveData) => {
    setManualSyncing(true);
    setIsSyncing(true);
    console.log('setIsSyncing(true) - addIncentiveSlip');
    console.log('addIncentiveSlip called with:', slip);
    let databaseSuccess = true;
    try {
      // إنشاء قصاصة محلية مؤقتة بدون ID
      const tempSlip = { ...slip, id: undefined };
      const updatedSlips = [...incentiveSlips, tempSlip];
      setIncentiveSlips(updatedSlips);
      await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // حفظ في قاعدة البيانات إذا كان متصل
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured()) {
        try {
          const savedSlip = await databaseService.saveIncentiveSlip({
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.points.replace(/,/g, '') || '0'),
            allowance: parseFloat(slip.regularLeave.replace(/,/g, '') || '0'),
            bonus: parseFloat(slip.rewards.replace(/,/g, '') || '0'),
            deductions: parseFloat(slip.sickLeave.replace(/,/g, '') || '0'),
            total_incentive: parseFloat(slip.totalIncentive.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
          
          if (savedSlip === null) {
            console.log('addIncentiveSlip - فشل في حفظ القصاصة في قاعدة البيانات');
            databaseSuccess = false;
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
            
            // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
            const localSlip = { ...slip, id: Date.now() };
            const localUpdatedSlips = [...incentiveSlips, localSlip];
            setIncentiveSlips(localUpdatedSlips);
            await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
          } else {
            // تحديث القصاصة المحلية بالـ ID من قاعدة البيانات
            const finalSlip = { ...slip, id: savedSlip?.id || Date.now() };
            const finalUpdatedSlips = [...incentiveSlips, finalSlip];
            setIncentiveSlips(finalUpdatedSlips);
            await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(finalUpdatedSlips));
            
            console.log('addIncentiveSlip: created slip with database id', savedSlip?.id);
          }
        } catch (dbError) {
          console.log('Database error in addIncentiveSlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
          const localSlip = { ...slip, id: Date.now() };
          const localUpdatedSlips = [...incentiveSlips, localSlip];
          setIncentiveSlips(localUpdatedSlips);
          await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
          throw dbError; // أعد رمي الخطأ حتى لا يتم تعيين setManualSyncing(false)
        }
      } else {
        // إذا لم يكن متصل بقاعدة البيانات، نعطي القصاصة ID محلي
        const localSlip = { ...slip, id: Date.now() };
        const localUpdatedSlips = [...incentiveSlips, localSlip];
        setIncentiveSlips(localUpdatedSlips);
        await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
      }
      
      // تحديث إجمالي الحوافز
      const currentIncentiveTotal = parseFloat(userData.totalIncentive?.replace(/,/g, '') || '0');
      const slipIncentiveValue = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
      const newIncentiveTotal = currentIncentiveTotal + slipIncentiveValue;
      
      // تحديث أرصدة الإجازات
      const currentVacationBalance = parseInt(userData.vacationBalance) || 0;
      const currentSickLeaveBalance = parseFloat(userData.sickLeaveBalance) || 0;
      const regularLeaveBonus = parseInt(userData.regularLeaveBonus) || 3;
      const sickLeaveBonus = parseFloat(userData.sickLeaveBonus) || 2.5;
      
      const regularLeaveValue = parseInt(slip.regularLeave) || 0;
      const sickLeaveValue = parseInt(slip.sickLeave) || 0;
      
      console.log('addIncentiveSlip - أرصدة الإجازات:', {
        currentVacationBalance,
        currentSickLeaveBalance,
        regularLeaveBonus,
        sickLeaveBonus,
        regularLeaveValue,
        sickLeaveValue
      });
      
      // حساب رصيد الإجازات الاعتيادية الجديد
      let newVacationBalance = currentVacationBalance;
      if (regularLeaveValue === 0) {
        // إذا كان الحقل فارغ أو 0، نضيف مكافأة الإجازات فقط
        newVacationBalance = currentVacationBalance + regularLeaveBonus;
        console.log('addIncentiveSlip - إضافة مكافأة الإجازات الاعتيادية فقط:', { newVacationBalance });
      } else {
        // إذا كان هناك رقم، نضيف مكافأة الإجازات ثم نطرح الرقم المدخل
        newVacationBalance = currentVacationBalance + regularLeaveBonus - regularLeaveValue;
        console.log('addIncentiveSlip - إضافة مكافأة وطرح الإجازات المستخدمة:', { newVacationBalance });
      }
      
      // حساب رصيد الإجازات المرضية الجديد
      let newSickLeaveBalance = currentSickLeaveBalance;
      if (sickLeaveValue === 0) {
        // إذا كان الحقل فارغ أو 0، نضيف مكافأة الإجازات فقط
        newSickLeaveBalance = currentSickLeaveBalance + sickLeaveBonus;
        console.log('addIncentiveSlip - إضافة مكافأة الإجازات المرضية فقط:', { newSickLeaveBalance });
      } else {
        // إذا كان هناك رقم، نضيف مكافأة الإجازات ثم نطرح الرقم المدخل
        newSickLeaveBalance = currentSickLeaveBalance + sickLeaveBonus - sickLeaveValue;
        console.log('addIncentiveSlip - إضافة مكافأة وطرح الإجازات المرضية المستخدمة:', { newSickLeaveBalance });
      }
      
      // التأكد من أن الأرصدة لا تكون سالبة
      newVacationBalance = Math.max(0, newVacationBalance);
      newSickLeaveBalance = Math.max(0, newSickLeaveBalance);
      
      console.log('addIncentiveSlip - الأرصدة النهائية:', {
        newVacationBalance,
        newSickLeaveBalance
      });
      
      // تحديث البيانات
      const updatedUserData = {
        ...userData,
        totalIncentive: newIncentiveTotal.toLocaleString('en-US'),
        vacationBalance: newVacationBalance.toString(),
        sickLeaveBalance: newSickLeaveBalance.toString()
      };
      
      console.log('addIncentiveSlip - تحديث البيانات:', {
        oldVacationBalance: userData.vacationBalance,
        newVacationBalance: newVacationBalance.toString(),
        oldSickLeaveBalance: userData.sickLeaveBalance,
        newSickLeaveBalance: newSickLeaveBalance.toString()
      });
      
      setUserData(updatedUserData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
      
      // حفظ الأرصدة في قاعدة البيانات
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        try {
          const result = await databaseService.updateUser(currentUserId, {
            vacation_balance: newVacationBalance.toString(),
            sick_leave_balance: newSickLeaveBalance.toString()
          });
          if (result === null) {
            console.log('addIncentiveSlip - المستخدم غير موجود في قاعدة البيانات');
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
          } else {
            console.log('addIncentiveSlip - تم حفظ الأرصدة في قاعدة البيانات');
          }
        } catch (error) {
          console.log('Error saving balances to database:', error);
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      console.log('addIncentiveSlip - تم حفظ البيانات في التخزين المحلي');
      
      // تحديث المكافآت بناءً على النظام الجديد
      console.log('addIncentiveSlip - قبل updateCurrentYearRewards');
      await updateCurrentYearRewards();
      console.log('addIncentiveSlip - بعد updateCurrentYearRewards');
      
      // التحقق من الأرصدة بعد updateCurrentYearRewards
      console.log('addIncentiveSlip - الأرصدة بعد updateCurrentYearRewards:', {
        vacationBalance: userData.vacationBalance,
        sickLeaveBalance: userData.sickLeaveBalance
      });
      
      console.log('addIncentiveSlip completed successfully');
      console.log('Updated balances:', {
        vacationBalance: newVacationBalance,
        sickLeaveBalance: newSickLeaveBalance,
        regularLeaveValue,
        sickLeaveValue,
        regularLeaveBonus,
        sickLeaveBonus
      });
      
      // التحقق النهائي من الأرصدة
      console.log('addIncentiveSlip - الأرصدة النهائية بعد اكتمال العملية:', {
        vacationBalance: userData.vacationBalance,
        sickLeaveBalance: userData.sickLeaveBalance
      });
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      setIsSyncing(false);
      // لا تعيّن setManualSyncing(false) هنا حتى لا تظهر "تمت المزامنة" عند الفشل
      console.log('Error adding incentive slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
        console.log('setIsSyncing(false) - addIncentiveSlip');
        
        // التحقق من الأرصدة بعد إعادة تعيين المزامنة
        console.log('addIncentiveSlip - الأرصدة بعد إعادة تعيين المزامنة:', {
          vacationBalance: userData.vacationBalance,
          sickLeaveBalance: userData.sickLeaveBalance
        });
      }, 1500);
    }
  };

  const updateIncentiveSlip = async (index: number, slip: IncentiveData) => {
    setManualSyncing(true);
    setIsSyncing(true);
    console.log('setIsSyncing(true) - updateIncentiveSlip');
    console.log('updateIncentiveSlip called with:', { index, slip });
    try {
      const existingSlip = incentiveSlips[index];
      console.log('existingSlip:', existingSlip);
      let databaseSuccess = true;
      const updatedSlips = [...incentiveSlips];
      updatedSlips[index] = { ...slip, id: updatedSlips[index]?.id || Date.now() };
      setIncentiveSlips(updatedSlips);
      await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(updatedSlips));
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured() && updatedSlips[index]?.id) {
        try {
          // محاولة التحديث مباشرة
          await databaseService.updateIncentiveSlip(updatedSlips[index].id, {
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.points.replace(/,/g, '') || '0'),
            allowance: parseFloat(slip.regularLeave.replace(/,/g, '') || '0'),
            bonus: parseFloat(slip.rewards.replace(/,/g, '') || '0'),
            deductions: parseFloat(slip.sickLeave.replace(/,/g, '') || '0'),
            total_incentive: parseFloat(slip.totalIncentive.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
        } catch (dbError) {
          console.log('Database error in updateIncentiveSlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          throw dbError;
        }
      }
      
      // تحديث الأرصدة عند تعديل القصاصة
      const currentVacationBalance = parseInt(userData.vacationBalance) || 0;
      const currentSickLeaveBalance = parseFloat(userData.sickLeaveBalance) || 0;
      const regularLeaveBonus = parseInt(userData.regularLeaveBonus) || 3;
      const sickLeaveBonus = parseFloat(userData.sickLeaveBonus) || 2.5;
      
      // القيم القديمة من القصاصة الموجودة
      const oldRegularLeaveValue = parseInt(existingSlip.regularLeave) || 0;
      const oldSickLeaveValue = parseInt(existingSlip.sickLeave) || 0;
      
      // القيم الجديدة من القصاصة المحدثة
      const newRegularLeaveValue = parseInt(slip.regularLeave) || 0;
      const newSickLeaveValue = parseInt(slip.sickLeave) || 0;
      
      console.log('updateIncentiveSlip - أرصدة الإجازات:', {
        currentVacationBalance,
        currentSickLeaveBalance,
        regularLeaveBonus,
        sickLeaveBonus,
        oldRegularLeaveValue,
        oldSickLeaveValue,
        newRegularLeaveValue,
        newSickLeaveValue
      });
      
      // حساب رصيد الإجازات الاعتيادية الجديد
      let newVacationBalance = currentVacationBalance;
      
      // طرح التأثير القديم
      if (oldRegularLeaveValue === 0) {
        newVacationBalance -= regularLeaveBonus;
      } else {
        newVacationBalance = newVacationBalance - regularLeaveBonus + oldRegularLeaveValue;
      }
      
      // إضافة التأثير الجديد
      if (newRegularLeaveValue === 0) {
        newVacationBalance += regularLeaveBonus;
      } else {
        newVacationBalance = newVacationBalance + regularLeaveBonus - newRegularLeaveValue;
      }
      
      // حساب رصيد الإجازات المرضية الجديد
      let newSickLeaveBalance = currentSickLeaveBalance;
      
      // طرح التأثير القديم
      if (oldSickLeaveValue === 0) {
        newSickLeaveBalance -= sickLeaveBonus;
      } else {
        newSickLeaveBalance = newSickLeaveBalance - sickLeaveBonus + oldSickLeaveValue;
      }
      
      // إضافة التأثير الجديد
      if (newSickLeaveValue === 0) {
        newSickLeaveBalance += sickLeaveBonus;
      } else {
        newSickLeaveBalance = newSickLeaveBalance + sickLeaveBonus - newSickLeaveValue;
      }
      
      // التأكد من أن الأرصدة لا تكون سالبة
      newVacationBalance = Math.max(0, newVacationBalance);
      newSickLeaveBalance = Math.max(0, newSickLeaveBalance);
      
      console.log('updateIncentiveSlip - الأرصدة الجديدة:', {
        newVacationBalance,
        newSickLeaveBalance
      });
      
      // تحديث البيانات
      const updatedUserData = {
        ...userData,
        vacationBalance: newVacationBalance.toString(),
        sickLeaveBalance: newSickLeaveBalance.toString()
      };
      
      console.log('updateIncentiveSlip - تحديث البيانات:', {
        oldVacationBalance: userData.vacationBalance,
        newVacationBalance: newVacationBalance.toString(),
        oldSickLeaveBalance: userData.sickLeaveBalance,
        newSickLeaveBalance: newSickLeaveBalance.toString()
      });
      
      setUserData(updatedUserData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
      
      // حفظ الأرصدة في قاعدة البيانات
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        try {
          const result = await databaseService.updateUser(currentUserId, {
            vacation_balance: newVacationBalance.toString(),
            sick_leave_balance: newSickLeaveBalance.toString()
          });
          if (result === null) {
            console.log('updateIncentiveSlip - المستخدم غير موجود في قاعدة البيانات');
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
          } else {
            console.log('updateIncentiveSlip - تم حفظ الأرصدة في قاعدة البيانات');
          }
        } catch (error) {
          console.log('Error saving balances to database:', error);
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      console.log('updateIncentiveSlip - تم حفظ البيانات في التخزين المحلي');
      
      // تحديث المكافآت بناءً على النظام الجديد
      await updateCurrentYearRewards();
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
      
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
      console.log('setIsSyncing(false) - updateIncentiveSlip');
    } catch (error) {
      setIsSyncing(false);
      // لا تعيّن setManualSyncing(false) هنا حتى لا تظهر "تمت المزامنة" عند الفشل
      console.log('Error updating incentive slip:', error);
    }
  };

  const deleteIncentiveSlip = async (index: number) => {
    setManualSyncing(true);
    setIsSyncing(true);
    console.log('setIsSyncing(true) - deleteIncentiveSlip');
    console.log('deleteIncentiveSlip called with index:', index);
    try {
      const slipToDelete = incentiveSlips[index];
      console.log('slipToDelete:', slipToDelete);
      
      let databaseSuccess = true;
      
      const updatedSlips = incentiveSlips.filter((_, i) => i !== index);
      setIncentiveSlips(updatedSlips);
      await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured() && slipToDelete?.id) {
        try {
          await databaseService.deleteIncentiveSlip(slipToDelete.id);
        } catch (dbError) {
          console.log('Database error in deleteIncentiveSlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          throw dbError;
        }
      }
      
      // تحديث الأرصدة عند حذف القصاصة
      const currentVacationBalance = parseInt(userData.vacationBalance) || 0;
      const currentSickLeaveBalance = parseFloat(userData.sickLeaveBalance) || 0;
      const regularLeaveBonus = parseInt(userData.regularLeaveBonus) || 3;
      const sickLeaveBonus = parseFloat(userData.sickLeaveBonus) || 2.5;
      
      const regularLeaveValue = parseInt(slipToDelete.regularLeave) || 0;
      const sickLeaveValue = parseInt(slipToDelete.sickLeave) || 0;
      
      console.log('deleteIncentiveSlip - أرصدة الإجازات:', {
        currentVacationBalance,
        currentSickLeaveBalance,
        regularLeaveBonus,
        sickLeaveBonus,
        regularLeaveValue,
        sickLeaveValue
      });
      
      // حساب رصيد الإجازات الاعتيادية الجديد (عكس الإضافة)
      let newVacationBalance = currentVacationBalance;
      if (regularLeaveValue === 0) {
        // إذا كان الحقل فارغ أو 0، نطرح مكافأة الإجازات فقط
        newVacationBalance = currentVacationBalance - regularLeaveBonus;
      } else {
        // إذا كان هناك رقم، نطرح مكافأة الإجازات ثم نضيف الرقم المدخل
        newVacationBalance = currentVacationBalance - regularLeaveBonus + regularLeaveValue;
      }
      
      // حساب رصيد الإجازات المرضية الجديد (عكس الإضافة)
      let newSickLeaveBalance = currentSickLeaveBalance;
      if (sickLeaveValue === 0) {
        // إذا كان الحقل فارغ أو 0، نطرح مكافأة الإجازات فقط
        newSickLeaveBalance = currentSickLeaveBalance - sickLeaveBonus;
      } else {
        // إذا كان هناك رقم، نطرح مكافأة الإجازات ثم نضيف الرقم المدخل
        newSickLeaveBalance = currentSickLeaveBalance - sickLeaveBonus + sickLeaveValue;
      }
      
      // التأكد من أن الأرصدة لا تكون سالبة
      newVacationBalance = Math.max(0, newVacationBalance);
      newSickLeaveBalance = Math.max(0, newSickLeaveBalance);
      
      console.log('deleteIncentiveSlip - الأرصدة الجديدة:', {
        newVacationBalance,
        newSickLeaveBalance
      });
      
      // تحديث البيانات
      const updatedUserData = {
        ...userData,
        vacationBalance: newVacationBalance.toString(),
        sickLeaveBalance: newSickLeaveBalance.toString()
      };
      
      console.log('deleteIncentiveSlip - تحديث البيانات:', {
        oldVacationBalance: userData.vacationBalance,
        newVacationBalance: newVacationBalance.toString(),
        oldSickLeaveBalance: userData.sickLeaveBalance,
        newSickLeaveBalance: newSickLeaveBalance.toString()
      });
      
      setUserData(updatedUserData);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
      
      // حفظ الأرصدة في قاعدة البيانات
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        try {
          const result = await databaseService.updateUser(currentUserId, {
            vacation_balance: newVacationBalance.toString(),
            sick_leave_balance: newSickLeaveBalance.toString()
          });
          if (result === null) {
            console.log('deleteIncentiveSlip - المستخدم غير موجود في قاعدة البيانات');
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
          } else {
            console.log('deleteIncentiveSlip - تم حفظ الأرصدة في قاعدة البيانات');
          }
        } catch (error) {
          console.log('Error saving balances to database:', error);
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      console.log('deleteIncentiveSlip - تم حفظ البيانات في التخزين المحلي');
      
      // تحديث المكافآت بناءً على النظام الجديد
      // استخدام القصاصات المحدثة مباشرة بدلاً من قراءتها من AsyncStorage
      const currentYear = getCurrentFiscalYear();
      console.log(`deleteIncentiveSlip - السنة المالية الحالية: ${currentYear}`);
      
      // حساب المكافآت من القصاصات المحدثة
      let slipsRewards = 0;
      
      // جمع مكافآت قصاصات الحافز للسنة المحددة
      updatedSlips.forEach((slip: any) => {
        const slipYear = slip.month?.split('/')?.[1] || '';
        if (slipYear === currentYear) {
          const rewardValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
          slipsRewards += rewardValue;
          console.log(`Incentive slip for year ${currentYear}:`, { month: slip.month, rewards: slip.rewards, rewardValue });
        }
      });
      
      // جمع مكافآت قصاصات الراتب للسنة المحددة
      salarySlips.forEach((slip: any) => {
        const slipYear = slip.month?.split('/')?.[1] || '';
        if (slipYear === currentYear) {
          const bonusValue = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
          slipsRewards += bonusValue;
          console.log(`Salary slip for year ${currentYear}:`, { month: slip.month, bonus: slip.bonus, bonusValue });
        }
      });
      
      console.log(`deleteIncentiveSlip - مكافآت القصاصات: ${slipsRewards}`);
      
      // الحصول على القيمة الأساسية من التخزين المحلي
      const baseRewardsString = await AsyncStorage.getItem(BASE_REWARDS_KEY);
      const baseRewards = parseFloat(baseRewardsString || '0');
      console.log(`deleteIncentiveSlip - القيمة الأساسية: ${baseRewards}`);
      
      const totalRewards = baseRewards + slipsRewards;
      console.log(`deleteIncentiveSlip - المكافآت الكلية: ${baseRewards} + ${slipsRewards} = ${totalRewards}`);
      
      const formatNumber = (num: number) => num.toLocaleString('en-US');
      
      // تحديث totalRewards
      const updatedUserDataWithRewards = {
        ...updatedUserData,
        totalRewards: formatNumber(totalRewards)
      };
      setUserData(updatedUserDataWithRewards);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserDataWithRewards));
      
      // حفظ totalRewards في قاعدة البيانات
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        try {
          const result = await databaseService.updateUser(currentUserId, {
            total_rewards: formatNumber(totalRewards)
          });
          if (result === null) {
            console.log('deleteIncentiveSlip - المستخدم غير موجود في قاعدة البيانات');
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
          } else {
            console.log('deleteIncentiveSlip - تم حفظ totalRewards في قاعدة البيانات');
          }
        } catch (error) {
          console.log('Error updating totalRewards in database:', error);
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error deleting incentive slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
      console.log('setIsSyncing(false) - deleteIncentiveSlip');
    }
  };

  const addSalarySlip = async (slip: SalaryData) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      // إنشاء قصاصة محلية مؤقتة بدون ID
      const tempSlip = { ...slip, id: undefined };
      const updatedSlips = [...salarySlips, tempSlip];
      setSalarySlips(updatedSlips);
      await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // حفظ في قاعدة البيانات إذا كان متصل
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured()) {
        try {
          const savedSlip = await databaseService.saveSalarySlip({
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
            allowance: 0, // حقل إضافي في قاعدة البيانات
            bonus: parseFloat(slip.bonus?.replace(/,/g, '') || '0'), // استخدام حقل bonus الموجود
            deductions: 0, // حقل إضافي في قاعدة البيانات
            total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0')
          });
          
          if (savedSlip === null) {
            console.log('addSalarySlip - فشل في حفظ القصاصة في قاعدة البيانات');
            databaseSuccess = false;
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
            
            // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
            const localSlip = { ...slip, id: Date.now() };
            const localUpdatedSlips = [...salarySlips, localSlip];
            setSalarySlips(localUpdatedSlips);
            await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
          } else {
            // تحديث القصاصة المحلية بالـ ID من قاعدة البيانات
            const finalSlip = { ...slip, id: savedSlip?.id || Date.now() };
            const finalUpdatedSlips = [...salarySlips, finalSlip];
            setSalarySlips(finalUpdatedSlips);
            await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(finalUpdatedSlips));
            
            console.log('addSalarySlip: created slip with database id', savedSlip?.id);
          }
        } catch (dbError) {
          console.log('Database error in addSalarySlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          
          // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
          const localSlip = { ...slip, id: Date.now() };
          const localUpdatedSlips = [...salarySlips, localSlip];
          setSalarySlips(localUpdatedSlips);
          await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
        }
      } else {
        // إذا لم يكن متصل بقاعدة البيانات، نعطي القصاصة ID محلي
        const localSlip = { ...slip, id: Date.now() };
        const localUpdatedSlips = [...salarySlips, localSlip];
        setSalarySlips(localUpdatedSlips);
        await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
      }
      
      // تحديث المكافآت بناءً على النظام الجديد
      console.log('addSalarySlip - قبل updateCurrentYearRewards');
      await updateCurrentYearRewards();
      console.log('addSalarySlip - بعد updateCurrentYearRewards');
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error adding salary slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const updateSalarySlip = async (index: number, slip: SalaryData) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      const updatedSlips = [...salarySlips];
      const existingSlip = updatedSlips[index];
      updatedSlips[index] = { ...slip, id: existingSlip?.id || Date.now() };
      setSalarySlips(updatedSlips);
      await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // تحديث في قاعدة البيانات إذا كان متصل
      console.log('updateSalarySlip: debugging', {
        currentUserId,
        isConnectedToDatabase,
        existingSlipId: existingSlip?.id,
        slipData: slip
      });
      
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured() && existingSlip?.id) {
        console.log('updateSalarySlip: updating in database', {
          slipId: existingSlip.id,
          userId: currentUserId,
          slipData: {
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
            allowance: 0,
            bonus: 0,
            deductions: 0,
            total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0')
          }
        });
        
        try {
          // محاولة التحديث مباشرة
          const result =           await databaseService.updateSalarySlip(existingSlip.id, {
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
            allowance: 0,
            bonus: parseFloat(slip.bonus?.replace(/,/g, '') || '0'),
            deductions: 0,
            total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0')
          });
          console.log('updateSalarySlip: database update result', result);
        } catch (dbError) {
          console.log('updateSalarySlip: database update failed', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          console.log('Keeping local changes only due to database error');
        }
      } else {
        console.log('updateSalarySlip: skipping database update', {
          hasCurrentUserId: !!currentUserId,
          isConnectedToDatabase,
          hasExistingSlipId: !!existingSlip?.id
        });
      }
      
      // تحديث المكافآت بناءً على النظام الجديد
      await updateCurrentYearRewards();
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error updating salary slip:', error);
      console.log('Keeping local changes only due to error');
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const deleteSalarySlip = async (index: number) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      const slipToDelete = salarySlips[index];
      const updatedSlips = salarySlips.filter((_, i) => i !== index);
      setSalarySlips(updatedSlips);
      await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // حذف من قاعدة البيانات إذا كان متصل
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured() && slipToDelete?.id) {
        try {
          await databaseService.deleteSalarySlip(slipToDelete.id);
        } catch (dbError) {
          console.log('Database error in deleteSalarySlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      // تحديث المكافآت بناءً على النظام الجديد
      // استخدام القصاصات المحدثة مباشرة بدلاً من قراءتها من AsyncStorage
      const currentYear = getCurrentFiscalYear();
      console.log(`deleteSalarySlip - السنة المالية الحالية: ${currentYear}`);
      
      // حساب المكافآت من القصاصات المحدثة
      let slipsRewards = 0;
      
      // جمع مكافآت قصاصات الحافز للسنة المحددة
      incentiveSlips.forEach((slip: any) => {
        const slipYear = slip.month?.split('/')?.[1] || '';
        if (slipYear === currentYear) {
          const rewardValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
          slipsRewards += rewardValue;
          console.log(`Incentive slip for year ${currentYear}:`, { month: slip.month, rewards: slip.rewards, rewardValue });
        }
      });
      
      // جمع مكافآت قصاصات الراتب للسنة المحددة
      updatedSlips.forEach((slip: any) => {
        const slipYear = slip.month?.split('/')?.[1] || '';
        if (slipYear === currentYear) {
          const bonusValue = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
          slipsRewards += bonusValue;
          console.log(`Salary slip for year ${currentYear}:`, { month: slip.month, bonus: slip.bonus, bonusValue });
        }
      });
      
      console.log(`deleteSalarySlip - مكافآت القصاصات: ${slipsRewards}`);
      
      // الحصول على القيمة الأساسية من التخزين المحلي
      const baseRewardsString = await AsyncStorage.getItem(BASE_REWARDS_KEY);
      const baseRewards = parseFloat(baseRewardsString || '0');
      console.log(`deleteSalarySlip - القيمة الأساسية: ${baseRewards}`);
      
      const totalRewards = baseRewards + slipsRewards;
      console.log(`deleteSalarySlip - المكافآت الكلية: ${baseRewards} + ${slipsRewards} = ${totalRewards}`);
      
      const formatNumber = (num: number) => num.toLocaleString('en-US');
      
      // تحديث totalRewards
      const updatedUserDataWithRewards = {
        ...userData,
        totalRewards: formatNumber(totalRewards)
      };
      setUserData(updatedUserDataWithRewards);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserDataWithRewards));
      
      // حفظ totalRewards في قاعدة البيانات
      if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
        try {
          const result = await databaseService.updateUser(currentUserId, {
            total_rewards: formatNumber(totalRewards)
          });
          if (result === null) {
            console.log('deleteSalarySlip - المستخدم غير موجود في قاعدة البيانات');
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
          } else {
            console.log('deleteSalarySlip - تم حفظ totalRewards في قاعدة البيانات');
          }
        } catch (error) {
          console.log('Error updating totalRewards in database:', error);
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error deleting salary slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const addProfitsSlip = async (slip: ProfitsData) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      // إنشاء قصاصة محلية مؤقتة بدون ID
      const tempSlip = { ...slip, id: undefined };
      const updatedSlips = [...profitsSlips, tempSlip];
      setProfitsSlips(updatedSlips);
      await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // حفظ في قاعدة البيانات إذا كان متصل
      if (currentUserId && isConnectedToDatabase && isSupabaseConfigured()) {
        try {
          const savedSlip = await databaseService.saveProfitsSlip({
            user_id: Number(currentUserId),
            profit_year: slip.profitYear,
            profit_period: slip.profitPeriod === '50% الأولى' ? 'first' : 'second',
            basic_profits: parseFloat(slip.profitPoints.replace(/,/g, '') || '0'),
            additional_profits: 0, // حقل إضافي في قاعدة البيانات
            deductions: 0, // حقل إضافي في قاعدة البيانات
            total_profits: parseFloat(slip.totalProfits.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
          
          if (savedSlip === null) {
            console.log('addProfitsSlip - فشل في حفظ القصاصة في قاعدة البيانات');
            databaseSuccess = false;
            setSyncError(true);
            setTimeout(() => setSyncError(false), 3000);
            
            // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
            const localSlip = { ...slip, id: Date.now() };
            const localUpdatedSlips = [...profitsSlips, localSlip];
            setProfitsSlips(localUpdatedSlips);
            await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
          } else {
            // تحديث القصاصة المحلية بالـ ID من قاعدة البيانات
            const finalSlip = { ...slip, id: savedSlip?.id || Date.now() };
            const finalUpdatedSlips = [...profitsSlips, finalSlip];
            setProfitsSlips(finalUpdatedSlips);
            await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(finalUpdatedSlips));
            
            console.log('addProfitsSlip: created slip with database id', savedSlip?.id);
          }
        } catch (dbError) {
          console.log('Database error in addProfitsSlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          
          // إذا فشل حفظ في قاعدة البيانات، نعطي القصاصة ID محلي
          const localSlip = { ...slip, id: Date.now() };
          const localUpdatedSlips = [...profitsSlips, localSlip];
          setProfitsSlips(localUpdatedSlips);
          await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
        }
      } else {
        // إذا لم يكن متصل بقاعدة البيانات، نعطي القصاصة ID محلي
        const localSlip = { ...slip, id: Date.now() };
        const localUpdatedSlips = [...profitsSlips, localSlip];
        setProfitsSlips(localUpdatedSlips);
        await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(localUpdatedSlips));
      }
      
      // تحديث المكافآت بناءً على النظام الجديد
      await updateCurrentYearRewards();
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error adding profits slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const updateProfitsSlip = async (index: number, slip: ProfitsData) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      const updatedSlips = [...profitsSlips];
      const existingSlip = updatedSlips[index];
      updatedSlips[index] = { ...slip, id: existingSlip?.id || Date.now() };
      setProfitsSlips(updatedSlips);
      await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // تحديث في قاعدة البيانات إذا كان متصل
      console.log('updateProfitsSlip: debugging', {
        currentUserId,
        isConnectedToDatabase,
        existingSlipId: existingSlip?.id,
        slipData: slip
      });
      
      if (currentUserId && isConnectedToDatabase && existingSlip?.id) {
        console.log('updateProfitsSlip: updating in database', {
          slipId: existingSlip.id,
          userId: currentUserId,
          slipData: {
            user_id: Number(currentUserId),
            profit_year: slip.profitYear,
            profit_period: slip.profitPeriod === '50% الأولى' ? 'first' : 'second',
            basic_profits: parseFloat(slip.profitPoints.replace(/,/g, '') || '0'),
            additional_profits: 0,
            deductions: 0,
            total_profits: parseFloat(slip.totalProfits.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          }
        });
        
        try {
          // محاولة التحديث مباشرة
          const result = await databaseService.updateProfitsSlip(existingSlip.id, {
            user_id: Number(currentUserId),
            profit_year: slip.profitYear,
            profit_period: slip.profitPeriod === '50% الأولى' ? 'first' : 'second',
            basic_profits: parseFloat(slip.profitPoints.replace(/,/g, '') || '0'),
            additional_profits: 0,
            deductions: 0,
            total_profits: parseFloat(slip.totalProfits.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
          console.log('updateProfitsSlip: database update result', result);
        } catch (dbError) {
          console.log('updateProfitsSlip: database operation failed', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          console.log('Keeping local changes only due to database error');
        }
      } else {
        console.log('updateProfitsSlip: skipping database update', {
          hasCurrentUserId: !!currentUserId,
          isConnectedToDatabase,
          hasExistingSlipId: !!existingSlip?.id
        });
      }
      
      // طرح القيمة القديمة وإضافة القيمة الجديدة
      await updateMainDataFromSlip(existingSlip, 'remove', 'profits', true);
      await updateMainDataFromSlip(slip, 'add', 'profits', true);
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error updating profits slip:', error);
      console.log('Keeping local changes only due to error');
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const deleteProfitsSlip = async (index: number) => {
    setManualSyncing(true);
    try {
      setIsSyncing(true);
      let databaseSuccess = true;
      
      const slipToDelete = profitsSlips[index];
      const updatedSlips = profitsSlips.filter((_, i) => i !== index);
      setProfitsSlips(updatedSlips);
      await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(updatedSlips));
      
      // حذف من قاعدة البيانات إذا كان متصل
      if (currentUserId && isConnectedToDatabase && slipToDelete?.id) {
        try {
          await databaseService.deleteProfitsSlip(slipToDelete.id);
        } catch (dbError) {
          console.log('Database error in deleteProfitsSlip:', dbError);
          databaseSuccess = false;
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        }
      }
      
      // تحديث المكافآت بناءً على النظام الجديد
      await updateCurrentYearRewards();
      
      // إظهار علامة المزامنة فقط إذا نجحت العملية في قاعدة البيانات
      if (databaseSuccess) {
        triggerSaveToast();
      }
    } catch (error) {
      console.log('Error deleting profits slip:', error);
    } finally {
      setIsSyncing(false);
      // تأخير إخفاء علامة المزامنة لإظهار رسالة "تمت المزامنة"
      setTimeout(() => {
        setManualSyncing(false);
      }, 1500);
    }
  };

  const updateMainDataFromSlip = async (slip: any, operation: 'add' | 'remove', type: 'incentive' | 'salary' | 'profits', isUpdate: boolean = false) => {
    try {
      const formatNumber = (num: number) => num.toLocaleString('en-US');
      
      console.log('updateMainDataFromSlip called:', {
        operation,
        type,
        slipValue: slip?.totalIncentive || slip?.totalSalary || slip?.totalProfits,
        currentUserData: {
          totalIncentive: userData.totalIncentive,
          totalSalary: userData.totalSalary,
          totalProfits: userData.totalProfits
        }
      });
      
      if (type === 'incentive') {
        const currentTotal = parseFloat(userData.totalIncentive?.replace(/,/g, '') || '0');
        const slipValue = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
        const newTotal = operation === 'add' ? currentTotal + slipValue : currentTotal - slipValue;
        
        console.log('Incentive calculation:', {
          currentTotal,
          slipValue,
          operation,
          newTotal: Math.max(0, newTotal)
        });
        
        // تحديث الإجازات المرضية والاعتيادية
        const currentVacationBalance = parseInt(userData.vacationBalance) || 0;
        const currentSickLeaveBalance = parseFloat(userData.sickLeaveBalance) || 0;
        const regularLeaveBonus = parseInt(userData.regularLeaveBonus) || 3;
        const sickLeaveBonus = parseFloat(userData.sickLeaveBonus) || 2.5;
        
        const regularLeaveValue = parseInt(slip.regularLeave) || 0;
        const sickLeaveValue = parseInt(slip.sickLeave) || 0;
        
        let vacationImpact = 0;
        let sickLeaveImpact = 0;
        
        if (operation === 'add') {
          // عند الإضافة
          if (regularLeaveValue === 0) {
            // إذا كانت القصاصة فارغة، نضيف مكافأة الإجازات
            vacationImpact = regularLeaveBonus;
          } else {
            // إذا كانت القصاصة تحتوي على رقم، نطرح الرقم ونضيف مكافأة الإجازات
            vacationImpact = regularLeaveBonus - regularLeaveValue;
          }
          
          if (sickLeaveValue === 0) {
            // إذا كانت القصاصة فارغة، نضيف مكافأة الإجازات
            sickLeaveImpact = sickLeaveBonus;
          } else {
            // إذا كانت القصاصة تحتوي على رقم، نطرح الرقم ونضيف مكافأة الإجازات
            sickLeaveImpact = sickLeaveBonus - sickLeaveValue;
          }
        } else {
          // عند الحذف - عكس العملية
          if (regularLeaveValue === 0) {
            // إذا كانت القصاصة فارغة، نطرح مكافأة الإجازات التي تمت إضافتها
            vacationImpact = -regularLeaveBonus;
          } else {
            // إذا كانت القصاصة تحتوي على رقم، نضيف الرقم ونطرح مكافأة الإجازات
            vacationImpact = regularLeaveValue - regularLeaveBonus;
          }
          
          if (sickLeaveValue === 0) {
            // إذا كانت القصاصة فارغة، نطرح مكافأة الإجازات التي تمت إضافتها
            sickLeaveImpact = -sickLeaveBonus;
          } else {
            // إذا كانت القصاصة تحتوي على رقم، نضيف الرقم ونطرح مكافأة الإجازات
            sickLeaveImpact = sickLeaveValue - sickLeaveBonus;
          }
        }
        
        const newVacationBalance = Math.max(0, currentVacationBalance + vacationImpact);
        const newSickLeaveBalance = Math.max(0, currentSickLeaveBalance + sickLeaveImpact);
        
        console.log('Leave balance calculation:', {
          currentVacationBalance,
          currentSickLeaveBalance,
          regularLeaveValue,
          sickLeaveValue,
          vacationImpact,
          sickLeaveImpact,
          newVacationBalance,
          newSickLeaveBalance,
          operation
        });
        
        // تحديث المكافآت من قصاصات الحافز
        let currentRewards = parseFloat(userData.totalRewards?.replace(/,/g, '') || '0');
        // استخراج الشهر من slip.month
        const slipMonth = slip.month?.split('/')?.[0] || '';
        
        // تصفير المكافآت فقط عند إضافة قصاصة جديدة لشهر 1، وليس عند التحديث
        // عند التحديث، لا نفرض تصفير المكافآت حتى لو كانت القصاصة لشهر 1
        if ((slipMonth === '1' || slipMonth === '01') && operation === 'add' && !isUpdate) {
          currentRewards = 0;
        }
        
        const slipRewards = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
        let newRewards;
        if (operation === 'add') {
          newRewards = currentRewards + slipRewards;
        } else if (operation === 'remove') {
          newRewards = currentRewards - slipRewards;
        } else {
          newRewards = currentRewards;
        }
        
        console.log('Incentive rewards calculation:', {
          currentRewards,
          slipRewards,
          operation,
          newRewards: Math.max(0, newRewards)
        });
        
        // تحديث مباشر للـ state
        setUserData(prev => ({
          ...prev,
          totalIncentive: formatNumber(Math.max(0, newTotal)),
          totalRewards: formatNumber(Math.max(0, Math.round(newRewards))),
          vacationBalance: newVacationBalance.toString(),
          sickLeaveBalance: newSickLeaveBalance.toString()
        }));
        
        // حفظ في التخزين المحلي
        const newUserData = { 
          ...userData, 
          totalIncentive: formatNumber(Math.max(0, newTotal)),
          totalRewards: formatNumber(Math.max(0, Math.round(newRewards))),
          vacationBalance: newVacationBalance.toString(),
          sickLeaveBalance: newSickLeaveBalance.toString()
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
        
      } else if (type === 'salary') {
        const currentTotal = parseFloat(userData.totalSalary?.replace(/,/g, '') || '0');
        const slipValue = parseFloat(slip.totalSalary?.replace(/,/g, '') || '0');
        const newTotal = operation === 'add' ? currentTotal + slipValue : currentTotal - slipValue;
        
        console.log('Salary calculation:', {
          currentTotal,
          slipValue,
          operation,
          newTotal: Math.max(0, newTotal)
        });
        
        // تحديث مباشر للـ state
        setUserData(prev => ({
          ...prev,
          totalSalary: formatNumber(Math.max(0, newTotal))
        }));
        
        // حفظ في التخزين المحلي
        const newUserData = { ...userData, totalSalary: formatNumber(Math.max(0, newTotal)) };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
        
        // تحديث المكافآت من قصاصات الراتب
        const currentRewards = parseFloat(userData.totalRewards?.replace(/,/g, '') || '0');
        const slipBonus = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
        const newRewards = operation === 'add' ? currentRewards + slipBonus : currentRewards - slipBonus;
        
        console.log('Salary bonus calculation:', {
          currentRewards,
          slipBonus,
          operation,
          newRewards: Math.max(0, newRewards)
        });
        
        // تحديث المكافآت
        setUserData(prev => ({
          ...prev,
          totalRewards: formatNumber(Math.max(0, newRewards))
        }));
        
        // حفظ المكافآت في التخزين المحلي
        const updatedUserData = { ...newUserData, totalRewards: formatNumber(Math.max(0, newRewards)) };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
        
      } else if (type === 'profits') {
        const currentTotal = parseFloat(userData.totalProfits?.replace(/,/g, '') || '0');
        const slipValue = parseFloat(slip.totalProfits?.replace(/,/g, '') || '0');
        const newTotal = operation === 'add' ? currentTotal + slipValue : currentTotal - slipValue;
        
        console.log('Profits calculation:', {
          currentTotal,
          slipValue,
          operation,
          newTotal: Math.max(0, newTotal)
        });
        
        // تحديث مباشر للـ state
        setUserData(prev => ({
          ...prev,
          totalProfits: formatNumber(Math.max(0, newTotal))
        }));
        
        // حفظ في التخزين المحلي
        const newUserData = { ...userData, totalProfits: formatNumber(Math.max(0, newTotal)) };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
      }
      
      console.log('updateMainDataFromSlip completed successfully');
    } catch (error) {
      console.log('Error updating main data from slip:', error);
    }
  };

  const updateCourseCompletion = async (index: number, completed: boolean) => {
    try {
      const newCoursesCompleted = [...userData.coursesCompleted];
      newCoursesCompleted[index] = completed;
      
      await updateUserData({
        coursesCompleted: newCoursesCompleted
      });
    } catch (error) {
      console.log('Error updating course completion:', error);
    }
  };

  const triggerSaveToast = (customMessage?: string) => {
    if (customMessage) {
      setToastMessage(customMessage);
    } else {
      setToastMessage('تم حفظ التغييرات بنجاح! ✅');
    }
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 2000);
  };

  // دالة مساعدة لفحص حالة البيانات
  const debugUserData = () => {
    console.log('=== DEBUG USER DATA ===');
    console.log('userData:', userData);
    console.log('incentiveSlips:', incentiveSlips);
    console.log('salarySlips:', salarySlips);
    console.log('profitsSlips:', profitsSlips);
    console.log('=== END DEBUG ===');
  };

  // دالة اختبار لفحص المشكلة
  const testIncentiveSlipOperations = async () => {
    console.log('=== TESTING INCENTIVE SLIP OPERATIONS ===');
    
    // اختبار إضافة قصاصة
    const testSlip: IncentiveData = {
      points: '1000',
      rating: 'متوسط',
      regularLeave: '0',
      sickLeave: '0',
      rewards: '500',
      totalIncentive: '1500',
      month: '01/2024'
    };
    
    console.log('Testing addIncentiveSlip...');
    await addIncentiveSlip(testSlip);
    
    console.log('Testing updateIncentiveSlip...');
    if (incentiveSlips.length > 0) {
      const updatedSlip = { ...testSlip, totalIncentive: '2000' };
      await updateIncentiveSlip(0, updatedSlip);
    }
    
    console.log('Testing deleteIncentiveSlip...');
    if (incentiveSlips.length > 0) {
      await deleteIncentiveSlip(0);
    }
    
    console.log('=== TEST COMPLETED ===');
  };

  // دالة اختبار بسيطة لفحص updateMainDataFromSlip
  const testUpdateMainDataFromSlip = async () => {
    console.log('=== TESTING updateMainDataFromSlip ===');
    
    const testSlip = {
      totalIncentive: '1000'
    };
    
    console.log('Before updateMainDataFromSlip - totalIncentive:', userData.totalIncentive);
    await updateMainDataFromSlip(testSlip, 'add', 'incentive');
    console.log('After updateMainDataFromSlip - totalIncentive:', userData.totalIncentive);
    
    console.log('=== TEST COMPLETED ===');
  };

  // دالة لفحص المشكلة بشكل تفصيلي
  const debugIncentiveProblem = async () => {
    console.log('=== DEBUGGING INCENTIVE PROBLEM ===');
    
    // فحص الحالة الحالية
    console.log('Current state:');
    console.log('- totalIncentive:', userData.totalIncentive);
    console.log('- incentiveSlips count:', incentiveSlips.length);
    console.log('- incentiveSlips:', incentiveSlips);
    
    // حساب المجموع اليدوي
    const manualTotal = incentiveSlips.reduce((total, slip) => {
      const slipValue = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
      return total + slipValue;
    }, 0);
    
    console.log('Manual calculation of totalIncentive:', manualTotal);
    console.log('Difference:', parseFloat(userData.totalIncentive?.replace(/,/g, '') || '0') - manualTotal);
    
    console.log('=== DEBUG COMPLETED ===');
  };

  // دالة لفحص مشكلة المكافآت
  const debugRewardsProblem = async () => {
    console.log('=== DEBUGGING REWARDS PROBLEM ===');
    
    // فحص الحالة الحالية
    console.log('Current state:');
    console.log('- totalRewards:', userData.totalRewards);
    console.log('- incentiveSlips count:', incentiveSlips.length);
    console.log('- incentiveSlips:', incentiveSlips);
    
    // حساب المجموع اليدوي للمكافآت
    const manualRewardsTotal = incentiveSlips.reduce((total, slip) => {
      const slipRewards = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
      return total + slipRewards;
    }, 0);
    
    console.log('Manual calculation of totalRewards from slips:', manualRewardsTotal);
    console.log('Current totalRewards:', userData.totalRewards);
    console.log('Difference:', parseFloat(userData.totalRewards?.replace(/,/g, '') || '0') - manualRewardsTotal);
    
    console.log('=== DEBUG COMPLETED ===');
  };

  // دالة لتصحيح المشكلة تلقائياً
  const fixIncentiveTotal = async () => {
    console.log('=== FIXING INCENTIVE TOTAL ===');
    
    // حساب المجموع الصحيح من القصاصات
    const correctTotal = incentiveSlips.reduce((total, slip) => {
      const slipValue = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
      return total + slipValue;
    }, 0);
    
    console.log('Correct totalIncentive should be:', correctTotal);
    console.log('Current totalIncentive is:', userData.totalIncentive);
    
    // تحديث القيمة الصحيحة مباشرة
    setUserData(prev => ({
      ...prev,
      totalIncentive: correctTotal.toLocaleString('en-US')
    }));
    
    // حفظ في التخزين المحلي
    const newUserData = { ...userData, totalIncentive: correctTotal.toLocaleString('en-US') };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
    
    console.log('Fixed totalIncentive to:', correctTotal.toLocaleString('en-US'));
    console.log('=== FIX COMPLETED ===');
  };

  // دالة لتصحيح المكافآت تلقائياً
  const fixRewardsTotal = async () => {
    console.log('=== FIXING REWARDS TOTAL ===');
    
    // حساب المجموع الصحيح من القصاصات
    const correctRewardsTotal = incentiveSlips.reduce((total, slip) => {
      const slipRewards = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
      return total + slipRewards;
    }, 0);
    
    console.log('Correct totalRewards should be:', correctRewardsTotal);
    console.log('Current totalRewards is:', userData.totalRewards);
    
    // تحديث القيمة الصحيحة مباشرة
    setUserData(prev => ({
      ...prev,
      totalRewards: correctRewardsTotal.toLocaleString('en-US')
    }));
    
    // حفظ في التخزين المحلي
    const newUserData = { ...userData, totalRewards: correctRewardsTotal.toLocaleString('en-US') };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
    
    console.log('Fixed totalRewards to:', correctRewardsTotal.toLocaleString('en-US'));
    console.log('=== FIX COMPLETED ===');
  };

  // دالة جديدة لاختبار المشكلة بشكل مباشر
  const testDirectIncentiveUpdate = async () => {
    console.log('=== TESTING DIRECT INCENTIVE UPDATE ===');
    
    // اختبار إضافة قيمة مباشرة
    const testValue = 1000;
    const currentTotal = parseFloat(userData.totalIncentive?.replace(/,/g, '') || '0');
    const newTotal = currentTotal + testValue;
    
    console.log('Before update - totalIncentive:', userData.totalIncentive);
    console.log('Adding:', testValue);
    console.log('New total should be:', newTotal);
    
    // تحديث مباشر
    setUserData(prev => ({
      ...prev,
      totalIncentive: newTotal.toLocaleString('en-US')
    }));
    
    // حفظ في التخزين المحلي
    const newUserData = { ...userData, totalIncentive: newTotal.toLocaleString('en-US') };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUserData));
    
    console.log('After update - totalIncentive should be:', newTotal.toLocaleString('en-US'));
    console.log('=== TEST COMPLETED ===');
  };

  const calculateServiceDuration = (startDate: string) => {
    if (!startDate) {
      return 'غير محدد';
    }

    const [day, month, year] = startDate.split('/');
    const start = new Date(`${year}-${month}-${day}`);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const totalSeconds = Math.floor(diff / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    
    const years = Math.floor(totalDays / 365.25);
    const remainingDaysAfterYears = totalDays - Math.floor(years * 365.25);
    const months = Math.floor(remainingDaysAfterYears / 30.44);
    const days = Math.floor(remainingDaysAfterYears - (months * 30.44));
    
    const hours = totalHours % 24;
    const minutes = totalMinutes % 60;
    const seconds = totalSeconds % 60;
    
    let result = '';
    
    if (years > 0) {
      result += `${years} سنة`;
    }
    
    if (months > 0) {
      if (result) result += '، ';
      result += `${months} شهر`;
    }
    
    if (days > 0) {
      if (result) result += '، ';
      result += `${days} يوم`;
    }
    
    const timeString = `${hours.toString().padStart(2, '0')}س:${minutes.toString().padStart(2, '0')}د:${seconds.toString().padStart(2, '0')}ث`;
    
    if (result) {
      result += `، ${timeString}`;
    } else {
      result = timeString;
    }
    
    return result || '00س:00د:00ث';
  };

  const calculateServiceDays = (startDate: string) => {
    if (!startDate) {
      return 0;
    }

    const [day, month, year] = startDate.split('/');
    const start = new Date(`${year}-${month}-${day}`);
    return Math.floor((new Date().getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  };

  const getCurrentFiscalYear = () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // من 1 فبراير إلى 31 يناير = نفس السنة المالية
    if (currentMonth >= 2) {
      return currentYear.toString();
    } else {
      return (currentYear - 1).toString();
    }
  };

  // دالة جديدة لحساب مكافآت سنة معينة من القصاصات
  const calculateRewardsForYear = (year: string) => {
    let totalRewards = 0;
    
    console.log(`calculateRewardsForYear - بداية الحساب للسنة ${year}`);
    console.log(`عدد قصاصات الحافز: ${incentiveSlips.length}`);
    console.log(`عدد قصاصات الراتب: ${salarySlips.length}`);
    
    // جمع مكافآت قصاصات الحافز للسنة المحددة
    incentiveSlips.forEach((slip, index) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      console.log(`قصاصة حافز ${index}:`, { month: slip.month, slipYear, rewards: slip.rewards });
      if (slipYear === year) {
        const rewardValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
        totalRewards += rewardValue;
        console.log(`Incentive slip for year ${year}:`, { month: slip.month, rewards: slip.rewards, rewardValue });
      }
    });
    
    // جمع مكافآت قصاصات الراتب للسنة المحددة
    salarySlips.forEach((slip, index) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      console.log(`قصاصة راتب ${index}:`, { month: slip.month, slipYear, bonus: slip.bonus });
      if (slipYear === year) {
        const bonusValue = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
        totalRewards += bonusValue;
        console.log(`Salary slip for year ${year}:`, { month: slip.month, bonus: slip.bonus, bonusValue });
      }
    });
    
    console.log(`Total rewards for year ${year}:`, totalRewards);
    return totalRewards;
  };

  // دالة جديدة لتحديث مكافآت السنة الحالية
  const updateCurrentYearRewards = async () => {
    console.log('updateCurrentYearRewards - بداية الدالة المحدثة');
    
    // قراءة الأرصدة من التخزين المحلي بدلاً من React state
    const storedUserData = await AsyncStorage.getItem(STORAGE_KEY);
    const currentUserData = storedUserData ? JSON.parse(storedUserData) : userData;
    
    console.log('updateCurrentYearRewards - الأرصدة من التخزين المحلي:', {
      vacationBalance: currentUserData.vacationBalance,
      sickLeaveBalance: currentUserData.sickLeaveBalance
    });
    
    const currentYear = getCurrentFiscalYear();
    console.log(`updateCurrentYearRewards - السنة المالية الحالية: ${currentYear}`);
    
    // قراءة القصاصات من التخزين مباشرة لضمان الدقة
    const storedIncentiveSlips = await AsyncStorage.getItem(INCENTIVE_SLIPS_KEY);
    const storedSalarySlips = await AsyncStorage.getItem(SALARY_SLIPS_KEY);
    const currentIncentiveSlips = storedIncentiveSlips ? JSON.parse(storedIncentiveSlips) : [];
    const currentSalarySlips = storedSalarySlips ? JSON.parse(storedSalarySlips) : [];
    
    console.log(`updateCurrentYearRewards - عدد قصاصات الحافز من التخزين: ${currentIncentiveSlips.length}`);
    console.log(`updateCurrentYearRewards - عدد قصاصات الراتب من التخزين: ${currentSalarySlips.length}`);
    
    // حساب المكافآت من القصاصات المخزنة
    let slipsRewards = 0;
    
    // جمع مكافآت قصاصات الحافز للسنة المحددة
    currentIncentiveSlips.forEach((slip: any, index: number) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      if (slipYear === currentYear) {
        const rewardValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
        slipsRewards += rewardValue;
        console.log(`Incentive slip from storage for year ${currentYear}:`, { month: slip.month, rewards: slip.rewards, rewardValue });
      }
    });
    
    // جمع مكافآت قصاصات الراتب للسنة المحددة
    currentSalarySlips.forEach((slip: any, index: number) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      if (slipYear === currentYear) {
        const bonusValue = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
        slipsRewards += bonusValue;
        console.log(`Salary slip from storage for year ${currentYear}:`, { month: slip.month, bonus: slip.bonus, bonusValue });
      }
    });
    
    console.log(`updateCurrentYearRewards - مكافآت القصاصات من التخزين: ${slipsRewards}`);
    
    // الحصول على القيمة الأساسية من التخزين المحلي
    const baseRewardsString = await AsyncStorage.getItem(BASE_REWARDS_KEY);
    const baseRewards = parseFloat(baseRewardsString || '0');
    console.log(`updateCurrentYearRewards - القيمة الأساسية: ${baseRewards} (من التخزين: ${baseRewardsString})`);
    console.log(`updateCurrentYearRewards - userData.totalRewards الحالي: ${userData.totalRewards}`);
    console.log(`updateCurrentYearRewards - currentUserData.totalRewards: ${currentUserData.totalRewards}`);
    
    const totalRewards = baseRewards + slipsRewards;
    console.log(`updateCurrentYearRewards - المكافآت الكلية: ${baseRewards} + ${slipsRewards} = ${totalRewards}`);
    
    const formatNumber = (num: number) => num.toLocaleString('en-US');
    
    // تحديث totalRewards فقط دون التأثير على الأرصدة
    const updatedUserData = { ...currentUserData, totalRewards: formatNumber(totalRewards) };
    setUserData(updatedUserData);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedUserData));
    
    // حفظ totalRewards فقط في قاعدة البيانات
    if (isConnectedToDatabase && currentUserId && isSupabaseConfigured()) {
      try {
        const result = await databaseService.updateUser(currentUserId, {
          total_rewards: formatNumber(totalRewards)
        });
        if (result === null) {
          console.log('updateCurrentYearRewards - المستخدم غير موجود في قاعدة البيانات');
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
        } else {
          console.log('updateCurrentYearRewards - تم حفظ totalRewards في قاعدة البيانات');
        }
      } catch (error) {
        console.log('Error updating totalRewards in database:', error);
        setSyncError(true);
        setTimeout(() => setSyncError(false), 3000);
      }
    }

    console.log('updateCurrentYearRewards - الأرصدة بعد التحديث:', {
      vacationBalance: updatedUserData.vacationBalance,
      sickLeaveBalance: updatedUserData.sickLeaveBalance
    });

    console.log('updateCurrentYearRewards:', {
      currentYear,
      baseRewardsString,
      baseRewards,
      slipsRewards,
      totalRewards: formatNumber(totalRewards),
      allIncentiveSlips: currentIncentiveSlips.length,
      allSalarySlips: currentSalarySlips.length
    });
  };

  // دالة جديدة لتحديث المكافآت الأساسية فقط (من الإعدادات)
  const updateBaseRewards = async (newBaseRewards: string) => {
    console.log('updateBaseRewards - بداية الدالة:', { newBaseRewards });
    
    const cleanValue = newBaseRewards.replace(/,/g, '');
    const newTotalRewards = parseFloat(cleanValue) || 0;
    console.log('updateBaseRewards - المكافآت الكلية الجديدة:', { cleanValue, newTotalRewards });
    
    // حساب القصاصات الموجودة
    const currentYear = getCurrentFiscalYear();
    const storedIncentiveSlips = await AsyncStorage.getItem(INCENTIVE_SLIPS_KEY);
    const storedSalarySlips = await AsyncStorage.getItem(SALARY_SLIPS_KEY);
    const currentIncentiveSlips = storedIncentiveSlips ? JSON.parse(storedIncentiveSlips) : [];
    const currentSalarySlips = storedSalarySlips ? JSON.parse(storedSalarySlips) : [];
    
    let existingSlipsRewards = 0;
    
    // جمع مكافآت قصاصات الحافز للسنة الحالية
    currentIncentiveSlips.forEach((slip: any) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      if (slipYear === currentYear) {
        const rewardValue = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
        existingSlipsRewards += rewardValue;
      }
    });
    
    // جمع مكافآت قصاصات الراتب للسنة الحالية
    currentSalarySlips.forEach((slip: any) => {
      const slipYear = slip.month?.split('/')?.[1] || '';
      if (slipYear === currentYear) {
        const bonusValue = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
        existingSlipsRewards += bonusValue;
      }
    });
    
    console.log('updateBaseRewards - القصاصات الموجودة:', { existingSlipsRewards });
    
    // حساب القيمة الأساسية = المكافآت الكلية الجديدة - القصاصات الموجودة
    const baseRewards = newTotalRewards - existingSlipsRewards;
    console.log('updateBaseRewards - القيمة الأساسية المحسوبة:', { baseRewards });
    
    // حفظ القيمة الأساسية في التخزين المحلي
    await AsyncStorage.setItem(BASE_REWARDS_KEY, baseRewards.toString());
    console.log('updateBaseRewards - تم حفظ القيمة الأساسية في التخزين المحلي');
    
    // التحقق من أن القيمة تم حفظها بشكل صحيح
    const savedValue = await AsyncStorage.getItem(BASE_REWARDS_KEY);
    console.log('updateBaseRewards - Saved value check:', {
      savedValue,
      expectedValue: baseRewards.toString()
    });
    
    // تحديث المكافآت الكلية بناءً على القيمة الأساسية الجديدة + القصاصات الموجودة
    await updateCurrentYearRewards();
    
    console.log('updateBaseRewards - تم استدعاء updateCurrentYearRewards');
  };

  const checkAndResetRewards = async () => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const currentYear = now.getFullYear();
    
    // التحقق من تغيير السنة المالية (1 فبراير)
    if (currentMonth === 2 && currentDay === 1) {
      const lastResetDate = userData.lastRewardsResetDate;
      const currentResetDate = `01/02/${currentYear}`;
      
      if (lastResetDate !== currentResetDate) {
        // تصفير القيمة الأساسية للمكافآت
        await AsyncStorage.setItem(BASE_REWARDS_KEY, '0');
        
        // تحديث تاريخ التصفير
        await updateUserData({
          lastRewardsResetDate: currentResetDate
        });
        
        // تحديث المكافآت بناءً على قصاصات السنة الجديدة
        await updateCurrentYearRewards();
        
        console.log('تم تصفير المكافآت للسنة المالية الجديدة');
      }
    }

    // التحقق من تاريخ العلاوة القادمة
    await checkAndUpdateAllowanceDate();
    
    // التحقق من تاريخ الترقية القادمة
    await checkAndUpdatePromotionDate();
  };

  // دالة للتحقق من تاريخ العلاوة وتحديثه
  const checkAndUpdateAllowanceDate = async () => {
    if (!userData.nextAllowanceDate) return;

    try {
      const [day, month, year] = userData.nextAllowanceDate.split('/').map(Number);
      const allowanceDate = new Date(year, month - 1, day);
      const today = new Date();
      
      // إزالة الوقت من التواريخ للمقارنة
      today.setHours(0, 0, 0, 0);
      allowanceDate.setHours(0, 0, 0, 0);
      
      // التحقق من وصول تاريخ العلاوة
      if (today.getTime() >= allowanceDate.getTime()) {
        // تمديد تاريخ العلاوة بمقدار سنة واحدة
        const newYear = year + 1;
        const newAllowanceDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${newYear}`;
        
        // زيادة المرحلة بمقدار 1
        let newStage = parseInt(userData.stage || '1') + 1;
        if (newStage > 4) {
          newStage = 1; // إذا كانت المرحلة 4، ترجع إلى 1
        }
        
        await updateUserData({
          nextAllowanceDate: newAllowanceDate,
          stage: newStage.toString()
        });
        
        console.log(`تم تحديث تاريخ العلاوة إلى ${newAllowanceDate} والمرحلة إلى ${newStage}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث تاريخ العلاوة:', error);
    }
  };

  // دالة للتحقق من تاريخ الترقية وتحديثه
  const checkAndUpdatePromotionDate = async () => {
    if (!userData.nextPromotionDate) return;

    try {
      const [day, month, year] = userData.nextPromotionDate.split('/').map(Number);
      const promotionDate = new Date(year, month - 1, day);
      const today = new Date();
      
      // إزالة الوقت من التواريخ للمقارنة
      today.setHours(0, 0, 0, 0);
      promotionDate.setHours(0, 0, 0, 0);
      
      // التحقق من وصول تاريخ الترقية
      if (today.getTime() >= promotionDate.getTime()) {
        // تمديد تاريخ الترقية بمقدار 4 سنوات
        const newYear = year + 4;
        const newPromotionDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${newYear}`;
        
        // تقليل الدرجة بمقدار 1
        let newGrade = parseInt(userData.grade || '10') - 1;
        if (newGrade < 1) {
          newGrade = 1; // الدرجة لا تقل عن 1
        }
        
        await updateUserData({
          nextPromotionDate: newPromotionDate,
          grade: newGrade.toString()
        });
        
        console.log(`تم تحديث تاريخ الترقية إلى ${newPromotionDate} والدرجة إلى ${newGrade}`);
      }
    } catch (error) {
      console.error('خطأ في تحديث تاريخ الترقية:', error);
    }
  };

  // دوال ربط قاعدة البيانات
  const linkToDatabase = async (computerId: string, password: string) => {
    try {
      setIsSyncing(true);
      console.log('Linking to database with:', { computerId, password });
      
      // التحقق من وجود Supabase
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.' };
      }
      
      // التحقق من وجود المستخدم
      const existingUser = await databaseService.checkUserExists(computerId);
      
      if (existingUser) {
        // التحقق من كلمة السر
        const isPasswordCorrect = await databaseService.checkPassword(computerId, password);
        
        if (!isPasswordCorrect) {
          return { success: false, message: 'كلمة السر غير صحيحة' };
        }
        
        // ربط الحساب الموجود
        const linkedUser = await databaseService.linkToExistingAccount(computerId);
        
        if (linkedUser) {
          setCurrentUserId(linkedUser.id.toString());
          await AsyncStorage.setItem(USER_ID_KEY, linkedUser.id.toString());
          setIsConnectedToDatabase(true);
          await AsyncStorage.setItem(IS_CONNECTED_KEY, 'true');
          
          // تحميل البيانات من قاعدة البيانات
          await loadFromDatabase();
          
          // تنظيف البيانات المحلية
          await cleanupLocalData();
          
          console.log('Successfully linked to existing account:', linkedUser);
          return { success: true, message: 'تم ربط الحساب بنجاح' };
        } else {
          return { success: false, message: 'فشل في ربط الحساب' };
        }
      } else {
        // إنشاء حساب جديد
        const newUser = await databaseService.createUser(computerId);
        
        if (newUser) {
          setCurrentUserId(newUser.id.toString());
          await AsyncStorage.setItem(USER_ID_KEY, newUser.id.toString());
          setIsConnectedToDatabase(true);
          await AsyncStorage.setItem(IS_CONNECTED_KEY, 'true');
          
          // حفظ البيانات المحلية في قاعدة البيانات
          await saveToDatabase();
          
          console.log('Successfully created new account:', newUser);
          return { success: true, message: 'تم إنشاء الحساب بنجاح' };
        } else {
          return { success: false, message: 'فشل في إنشاء الحساب' };
        }
      }
    } catch (error) {
      console.log('Error linking to database:', error);
      return { success: false, message: 'حدث خطأ أثناء ربط الحساب' };
    } finally {
      setIsSyncing(false);
    }
  };

  const logoutFromDatabase = async () => {
    try {
      setIsSyncing(true);
      setCurrentUserId(null);
      setIsConnectedToDatabase(false);
      setIncentiveSlips([]);
      setSalarySlips([]);
      setProfitsSlips([]);
      setUserData(defaultUserData);
      await AsyncStorage.removeItem(USER_ID_KEY);
      await AsyncStorage.removeItem(INCENTIVE_SLIPS_KEY);
      await AsyncStorage.removeItem(SALARY_SLIPS_KEY);
      await AsyncStorage.removeItem(PROFITS_SLIPS_KEY);
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(BASE_REWARDS_KEY);
      triggerSaveToast();
      // إعادة تهيئة التطبيق بعد تسجيل الخروج
      setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.reload();
        } else if (router && router.replace) {
          router.replace('/');
        }
      }, 500);
      return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    } catch (error) {
      console.log('Error logging out:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل الخروج' };
    } finally {
      setIsSyncing(false);
    }
  };

  const syncToDatabase = async () => {
    try {
      setIsSyncing(true);
      
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.' };
      }
      
      if (!currentUserId || !isConnectedToDatabase) {
        return { success: false, message: 'التطبيق غير مرتبط بقاعدة البيانات' };
      }
      
      // تحميل البيانات من قاعدة البيانات
      await loadFromDatabase();
      
      triggerSaveToast();
      return { success: true, message: 'تم تحميل البيانات من قاعدة البيانات بنجاح' };
    } catch (error) {
      console.log('Error syncing to database:', error);
      return { success: false, message: 'حدث خطأ أثناء تحميل البيانات' };
    } finally {
      setIsSyncing(false);
    }
  };

  const saveToDatabase = async () => {
    try {
      setIsSyncing(true);
      
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.' };
      }
      
      if (!currentUserId || !isConnectedToDatabase) {
        return { success: false, message: 'التطبيق غير مرتبط بقاعدة البيانات' };
      }
      
      // حفظ قصاصات الحافز المحلية في قاعدة البيانات
      for (const slip of incentiveSlips) {
        if (!slip.id) {
          await databaseService.saveIncentiveSlip({
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.points.replace(/,/g, '') || '0'),
            allowance: parseFloat(slip.regularLeave.replace(/,/g, '') || '0'),
            bonus: parseFloat(slip.rewards.replace(/,/g, '') || '0'),
            deductions: parseFloat(slip.sickLeave.replace(/,/g, '') || '0'),
            total_incentive: parseFloat(slip.totalIncentive.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
        }
      }
      
      // حفظ قصاصات الراتب المحلية في قاعدة البيانات
      for (const slip of salarySlips) {
        if (!slip.id) {
          await databaseService.saveSalarySlip({
            user_id: Number(currentUserId),
            month: slip.month,
            basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
            allowance: 0,
            bonus: parseFloat(slip.bonus?.replace(/,/g, '') || '0'),
            deductions: 0,
            total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0')
          });
        }
      }
      
      // حفظ قصاصات الأرباح المحلية في قاعدة البيانات
      for (const slip of profitsSlips) {
        if (!slip.id) {
          await databaseService.saveProfitsSlip({
            user_id: Number(currentUserId),
            profit_year: slip.profitYear,
            profit_period: slip.profitPeriod === '50% الأولى' ? 'first' : 'second',
            basic_profits: parseFloat(slip.profitPoints.replace(/,/g, '') || '0'),
            additional_profits: 0,
            deductions: 0,
            total_profits: parseFloat(slip.totalProfits.replace(/,/g, '') || '0'),
            rating: slip.rating || 'متوسط'
          });
        }
      }
      
      // حفظ بيانات المستخدم في قاعدة البيانات
      try {
        const result = await databaseService.updateUser(currentUserId, {
          name: userData.name,
          computer_id: userData.computerId,
          vacation_balance: userData.vacationBalance,
          sick_leave_balance: userData.sickLeaveBalance,
          next_promotion_date: userData.nextPromotionDate,
          next_allowance_date: userData.nextAllowanceDate,
          total_rewards: userData.totalRewards,
          start_date: userData.startDate,
          total_incentive: userData.totalIncentive,
          total_salary: userData.totalSalary,
          total_profits: userData.totalProfits,
          last_rewards_reset_date: userData.lastRewardsResetDate,
          regular_leave_bonus: userData.regularLeaveBonus,
          sick_leave_bonus: userData.sickLeaveBonus,
          grade: userData.grade,
          stage: userData.stage,
          courses_names: userData.coursesNames,
          courses_completed: userData.coursesCompleted
        });
        if (result === null) {
          console.log('saveToDatabase - المستخدم غير موجود في قاعدة البيانات');
          setSyncError(true);
          setTimeout(() => setSyncError(false), 3000);
          throw new Error('User not found in database');
        }
      } catch (error) {
        console.log('Error saving user data to database:', error);
        setSyncError(true);
        setTimeout(() => setSyncError(false), 3000);
        throw error;
      }
      
      triggerSaveToast();
      return { success: true, message: 'تم حفظ البيانات في قاعدة البيانات بنجاح' };
    } catch (error) {
      console.log('Error saving to database:', error);
      return { success: false, message: 'حدث خطأ أثناء حفظ البيانات' };
    } finally {
      setIsSyncing(false);
    }
  };

  const cleanupLocalData = async () => {
    try {
      console.log('Starting local data cleanup...');
      
      if (!currentUserId || !isConnectedToDatabase) {
        console.log('Skipping cleanup - not connected to database');
        return;
      }
      
      // جلب البيانات من قاعدة البيانات
      const dbIncentiveSlips = await databaseService.getIncentiveSlips(currentUserId);
      const dbSalarySlips = await databaseService.getSalarySlips(currentUserId);
      const dbProfitsSlips = await databaseService.getProfitsSlips(currentUserId);
      
      // تنظيف قصاصات الحوافز - حماية القصاصات المحلية الجديدة
      const validIncentiveIds = dbIncentiveSlips.map(slip => slip.id);
      const cleanedIncentiveSlips = incentiveSlips.filter(slip => {
        // إذا لم يكن للقصاصة ID، فهي قصاصة محلية جديدة - نحتفظ بها
        if (!slip.id) {
          console.log('Keeping local incentive slip without ID:', slip);
          return true;
        }
        // إذا كان للقصاصة ID، نتأكد من وجودها في قاعدة البيانات
        const existsInDB = validIncentiveIds.includes(slip.id);
        if (!existsInDB) {
          console.log('Removing incentive slip not found in database:', slip);
        }
        return existsInDB;
      });
      
      if (cleanedIncentiveSlips.length !== incentiveSlips.length) {
        console.log(`Cleaned incentive slips: ${incentiveSlips.length} -> ${cleanedIncentiveSlips.length}`);
        setIncentiveSlips(cleanedIncentiveSlips);
        await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(cleanedIncentiveSlips));
      }
      
      // تنظيف قصاصات الراتب - حماية القصاصات المحلية الجديدة
      const validSalaryIds = dbSalarySlips.map(slip => slip.id);
      const cleanedSalarySlips = salarySlips.filter(slip => {
        // إذا لم يكن للقصاصة ID، فهي قصاصة محلية جديدة - نحتفظ بها
        if (!slip.id) {
          console.log('Keeping local salary slip without ID:', slip);
          return true;
        }
        // إذا كان للقصاصة ID، نتأكد من وجودها في قاعدة البيانات
        const existsInDB = validSalaryIds.includes(slip.id);
        if (!existsInDB) {
          console.log('Removing salary slip not found in database:', slip);
        }
        return existsInDB;
      });
      
      if (cleanedSalarySlips.length !== salarySlips.length) {
        console.log(`Cleaned salary slips: ${salarySlips.length} -> ${cleanedSalarySlips.length}`);
        setSalarySlips(cleanedSalarySlips);
        await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(cleanedSalarySlips));
      }
      
      // تنظيف قصاصات الأرباح - حماية القصاصات المحلية الجديدة
      const validProfitsIds = dbProfitsSlips.map(slip => slip.id);
      const cleanedProfitsSlips = profitsSlips.filter(slip => {
        // إذا لم يكن للقصاصة ID، فهي قصاصة محلية جديدة - نحتفظ بها
        if (!slip.id) {
          console.log('Keeping local profits slip without ID:', slip);
          return true;
        }
        // إذا كان للقصاصة ID، نتأكد من وجودها في قاعدة البيانات
        const existsInDB = validProfitsIds.includes(slip.id);
        if (!existsInDB) {
          console.log('Removing profits slip not found in database:', slip);
        }
        return existsInDB;
      });
      
      if (cleanedProfitsSlips.length !== profitsSlips.length) {
        console.log(`Cleaned profits slips: ${profitsSlips.length} -> ${cleanedProfitsSlips.length}`);
        setProfitsSlips(cleanedProfitsSlips);
        await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(cleanedProfitsSlips));
      }
      
      console.log('Local data cleanup completed');
    } catch (error) {
      console.log('Error during local data cleanup:', error);
    }
  };

  const syncPendingLocalData = async () => {
    try {
      console.log('Syncing pending local data to database...');
      
      if (!currentUserId || !isConnectedToDatabase) {
        console.log('Skipping sync - not connected to database');
        return;
      }
      
      let syncedCount = 0;
      
      // مزامنة قصاصات الحوافز المحلية الجديدة
      for (let i = 0; i < incentiveSlips.length; i++) {
        const slip = incentiveSlips[i];
        if (!slip.id) {
          console.log('Syncing local incentive slip to database:', slip);
          try {
            const newSlip = await databaseService.saveIncentiveSlip({
              user_id: Number(currentUserId),
              month: slip.month,
              basic_salary: parseFloat(slip.points.replace(/,/g, '') || '0'),
              allowance: parseFloat(slip.regularLeave.replace(/,/g, '') || '0'),
              bonus: parseFloat(slip.rewards.replace(/,/g, '') || '0'),
              deductions: parseFloat(slip.sickLeave.replace(/,/g, '') || '0'),
              total_incentive: parseFloat(slip.totalIncentive.replace(/,/g, '') || '0'),
              rating: slip.rating || 'متوسط'
            });
            
            // تحديث الـ ID في القائمة المحلية
            const updatedSlips = [...incentiveSlips];
            updatedSlips[i] = { ...slip, id: newSlip?.id || Date.now() };
            setIncentiveSlips(updatedSlips);
            await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(updatedSlips));
            
            console.log('Successfully synced incentive slip with ID:', newSlip?.id);
            syncedCount++;
          } catch (error) {
            console.log('Failed to sync incentive slip:', error);
          }
        }
      }
      
      // مزامنة قصاصات الراتب المحلية الجديدة
      for (let i = 0; i < salarySlips.length; i++) {
        const slip = salarySlips[i];
        if (!slip.id) {
          console.log('Syncing local salary slip to database:', slip);
          try {
            const newSlip = await databaseService.saveSalarySlip({
              user_id: Number(currentUserId),
              month: slip.month,
              basic_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0'),
              allowance: 0,
              bonus: parseFloat(slip.bonus?.replace(/,/g, '') || '0'),
              deductions: 0,
              total_salary: parseFloat(slip.totalSalary.replace(/,/g, '') || '0')
            });
            
            // تحديث الـ ID في القائمة المحلية
            const updatedSlips = [...salarySlips];
            updatedSlips[i] = { ...slip, id: newSlip?.id || Date.now() };
            setSalarySlips(updatedSlips);
            await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(updatedSlips));
            
            console.log('Successfully synced salary slip with ID:', newSlip?.id);
            syncedCount++;
          } catch (error) {
            console.log('Failed to sync salary slip:', error);
          }
        }
      }
      
      // مزامنة قصاصات الأرباح المحلية الجديدة
      for (let i = 0; i < profitsSlips.length; i++) {
        const slip = profitsSlips[i];
        if (!slip.id) {
          console.log('Syncing local profits slip to database:', slip);
          try {
            const newSlip = await databaseService.saveProfitsSlip({
              user_id: Number(currentUserId),
              profit_year: slip.profitYear,
              profit_period: slip.profitPeriod === '50% الأولى' ? 'first' : 'second',
              basic_profits: parseFloat(slip.profitPoints.replace(/,/g, '') || '0'),
              additional_profits: 0,
              deductions: 0,
              total_profits: parseFloat(slip.totalProfits.replace(/,/g, '') || '0'),
              rating: slip.rating || 'متوسط'
            });
            
            // تحديث الـ ID في القائمة المحلية
            const updatedSlips = [...profitsSlips];
            updatedSlips[i] = { ...slip, id: newSlip?.id || Date.now() };
            setProfitsSlips(updatedSlips);
            await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(updatedSlips));
            
            console.log('Successfully synced profits slip with ID:', newSlip?.id);
            syncedCount++;
          } catch (error) {
            console.log('Failed to sync profits slip:', error);
          }
        }
      }
      
      if (syncedCount > 0) {
        console.log(`Successfully synced ${syncedCount} local slips to database`);
        triggerSaveToast();
      } else {
        console.log('No local slips to sync');
      }
      
    } catch (error) {
      console.log('Error syncing pending local data:', error);
    }
  };

  const cleanupDuplicateSlips = async () => {
    try {
      console.log('Starting duplicate slips cleanup...');
      
      if (!currentUserId || !isConnectedToDatabase) {
        console.log('Skipping cleanup - not connected to database');
        return;
      }
      
      // جلب جميع القصاصات من قاعدة البيانات
      const dbIncentiveSlips = await databaseService.getIncentiveSlips(currentUserId);
      const dbSalarySlips = await databaseService.getSalarySlips(currentUserId);
      const dbProfitsSlips = await databaseService.getProfitsSlips(currentUserId);
      
      // البحث عن القصاصات المكررة في الحوافز
      const incentiveDuplicates = findDuplicates(dbIncentiveSlips, 'month');
      for (const duplicate of incentiveDuplicates) {
        console.log('Found duplicate incentive slip:', duplicate);
        // حذف القصاصات المكررة مع الاحتفاظ بالأحدث
        const sortedDuplicates = duplicate.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // حذف جميع القصاصات المكررة ما عدا الأحدث
        for (let i = 1; i < sortedDuplicates.length; i++) {
          await databaseService.deleteIncentiveSlip(sortedDuplicates[i].id);
          console.log('Deleted duplicate incentive slip:', sortedDuplicates[i].id);
        }
      }
      
      // البحث عن القصاصات المكررة في الراتب
      const salaryDuplicates = findDuplicates(dbSalarySlips, 'month');
      for (const duplicate of salaryDuplicates) {
        console.log('Found duplicate salary slip:', duplicate);
        // حذف القصاصات المكررة مع الاحتفاظ بالأحدث
        const sortedDuplicates = duplicate.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // حذف جميع القصاصات المكررة ما عدا الأحدث
        for (let i = 1; i < sortedDuplicates.length; i++) {
          await databaseService.deleteSalarySlip(sortedDuplicates[i].id);
          console.log('Deleted duplicate salary slip:', sortedDuplicates[i].id);
        }
      }
      
      // البحث عن القصاصات المكررة في الأرباح
      const profitsDuplicates = findDuplicates(dbProfitsSlips, 'profit_year', 'profit_period');
      for (const duplicate of profitsDuplicates) {
        console.log('Found duplicate profits slip:', duplicate);
        // حذف القصاصات المكررة مع الاحتفاظ بالأحدث
        const sortedDuplicates = duplicate.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        // حذف جميع القصاصات المكررة ما عدا الأحدث
        for (let i = 1; i < sortedDuplicates.length; i++) {
          await databaseService.deleteProfitsSlip(sortedDuplicates[i].id);
          console.log('Deleted duplicate profits slip:', sortedDuplicates[i].id);
        }
      }
      
      console.log('Duplicate slips cleanup completed');
    } catch (error) {
      console.log('Error during duplicate slips cleanup:', error);
    }
  };

  // دالة مساعدة للعثور على القصاصات المكررة
  const findDuplicates = (slips: any[], ...keys: string[]) => {
    const groups = new Map<string, any[]>();
    
    for (const slip of slips) {
      const key = keys.map(k => slip[k]).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(slip);
    }
    
    return Array.from(groups.values()).filter(group => group.length > 1);
  };

  const handleDatabaseError = async (error: any, operation: string, slipData: any, index?: number) => {
    console.log(`Database error in ${operation}:`, error);
    
    // تحقق من نوع الخطأ
    const isPGRST116 = error && typeof error === 'object' && 'code' in error && error.code === 'PGRST116';
    
    if (isPGRST116) {
      console.log(`PGRST116 error detected in ${operation} - record not found, creating new slip`);
      try {
        if (currentUserId && isConnectedToDatabase) {
          let newSlip;
          
          if (operation === 'updateSalarySlip') {
            newSlip = await databaseService.saveSalarySlip({
              user_id: Number(currentUserId),
              month: slipData.month,
              basic_salary: parseFloat(slipData.totalSalary.replace(/,/g, '') || '0'),
              allowance: 0,
              bonus: parseFloat(slipData.bonus?.replace(/,/g, '') || '0'),
              deductions: 0,
              total_salary: parseFloat(slipData.totalSalary.replace(/,/g, '') || '0')
            });
          } else if (operation === 'updateIncentiveSlip') {
            newSlip = await databaseService.saveIncentiveSlip({
              user_id: Number(currentUserId),
              month: slipData.month,
              basic_salary: parseFloat(slipData.points.replace(/,/g, '') || '0'),
              allowance: parseFloat(slipData.regularLeave.replace(/,/g, '') || '0'),
              bonus: parseFloat(slipData.rewards.replace(/,/g, '') || '0'),
              deductions: parseFloat(slipData.sickLeave.replace(/,/g, '') || '0'),
              total_incentive: parseFloat(slipData.totalIncentive.replace(/,/g, '') || '0'),
              rating: slipData.rating || 'متوسط'
            });
          } else if (operation === 'updateProfitsSlip') {
            newSlip = await databaseService.saveProfitsSlip({
              user_id: Number(currentUserId),
              profit_year: slipData.profitYear,
              profit_period: slipData.profitPeriod === '50% الأولى' ? 'first' : 'second',
              basic_profits: parseFloat(slipData.profitPoints.replace(/,/g, '') || '0'),
              additional_profits: 0,
              deductions: 0,
              total_profits: parseFloat(slipData.totalProfits.replace(/,/g, '') || '0'),
              rating: slipData.rating || 'متوسط'
            });
          }
          
          if (newSlip && index !== undefined) {
            // تحديث القائمة المحلية بالـ ID الجديد
            if (operation === 'updateSalarySlip') {
              const updatedSlips = [...salarySlips];
              updatedSlips[index] = { ...slipData, id: newSlip.id };
              setSalarySlips(updatedSlips);
              await AsyncStorage.setItem(SALARY_SLIPS_KEY, JSON.stringify(updatedSlips));
            } else if (operation === 'updateIncentiveSlip') {
              const updatedSlips = [...incentiveSlips];
              updatedSlips[index] = { ...slipData, id: newSlip.id };
              setIncentiveSlips(updatedSlips);
              await AsyncStorage.setItem(INCENTIVE_SLIPS_KEY, JSON.stringify(updatedSlips));
            } else if (operation === 'updateProfitsSlip') {
              const updatedSlips = [...profitsSlips];
              updatedSlips[index] = { ...slipData, id: newSlip.id };
              setProfitsSlips(updatedSlips);
              await AsyncStorage.setItem(PROFITS_SLIPS_KEY, JSON.stringify(updatedSlips));
            }
            
            console.log(`Successfully created new ${operation} with id:`, newSlip.id);
            triggerSaveToast();
            return true; // نجح إنشاء القصاصة الجديدة
          }
        }
      } catch (createError) {
        console.log(`Failed to create new ${operation}:`, createError);
      }
    } else {
      console.log(`Non-PGRST116 error in ${operation}:`, error);
    }
    
    return false; // فشل في معالجة الخطأ
  };

  // دالة تسجيل الدخول
  const loginUser = async (computerId: string, password: string) => {
    try {
      setIsSyncing(true);
      console.log('Logging in with:', { computerId, password });
      
      // التحقق من وجود Supabase
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.' };
      }
      
      // التحقق من وجود المستخدم
      const existingUser = await databaseService.checkUserExists(computerId);
      
      if (!existingUser) {
        return { success: false, message: 'رقم الحاسبة غير موجود في قاعدة البيانات' };
      }
      
      // التحقق من كلمة السر
      const isPasswordCorrect = await databaseService.checkPassword(computerId, password);
      
      if (!isPasswordCorrect) {
        return { success: false, message: 'كلمة السر غير صحيحة' };
      }
      
      // تسجيل الدخول بنجاح
      setCurrentUserId(existingUser.id.toString());
      await AsyncStorage.setItem(USER_ID_KEY, existingUser.id.toString());
      setIsConnectedToDatabase(true);
      await AsyncStorage.setItem(IS_CONNECTED_KEY, 'true');
      
      // تحميل البيانات من قاعدة البيانات
      await loadFromDatabase();
      
      console.log('Successfully logged in:', existingUser);
      triggerSaveToast('تم تسجيل الدخول بنجاح! ✅');
      return { success: true, message: 'تم تسجيل الدخول بنجاح' };
    } catch (error) {
      console.log('Error logging in:', error);
      return { success: false, message: 'حدث خطأ أثناء تسجيل الدخول' };
    } finally {
      setIsSyncing(false);
    }
  };

  // دالة إنشاء حساب جديد
  const registerUser = async (computerId: string, password: string) => {
    try {
      setIsSyncing(true);
      console.log('Registering with:', { computerId, password });
      
      // التحقق من وجود Supabase
      if (!isSupabaseConfigured()) {
        return { success: false, message: 'قاعدة البيانات غير متاحة. يرجى التحقق من إعدادات الاتصال.' };
      }
      
      // التحقق من وجود المستخدم
      const existingUser = await databaseService.checkUserExists(computerId);
      
      if (existingUser) {
        return { success: false, message: 'رقم الحاسبة موجود بالفعل في قاعدة البيانات' };
      }
      
      // إنشاء حساب جديد مع كلمة السر
      const newUser = await databaseService.createUserWithPassword(computerId, password);
      
      if (newUser) {
        setCurrentUserId(newUser.id.toString());
        await AsyncStorage.setItem(USER_ID_KEY, newUser.id.toString());
        setIsConnectedToDatabase(true);
        await AsyncStorage.setItem(IS_CONNECTED_KEY, 'true');
        
        // حفظ البيانات المحلية في قاعدة البيانات
        await saveToDatabase();
        
        console.log('Successfully created new account:', newUser);
        triggerSaveToast('تم إنشاء الحساب بنجاح! ✅');
        return { success: true, message: 'تم إنشاء الحساب بنجاح' };
      } else {
        return { success: false, message: 'فشل في إنشاء الحساب' };
      }
    } catch (error) {
      console.log('Error registering:', error);
      return { success: false, message: 'حدث خطأ أثناء إنشاء الحساب' };
    } finally {
      setIsSyncing(false);
    }
  };

  // إذا كان هناك خطأ، اعرض رسالة خطأ بسيطة
  if (hasError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
          حدث خطأ في تحميل التطبيق
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
          يرجى إعادة تشغيل التطبيق
        </Text>
      </View>
    );
  }

  return (
    <UserDataContext.Provider
      value={{
        userData,
        currentUserId,
        isConnectedToDatabase,
        updateUserData,
        calculateServiceDuration,
        calculateServiceDays,
        getCurrentFiscalYear,
        checkAndResetRewards,
        isLoading,
            showSaveToast,
    toastMessage,
    triggerSaveToast,
        isSyncing,
        manualSyncing,
        syncError,
        setManualSyncing,
        setSyncError,
        linkToDatabase,
        logoutFromDatabase,
        syncToDatabase,
        saveToDatabase,
        loginUser,
        registerUser,
        incentiveSlips,
        addIncentiveSlip,
        updateIncentiveSlip,
        deleteIncentiveSlip,
        salarySlips,
        addSalarySlip,
        updateSalarySlip,
        deleteSalarySlip,
        profitsSlips,
        addProfitsSlip,
        updateProfitsSlip,
        deleteProfitsSlip,
        updateCourseCompletion,
        debugUserData,
        testIncentiveSlipOperations,
        testUpdateMainDataFromSlip,
        debugIncentiveProblem,
        fixIncentiveTotal,
        testDirectIncentiveUpdate,
        debugRewardsProblem,
        fixRewardsTotal,
        cleanupLocalData,
        syncPendingLocalData,
        cleanupDuplicateSlips,
        handleDatabaseError,
        calculateRewardsForYear,
        updateCurrentYearRewards,
        updateBaseRewards,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}