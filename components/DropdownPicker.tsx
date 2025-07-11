import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { ChevronDown, Check, X } from 'lucide-react-native';

interface DropdownPickerProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { label: string; value: string }[];
  placeholder?: string;
}

export default function DropdownPicker({ 
  icon, 
  label, 
  value, 
  onValueChange, 
  options, 
  placeholder 
}: DropdownPickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value);

  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const handleSelect = (optionValue: string) => {
    setSelectedValue(optionValue);
    onValueChange(optionValue);
    setShowModal(false);
  };

  const handleCancel = () => {
    setSelectedValue(value); // استعادة القيمة الأصلية
    setShowModal(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <View style={styles.container}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.dropdownButton}
        onPress={() => setShowModal(true)}
      >
        <ChevronDown size={20} color="#9CA3AF" />
        <Text style={[styles.dropdownText, !value && styles.placeholderText]}>
          {selectedOption?.label || placeholder || 'اختر قيمة'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#6B46C1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{label}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView 
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
            >
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionItem,
                    selectedValue === option.value && styles.selectedOption
                  ]}
                  onPress={() => handleSelect(option.value)}
                >
                  <Text style={[
                    styles.optionText,
                    selectedValue === option.value && styles.selectedOptionText
                  ]}>
                    {option.label}
                  </Text>
                  {selectedValue === option.value && (
                    <Check size={20} color="#6B46C1" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 44,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
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
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  optionsList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  optionItem: {
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
  selectedOption: {
    backgroundColor: '#F3F4F6',
    borderColor: '#6B46C1',
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: 'Cairo-Bold',
    color: '#6B46C1',
  },
  modalActions: {
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    width: '100%',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
});