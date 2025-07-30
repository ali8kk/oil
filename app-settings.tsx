import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowRight, Save, Settings2, Calendar, Heart, BookOpen } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUserData } from './contexts/UserDataContext';


interface NumberInputFieldProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  description?: string;
}

function NumberInputField({ icon, label, value, onChangeText, description }: NumberInputFieldProps) {
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
        placeholder="أدخل القيمة"
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
        textAlign="right"
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
      <View style={styles.courseInputsGrid}>
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
  const { userData, updateUserData, triggerSaveToast } = useUserData();
  
  const [formData, setFormData] = useState({
    regularLeaveBonus: userData.regularLeaveBonus || '3',
            sickLeaveBonus: userData.sickLeaveBonus || '2.5',
    coursesNames: userData.coursesNames || ['سلامة', 'حاسوب', 'اختصاص', 'إدارية']
  });

  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (!hasChanges) {
      console.log('app-settings: userData changed, updating formData');
      setFormData({
        regularLeaveBonus: userData.regularLeaveBonus || '3',
        sickLeaveBonus: userData.sickLeaveBonus || '2.5',
        coursesNames: userData.coursesNames || ['سلامة', 'حاسوب', 'اختصاص', 'إدارية']
      });
    }
  }, [userData.regularLeaveBonus, userData.sickLeaveBonus, userData.coursesNames]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setHasChanges(true);
  };

  const handleCoursesChange = (newCoursesNames: string[]) => {
    setFormData(prev => ({
      ...prev,
      coursesNames: newCoursesNames
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      const finalData = {
        regularLeaveBonus: formData.regularLeaveBonus || '0',
        sickLeaveBonus: formData.sickLeaveBonus || '0',
        coursesNames: formData.coursesNames
      };

      await updateUserData(finalData);
      setHasChanges(false);
      triggerSaveToast();
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };



  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <View style={styles.fieldsContainer}>
            <Text style={styles.sectionTitle}>إعدادات الإجازات</Text>
            
            <NumberInputField
              icon={<Calendar size={20} color="#6B46C1" />}
              label="مكافأة الإجازات الاعتيادية"
              value={formData.regularLeaveBonus}
              onChangeText={(value) => handleFieldChange('regularLeaveBonus', value)}
              description="عدد الأيام التي تُضاف لرصيد الإجازات الاعتيادية عندما تكون قيمة الإجازات في قصاصة الحافز صفر أو فارغة"
            />
            
            <NumberInputField
              icon={<Heart size={20} color="#6B46C1" />}
              label="مكافأة الإجازات المرضية"
              value={formData.sickLeaveBonus}
              onChangeText={(value) => handleFieldChange('sickLeaveBonus', value)}
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
              style={[styles.button, styles.saveButton, !hasChanges && styles.disabledButton]}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>حفظ التغييرات</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  scrollView: {
    flex: 1
  },
  content: {
    padding: 16,
    paddingBottom: 32
  },
  fieldsContainer: {
    gap: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    textAlign: 'right',
    marginBottom: 16
  },
  actionButtons: {
    marginTop: 32,
    gap: 12
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8
  },
  saveButton: {
    backgroundColor: '#6B46C1'
  },
  disabledButton: {
    opacity: 0.5
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#ffffff'
  },

  cancelButton: {
    backgroundColor: '#F3F4F6'
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280'
  },
  courseInputsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  courseInputWrapper: {
    width: '48%',
    marginBottom: 12
  },
  courseInputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 6
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
    textAlignVertical: 'center'
  },
  fieldContainer: {
    marginBottom: 20
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    flex: 1
  },
  fieldIcon: {
    marginLeft: 8
  },
  fieldDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 12,
    lineHeight: 20
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
    minHeight: 48
  }
});