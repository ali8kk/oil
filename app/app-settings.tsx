import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Save, Settings2, Calendar, Heart, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { useUserData } from '@/contexts/UserDataContext';


interface SettingFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  description?: string;
}

function SettingField({ icon, label, value, onChangeText, placeholder, description }: SettingFieldProps) {
  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      {description && (
        <Text style={styles.fieldDescription}>{description}</Text>
      )}
      <TextInput
        style={styles.textInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        textAlign="right"
        selectTextOnFocus={true}
        autoCorrect={false}
        spellCheck={false}
      />
    </View>
  );
}

interface CourseNameFieldProps {
  icon: React.ReactNode;
  label: string;
  values: string[];
  onValuesChange: (values: string[]) => void;
  description?: string;
}

function CourseNameField({ icon, label, values, onValuesChange, description }: CourseNameFieldProps) {
  const handleTextChange = (index: number, text: string) => {
    const newValues = [...values];
    newValues[index] = text;
    onValuesChange(newValues);
  };

  return (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      {description && (
        <Text style={styles.fieldDescription}>{description}</Text>
      )}
      <View style={styles.courseInputsContainer}>
        {values.map((value, index) => (
          <View key={index} style={styles.courseInputWrapper}>
            <Text style={styles.courseInputLabel}>الدورة {index + 1}:</Text>
            <TextInput
              style={styles.courseTextInput}
              value={value}
              onChangeText={(text) => handleTextChange(index, text)}
              placeholder={`اسم الدورة ${index + 1}`}
              placeholderTextColor="#9CA3AF"
              textAlign="right"
              selectTextOnFocus={true}
              autoCorrect={false}
              spellCheck={false}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

export default function AppSettingsScreen() {
  const { userData, updateUserData, triggerSaveToast, isSyncing } = useUserData();
  
  const [formData, setFormData] = useState({
    regularLeaveBonus: userData.regularLeaveBonus || '3',
    sickLeaveBonus: userData.sickLeaveBonus || '3',
    coursesNames: userData.coursesNames || ['سلامة', 'حاسوب', 'اختصاص', 'إدارية']
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // تحديث البيانات المحلية عند تغيير البيانات العامة
  useEffect(() => {
    setFormData({
      regularLeaveBonus: userData.regularLeaveBonus || '3',
      sickLeaveBonus: userData.sickLeaveBonus || '3',
      coursesNames: userData.coursesNames || ['سلامة', 'حاسوب', 'اختصاص', 'إدارية']
    });
  }, [userData.regularLeaveBonus, userData.sickLeaveBonus, userData.coursesNames]);

  const handleFieldChange = (field: string, value: string) => {
    // التأكد من أن القيمة رقم صحيح موجب
    if (value === '' || (/^\d+$/.test(value) && parseInt(value) >= 0)) {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
      setHasChanges(true);
    }
  };

  const handleCoursesChange = (newCoursesNames: string[]) => {
    setFormData(prev => ({
      ...prev,
      coursesNames: newCoursesNames
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      // التأكد من وجود قيم صالحة
      const finalData = {
        regularLeaveBonus: formData.regularLeaveBonus || '0',
        sickLeaveBonus: formData.sickLeaveBonus || '0',
        coursesNames: formData.coursesNames
      };

      await updateUserData(finalData);
      triggerSaveToast();
      setHasChanges(false);
      router.push('/(tabs)/settings');
      
    } catch (error) {
      console.error('Error saving app settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    router.back();
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

            <Text style={styles.headerTitle}>إعدادات التطبيق</Text>
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
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>إعدادات الإجازات</Text>
            
            <SettingField
              icon={<Calendar size={20} color="#10B981" />}
              label="مكافأة الإجازات الاعتيادية"
              value={formData.regularLeaveBonus}
              onChangeText={(text) => handleFieldChange('regularLeaveBonus', text)}
              placeholder="3"
              description="عدد الأيام التي تُضاف لرصيد الإجازات الاعتيادية عندما تكون قيمة الإجازات في قصاصة الحافز صفر أو فارغة"
            />

            <SettingField
              icon={<Heart size={20} color="#EF4444" />}
              label="مكافأة الإجازات المرضية"
              value={formData.sickLeaveBonus}
              onChangeText={(text) => handleFieldChange('sickLeaveBonus', text)}
              placeholder="3"
              description="عدد الأيام التي تُضاف لرصيد الإجازات المرضية عندما تكون قيمة الإجازات في قصاصة الحافز صفر أو فارغة"
            />
            
            <Text style={styles.sectionTitle}>إعدادات الدورات</Text>
            
            <CourseNameField
              icon={<BookOpen size={20} color="#6B46C1" />}
              label="أسماء الدورات"
              values={formData.coursesNames}
              onValuesChange={handleCoursesChange}
              description="يمكنك تخصيص أسماء الدورات التي تظهر في المعلومات الشخصية"
            />
          </View>

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
                {isSaving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
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
  },
  scrollContent: {
    paddingBottom: 40,
  },
  formContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginBottom: 16,
    marginTop: 24,
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
  fieldDescription: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 18,
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
  courseInputsContainer: {
    gap: 16,
  },
  courseInputWrapper: {
    gap: 8,
  },
  courseInputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
  },
  courseTextInput: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    textAlign: 'right',
    backgroundColor: '#F9FAFB',
    minHeight: 40,
    textAlignVertical: 'center',
  },
  actionButtons: {
    marginTop: 32,
    marginBottom: 24,
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
});