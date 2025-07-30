import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Save, User, Hash, Calendar, Award, Clock, Heart, Lock, Eye, EyeOff } from 'lucide-react-native';
import { TrendingUp } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useUserData } from '../contexts/UserDataContext';
import DatePicker from '../components/DatePicker';
import DropdownPicker from '../components/DropdownPicker';


interface EditFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  multiline?: boolean;
  secureTextEntry?: boolean;
  rightIcon?: React.ReactNode;
}

interface ReadOnlyFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  secureTextEntry?: boolean;
  showNote?: boolean;
}

function EditField({ icon, label, value, onChangeText, placeholder, keyboardType = 'default', multiline = false, secureTextEntry = false, rightIcon }: EditFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      <TextInput
        style={[styles.textInput, multiline && styles.multilineInput]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType={keyboardType}
        multiline={multiline}
        secureTextEntry={secureTextEntry}
        textAlign="right"
        selectTextOnFocus={true}
        selection={undefined}
        autoCorrect={false}
        spellCheck={false}
      />
      {rightIcon && (
        <View style={styles.rightIcon}>
          {rightIcon}
        </View>
      )}
    </View>
  );
}

function ReadOnlyField({ icon, label, value, secureTextEntry = false, showNote = false }: ReadOnlyFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      <View style={styles.readOnlyContainer}>
        {secureTextEntry ? (
          <View style={styles.readOnlyPasswordRow}>
            <Text style={styles.readOnlyText}>
              {showPassword ? value : '••••'}
            </Text>
            <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.eyeIconContainer}>
              {showPassword ? <Eye size={22} color="#6B7280" /> : <EyeOff size={22} color="#6B7280" />}
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.readOnlyText}>
            {value}
          </Text>
        )}
      </View>
      {showNote && (
        <Text style={styles.fieldNote}>لا يمكن تعديلها</Text>
      )}
    </View>
  );
}

export default function AccountInfoScreen() {
  const { userData, updateUserData, triggerSaveToast, isSyncing, salarySlips, incentiveSlips, updateCurrentYearRewards, updateBaseRewards } = useUserData();
  

  
  const [formData, setFormData] = useState({
    name: userData.name,
    computerId: userData.computerId,
    vacationBalance: userData.vacationBalance,
    sickLeaveBalance: userData.sickLeaveBalance,
    nextPromotionDate: userData.nextPromotionDate,
    nextAllowanceDate: userData.nextAllowanceDate,
    totalRewards: userData.totalRewards,
    startDate: userData.startDate,
    grade: userData.grade || '10',
    stage: userData.stage || '1',
    password: userData.password || ''
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // دالة لتنسيق الأرقام بالفواصل
  const formatNumber = (num: string) => {
    // إزالة الفواصل الموجودة أولاً
    const cleanNum = num.replace(/,/g, '');
    // إضافة الفواصل كل ثلاث أرقام
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // تحديث البيانات المحلية عند تغيير البيانات العامة
  useEffect(() => {
    setFormData({
      name: userData.name,
      computerId: userData.computerId,
      vacationBalance: userData.vacationBalance,
      sickLeaveBalance: userData.sickLeaveBalance,
      nextPromotionDate: userData.nextPromotionDate,
      nextAllowanceDate: userData.nextAllowanceDate,
      totalRewards: userData.totalRewards,
      startDate: userData.startDate,
      grade: userData.grade || '10',
      stage: userData.stage || '1',
      password: userData.password || ''
    });
  }, [userData]);

  const handleFieldChange = (field: string, value: string) => {
    // منع تحديث حقول للقراءة فقط
    if (field === 'computerId' || field === 'password') {
      return;
    }
    
    // تنسيق الأرقام للحقول المالية
    if (field === 'totalRewards') {
      // إزالة الفواصل أولاً ثم إعادة تنسيقها
      const cleanValue = value.replace(/,/g, '');
      if (/^\d*$/.test(cleanValue)) { // التأكد من أن القيمة أرقام فقط
        value = formatNumber(cleanValue);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (isSaving) return; // منع الضغط المتكرر
    
    setIsSaving(true);
    
    try {
      // تحديث البيانات في الـ Context (باستثناء المكافآت)
      const { totalRewards, ...otherData } = formData;
      await updateUserData(otherData);
      
      // تحديث المكافآت الأساسية بشكل منفصل
      if (totalRewards !== userData.totalRewards) {
        await updateBaseRewards(totalRewards);
      }
      
      // تفعيل إشعار النجاح
      triggerSaveToast();
      setHasChanges(false);
      
      // العودة إلى الشاشة الرئيسية مباشرة
      router.push('/');
      
    } catch (error) {
      console.error('Error saving data:', error);
      // يمكن إضافة إشعار خطأ هنا إذا لزم الأمر
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      // يمكن إضافة تحذير هنا إذا لزم الأمر
      router.back();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#6B46C1', '#8B5CF6']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={handleSave} 
            style={[styles.saveButton, hasChanges && styles.saveButtonActive]}
            disabled={!hasChanges || isSaving}
          >
            <Save size={24} color={hasChanges && !isSaving ? "#FFFFFF" : "#A78BFA"} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>

            <Text style={styles.headerTitle}>معلومات الحساب</Text>
          </View>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowRight size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        enabled={true}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="always"
          nestedScrollEnabled={true}
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>البيانات الأساسية</Text>
            
            <EditField
              icon={<User size={20} color="#6B46C1" />}
              label="الاسم الكامل"
              value={formData.name}
              onChangeText={(text) => handleFieldChange('name', text)}
              placeholder="أدخل الاسم الكامل"
            />

            <ReadOnlyField
              icon={<Hash size={20} color="#6B46C1" />}
              label="رقم الحاسبة"
              value={formData.computerId}
              showNote={true}
            />

            <ReadOnlyField
              icon={<Lock size={20} color="#6B46C1" />}
              label="كلمة السر لقاعدة البيانات"
              value={formData.password}
              secureTextEntry={true}
              showNote={true}
            />

            <DatePicker
              icon={<Calendar size={20} color="#3B82F6" />}
              label="تاريخ المباشرة"
              value={formData.startDate}
              onDateChange={(date) => handleFieldChange('startDate', date)}
              placeholder="اختر تاريخ المباشرة"
            />

            <Text style={styles.sectionTitle}>الإجازات والمزايا</Text>

            <EditField
              icon={<Calendar size={20} color="#10B981" />}
              label="رصيد الإجازات (بالأيام)"
              value={formData.vacationBalance}
              onChangeText={(text) => handleFieldChange('vacationBalance', text)}
              placeholder="أدخل رصيد الإجازات"
              keyboardType="numeric"
            />

            <EditField
              icon={<Heart size={20} color="#EF4444" />}
              label="رصيد الإجازات المرضية (بالأيام)"
              value={formData.sickLeaveBalance}
              onChangeText={(text) => handleFieldChange('sickLeaveBalance', text)}
              placeholder="أدخل رصيد الإجازات المرضية"
              keyboardType="numeric"
            />

            <DatePicker
              icon={<Clock size={20} color="#3B82F6" />}
              label="تاريخ الترقية القادمة"
              value={formData.nextPromotionDate}
              onDateChange={(date) => handleFieldChange('nextPromotionDate', date)}
              placeholder="اختر تاريخ الترقية القادمة"
            />

            <DatePicker
              icon={<Clock size={20} color="#F59E0B" />}
              label="تاريخ العلاوة القادمة"
              value={formData.nextAllowanceDate}
              onDateChange={(date) => handleFieldChange('nextAllowanceDate', date)}
              placeholder="اختر تاريخ العلاوة القادمة"
            />

            <EditField
              icon={<Award size={20} color="#F59E0B" />}
              label="المكافآت الكلية (بالدينار)"
              value={formData.totalRewards}
              onChangeText={(text) => handleFieldChange('totalRewards', text)}
              placeholder="أدخل المكافآت الكلية"
              keyboardType="numeric"
            />
          </View>
            <Text style={styles.sectionTitle}>معلومات الوظيفة</Text>
            
            <DropdownPicker
              icon={<Award size={20} color="#F59E0B" />}
              label="الدرجة الوظيفية"
              value={formData.grade}
              onValueChange={(value) => handleFieldChange('grade', value)}
              options={Array.from({ length: 10 }, (_, i) => ({
                label: (10 - i).toString(),
                value: (10 - i).toString()
              }))}
              placeholder="اختر الدرجة"
            />

            <DropdownPicker
              icon={<TrendingUp size={20} color="#3B82F6" />}
              label="المرحلة الوظيفية"
              value={formData.stage}
              onValueChange={(value) => handleFieldChange('stage', value)}
              options={Array.from({ length: 4 }, (_, i) => ({
                label: (i + 1).toString(),
                value: (i + 1).toString()
              }))}
              placeholder="اختر المرحلة"
            />

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.saveMainButton, 
                (!hasChanges || isSaving) && styles.saveMainButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!hasChanges || isSaving}
            >
              <Text style={[
                styles.saveButtonText, 
                (!hasChanges || isSaving) && styles.saveButtonTextDisabled
              ]}>
                {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Text>
              <Save size={20} color={hasChanges && !isSaving ? "#FFFFFF" : "#9CA3AF"} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleBack}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveButton: {
    padding: 8,
  },
  saveButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  scrollContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  formContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginBottom: 16,
    marginTop: 20,
    textAlign: 'right',
  },
  fieldContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  fieldIcon: {
    marginLeft: 12,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    textAlign: 'right',
    backgroundColor: '#F9FAFB',
    minHeight: 44,
    textAlignVertical: 'center',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  actionButtons: {
    marginTop: 32,
    marginBottom: 32,
  },
  saveMainButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveMainButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  eyeIconContainer: {
    marginLeft: 8,
    padding: 4,
  },
  rightIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  readOnlyContainer: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  readOnlyPasswordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readOnlyText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  fieldNote: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#EF4444',
    textAlign: 'right',
    marginTop: 4,
  },
});