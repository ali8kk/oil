import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Save, DollarSign, ChevronDown, Check } from 'lucide-react-native';

interface SalaryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: SalaryData) => void;
  initialData?: SalaryData;
}

export interface SalaryData {
  totalSalary: string;
  bonus: string; // حقل المكافأة الجديد
  month: string;
  id?: number;
}

const monthOptions = [
  { label: '1', value: '01' },
  { label: '2', value: '02' },
  { label: '3', value: '03' },
  { label: '4', value: '04' },
  { label: '5', value: '05' },
  { label: '6', value: '06' },
  { label: '7', value: '07' },
  { label: '8', value: '08' },
  { label: '9', value: '09' },
  { label: '10', value: '10' },
  { label: '11', value: '11' },
  { label: '12', value: '12' }
];

// إنشاء قائمة السنوات
const getCurrentYearOptions = () => {
  const years = [];
  
  for (let i = 2022; i <= 2050; i++) {
    years.push({ label: i.toString(), value: i.toString() });
  }
  
  return years;
};

const yearOptions = getCurrentYearOptions();

export default function SalaryModal({ visible, onClose, onSave, initialData }: SalaryModalProps) {
  const [formData, setFormData] = useState<SalaryData>({
    totalSalary: '',
    bonus: '',
    month: ''
  });
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  // دالة للحصول على الشهر السابق
  const getPreviousMonth = () => {
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const month = (previousMonth.getMonth() + 1).toString();
    const year = previousMonth.getFullYear();
    return { month, year: year.toString() };
  };

  // تحديث البيانات عند تمرير initialData أو فتح النافذة
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // استخراج الشهر والسنة من البيانات الموجودة
      if (initialData.month) {
        const [month, year] = initialData.month.split('/');
        setSelectedMonth(parseInt(month).toString());
        setSelectedYear(year);
      }
    } else if (visible) {
      const { month, year } = getPreviousMonth();
      // للقصاصات الجديدة، تعيين الشهر السابق تلقائياً
      setFormData({
        totalSalary: '',
        bonus: '',
        month: `${month.padStart(2, '0')}/${year}`
      });
      setSelectedMonth(month);
      setSelectedYear(year);
    }
  }, [initialData, visible]);

  const formatNumber = (num: string) => {
    const cleanNum = num.replace(/,/g, '');
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleFieldChange = (field: keyof SalaryData, value: string) => {
    // تنسيق الأرقام للحقول المالية
    if (field === 'totalSalary' || field === 'bonus') {
      const cleanValue = value.replace(/,/g, '');
      if (/^\d*$/.test(cleanValue)) {
        value = formatNumber(cleanValue);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMonthChange = (monthNumber: string) => {
    setSelectedMonth(monthNumber);
    const year = selectedYear || new Date().getFullYear().toString();
    const newMonth = `${monthNumber.padStart(2, '0')}/${year}`;
    handleFieldChange('month', newMonth);
    setShowMonthDropdown(false);
    setIsDropdownActive(false);
  };

  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    const month = selectedMonth || '1';
    const newMonth = `${month.padStart(2, '0')}/${year}`;
    handleFieldChange('month', newMonth);
    setShowYearDropdown(false);
    setIsDropdownActive(false);
  };

  const handleDropdownOpen = (dropdownType: 'month' | 'year') => {
    setIsDropdownActive(true);
    if (dropdownType === 'month') {
      setShowMonthDropdown(true);
      setShowYearDropdown(false);
    } else if (dropdownType === 'year') {
      setShowYearDropdown(true);
      setShowMonthDropdown(false);
    }
  };

  const handleDropdownClose = () => {
    setShowMonthDropdown(false);
    setShowYearDropdown(false);
    setIsDropdownActive(false);
  };

  const handleSave = () => {
    // التحقق من الحقول المطلوبة
    if (!formData.totalSalary.trim()) {
      return;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    if (!initialData) {
      const { month, year } = getPreviousMonth();
      setFormData({
        totalSalary: '',
        bonus: '',
        month: `${month.padStart(2, '0')}/${year}`
      });
      setSelectedMonth(month);
      setSelectedYear(year);
    }
    handleDropdownClose();
    onClose();
  };

  const isFormValid = formData.totalSalary.trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView 
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Overlay لإغلاق النافذة */}
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={isDropdownActive ? handleDropdownClose : handleClose}
          activeOpacity={1}
        />
        
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <View style={styles.headerTitleContainer}>
              <DollarSign size={24} color="#10B981" />
              <Text style={styles.modalTitle}>
                {initialData ? 'تعديل قصاصة راتب' : 'إضافة قصاصة راتب'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDropdownActive}
          >
            {/* الشهر والسنة - يظهران فقط في وضع التعديل */}
            {initialData && (
              <>
                <TouchableOpacity 
                  style={styles.fieldContainer}
                  activeOpacity={1}
                  onPress={isDropdownActive ? handleDropdownClose : undefined}
                >
                  <Text style={styles.fieldLabel}>الشهر</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => handleDropdownOpen('month')}
                  >
                    <ChevronDown size={20} color="#9CA3AF" />
                    <Text style={styles.dropdownText}>
                      {selectedMonth || 'اختر الشهر'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.fieldContainer}
                  activeOpacity={1}
                  onPress={isDropdownActive ? handleDropdownClose : undefined}
                >
                  <Text style={styles.fieldLabel}>السنة</Text>
                  <TouchableOpacity 
                    style={styles.dropdownButton}
                    onPress={() => handleDropdownOpen('year')}
                  >
                    <ChevronDown size={20} color="#9CA3AF" />
                    <Text style={styles.dropdownText}>
                      {selectedYear || 'اختر السنة'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </>
            )}

            {/* الراتب الكلي */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>الراتب الكلي (بالدينار) *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.totalSalary}
                onChangeText={(text) => handleFieldChange('totalSalary', text)}
                placeholder="أدخل قيمة الراتب الكلي"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                textAlign="right"
              />
            </TouchableOpacity>

            {/* المكافأة */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>المكافأة (بالدينار)</Text>
              <TextInput
                style={styles.textInput}
                value={formData.bonus}
                onChangeText={(text) => handleFieldChange('bonus', text)}
                placeholder="أدخل قيمة المكافأة"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                textAlign="right"
              />
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[
                styles.saveButton, 
                !isFormValid && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!isFormValid}
            >
              <Save size={20} color={isFormValid ? "#FFFFFF" : "#9CA3AF"} />
              <Text style={[
                styles.saveButtonText, 
                !isFormValid && styles.saveButtonTextDisabled
              ]}>
                {initialData ? 'حفظ التعديل' : 'حفظ القصاصة'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelButtonText}>إلغاء</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Month Dropdown Modal */}
        {initialData && (
          <Modal
            visible={showMonthDropdown}
            transparent
            animationType="fade"
            onRequestClose={handleDropdownClose}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.dropdownModalContent}>
                <View style={styles.dropdownModalHeader}>
                  <TouchableOpacity onPress={handleDropdownClose}>
                    <X size={24} color="#6B46C1" />
                  </TouchableOpacity>
                  <Text style={styles.dropdownModalTitle}>الشهر</Text>
                  <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                  style={styles.dropdownOptionsList}
                  showsVerticalScrollIndicator={false}
                >
                  {monthOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOptionItem,
                        selectedMonth === option.value && styles.selectedDropdownOption
                      ]}
                      onPress={() => handleMonthChange(option.value)}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        selectedMonth === option.value && styles.selectedDropdownOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {selectedMonth === option.value && (
                        <Check size={20} color="#6B46C1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.dropdownModalActions}>
                  <TouchableOpacity style={styles.dropdownCancelButton} onPress={handleDropdownClose}>
                    <Text style={styles.dropdownCancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Year Dropdown Modal */}
        {initialData && (
          <Modal
            visible={showYearDropdown}
            transparent
            animationType="fade"
            onRequestClose={handleDropdownClose}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.dropdownModalContent}>
                <View style={styles.dropdownModalHeader}>
                  <TouchableOpacity onPress={handleDropdownClose}>
                    <X size={24} color="#6B46C1" />
                  </TouchableOpacity>
                  <Text style={styles.dropdownModalTitle}>السنة</Text>
                  <View style={{ width: 24 }} />
                </View>

                <ScrollView 
                  style={styles.dropdownOptionsList}
                  showsVerticalScrollIndicator={false}
                >
                  {yearOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.dropdownOptionItem,
                        selectedYear === option.value && styles.selectedDropdownOption
                      ]}
                      onPress={() => handleYearChange(option.value)}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        selectedYear === option.value && styles.selectedDropdownOptionText
                      ]}>
                        {option.label}
                      </Text>
                      {selectedYear === option.value && (
                        <Check size={20} color="#6B46C1" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.dropdownModalActions}>
                  <TouchableOpacity style={styles.dropdownCancelButton} onPress={handleDropdownClose}>
                    <Text style={styles.dropdownCancelButtonText}>إلغاء</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
    marginRight: 8,
  },
  formContainer: {
    maxHeight: 400,
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
    position: 'relative',
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    marginBottom: 8,
  },
  textInput: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    textAlign: 'right',
    backgroundColor: '#F9FAFB',
    minHeight: 48,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 48,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginHorizontal: 8,
  },
  dropdownModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    maxHeight: '70%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  dropdownModalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  dropdownOptionsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  dropdownOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedDropdownOption: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B46C1',
    borderWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  selectedDropdownOptionText: {
    fontFamily: 'Cairo-Bold',
    color: '#6B46C1',
  },
  dropdownModalActions: {
    alignItems: 'center',
  },
  dropdownCancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  dropdownCancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
  actionButtons: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  saveButtonTextDisabled: {
    color: '#9CA3AF',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
});