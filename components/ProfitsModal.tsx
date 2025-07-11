import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { X, Save, TrendingUp, ChevronDown, Check } from 'lucide-react-native';

interface ProfitsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: ProfitsData) => void;
  initialData?: ProfitsData;
}

export interface ProfitsData {
  profitPoints: string;
  profitYear: string;
  profitPeriod: string;
  totalProfits: string;
  rating: string;
  id?: number;
}

const ratingOptions = [
  { label: 'متوسط', value: 'متوسط' },
  { label: 'جيد', value: 'جيد' },
  { label: 'جيد جداً', value: 'جيد جداً' },
  { label: 'ممتاز', value: 'ممتاز' }
];

const profitPeriodOptions = [
  { label: '50% الأولى', value: '50% الأولى' },
  { label: '50% الثانية', value: '50% الثانية' }
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

export default function ProfitsModal({ visible, onClose, onSave, initialData }: ProfitsModalProps) {
  const [formData, setFormData] = useState<ProfitsData>({
    profitPoints: '',
    profitYear: '',
    profitPeriod: '',
    totalProfits: '',
    rating: ''
  });
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [showRatingDropdown, setShowRatingDropdown] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);

  // تحديث البيانات عند تمرير initialData أو فتح النافذة
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else if (visible) {
      const currentYear = new Date().getFullYear();
      // للقصاصات الجديدة، تعيين السنة الحالية تلقائياً
      setFormData({
        profitPoints: '',
        profitYear: currentYear.toString(),
        profitPeriod: '',
        totalProfits: '',
        rating: ''
      });
    }
  }, [initialData, visible]);

  const formatNumber = (num: string) => {
    const cleanNum = num.replace(/,/g, '');
    return cleanNum.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleFieldChange = (field: keyof ProfitsData, value: string) => {
    // تنسيق الأرقام للحقول المالية
    if (['profitPoints', 'totalProfits'].includes(field)) {
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

  const handleYearChange = (year: string) => {
    handleFieldChange('profitYear', year);
    setShowYearDropdown(false);
    setIsDropdownActive(false);
  };

  const handlePeriodSelect = (value: string) => {
    handleFieldChange('profitPeriod', value);
    setShowPeriodDropdown(false);
    setIsDropdownActive(false);
  };

  const handleRatingSelect = (value: string) => {
    handleFieldChange('rating', value);
    setShowRatingDropdown(false);
    setIsDropdownActive(false);
  };

  const handleDropdownOpen = (dropdownType: 'year' | 'period' | 'rating') => {
    setIsDropdownActive(true);
    if (dropdownType === 'year') {
      setShowYearDropdown(true);
      setShowPeriodDropdown(false);
      setShowRatingDropdown(false);
    } else if (dropdownType === 'period') {
      setShowPeriodDropdown(true);
      setShowYearDropdown(false);
      setShowRatingDropdown(false);
    } else if (dropdownType === 'rating') {
      setShowRatingDropdown(true);
      setShowYearDropdown(false);
      setShowPeriodDropdown(false);
    }
  };

  const handleDropdownClose = () => {
    setShowYearDropdown(false);
    setShowPeriodDropdown(false);
    setShowRatingDropdown(false);
    setIsDropdownActive(false);
  };

  const handleSave = () => {
    // التحقق من الحقول المطلوبة
    if (!formData.profitPoints.trim() || !formData.profitYear || !formData.profitPeriod || !formData.totalProfits.trim() || !formData.rating) {
      return;
    }

    onSave(formData);
    handleClose();
  };

  const handleClose = () => {
    if (!initialData) {
      const currentYear = new Date().getFullYear();
      setFormData({
        profitPoints: '',
        profitYear: currentYear.toString(),
        profitPeriod: '',
        totalProfits: '',
        rating: ''
      });
    }
    handleDropdownClose();
    onClose();
  };

  const isFormValid = formData.profitPoints.trim() && formData.profitYear && formData.profitPeriod && formData.totalProfits.trim() && formData.rating;

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
              <TrendingUp size={24} color="#3B82F6" />
              <Text style={styles.modalTitle}>
                {initialData ? 'تعديل قصاصة أرباح' : 'إضافة قصاصة أرباح'}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView 
            style={styles.formContainer} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isDropdownActive}
          >
            {/* نقاط الأرباح */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>نقاط الأرباح *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.profitPoints}
                onChangeText={(text) => handleFieldChange('profitPoints', text)}
                placeholder="أدخل نقاط الأرباح"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                textAlign="right"
              />
            </TouchableOpacity>

            {/* التقييم */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>التقييم *</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => handleDropdownOpen('rating')}
              >
                <ChevronDown size={20} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formData.rating && styles.placeholderText]}>
                  {formData.rating || 'اختر التقييم'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* سنة الأرباح */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>سنة الأرباح *</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => handleDropdownOpen('year')}
              >
                <ChevronDown size={20} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formData.profitYear && styles.placeholderText]}>
                  {formData.profitYear || 'اختر السنة'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* فترة الأرباح */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>فترة الأرباح *</Text>
              <TouchableOpacity 
                style={styles.dropdownButton}
                onPress={() => handleDropdownOpen('period')}
              >
                <ChevronDown size={20} color="#9CA3AF" />
                <Text style={[styles.dropdownText, !formData.profitPeriod && styles.placeholderText]}>
                  {formData.profitPeriod || 'اختر الفترة'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>

            {/* الأرباح الكلية */}
            <TouchableOpacity 
              style={styles.fieldContainer}
              activeOpacity={1}
              onPress={isDropdownActive ? handleDropdownClose : undefined}
            >
              <Text style={styles.fieldLabel}>الأرباح الكلية (بالدينار) *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.totalProfits}
                onChangeText={(text) => handleFieldChange('totalProfits', text)}
                placeholder="أدخل قيمة الأرباح الكلية"
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

        {/* Year Dropdown Modal */}
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
                <Text style={styles.dropdownModalTitle}>سنة الأرباح</Text>
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
                      formData.profitYear === option.value && styles.selectedDropdownOption
                    ]}
                    onPress={() => handleYearChange(option.value)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      formData.profitYear === option.value && styles.selectedDropdownOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {formData.profitYear === option.value && (
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

        {/* Period Dropdown Modal */}
        <Modal
          visible={showPeriodDropdown}
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
                <Text style={styles.dropdownModalTitle}>فترة الأرباح</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView 
                style={styles.dropdownOptionsList}
                showsVerticalScrollIndicator={false}
              >
                {profitPeriodOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOptionItem,
                      formData.profitPeriod === option.value && styles.selectedDropdownOption
                    ]}
                    onPress={() => handlePeriodSelect(option.value)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      formData.profitPeriod === option.value && styles.selectedDropdownOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {formData.profitPeriod === option.value && (
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

        {/* Rating Dropdown Modal */}
        <Modal
          visible={showRatingDropdown}
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
                <Text style={styles.dropdownModalTitle}>التقييم</Text>
                <View style={{ width: 24 }} />
              </View>

              <ScrollView 
                style={styles.dropdownOptionsList}
                showsVerticalScrollIndicator={false}
              >
                {ratingOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.dropdownOptionItem,
                      formData.rating === option.value && styles.selectedDropdownOption
                    ]}
                    onPress={() => handleRatingSelect(option.value)}
                  >
                    <Text style={[
                      styles.dropdownOptionText,
                      formData.rating === option.value && styles.selectedDropdownOptionText
                    ]}>
                      {option.label}
                    </Text>
                    {formData.rating === option.value && (
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
  placeholderText: {
    color: '#9CA3AF',
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
    backgroundColor: '#3B82F6',
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