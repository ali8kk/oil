import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { X, LogIn, UserPlus } from 'lucide-react-native';

interface AuthChoiceModalProps {
  visible: boolean;
  onClose: () => void;
  onChooseLogin: () => void;
  onChooseRegister: () => void;
}

export default function AuthChoiceModal({ 
  visible, 
  onClose, 
  onChooseLogin, 
  onChooseRegister 
}: AuthChoiceModalProps) {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>ربط بقاعدة البيانات</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            اختر نوع العملية التي تريد القيام بها
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={onChooseLogin}
            >
              <View style={styles.optionIcon}>
                <LogIn size={24} color="#6B46C1" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>تسجيل الدخول</Text>
                <Text style={styles.optionDescription}>
                  لديك حساب بالفعل؟ سجل دخولك باستخدام رقم الحاسبة وكلمة السر
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={onChooseRegister}
            >
              <View style={styles.optionIcon}>
                <UserPlus size={24} color="#10B981" />
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>إنشاء حساب جديد</Text>
                <Text style={styles.optionDescription}>
                  ليس لديك حساب؟ أنشئ حساب جديد باستخدام رقم الحاسبة وكلمة سر جديدة
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'right',
    lineHeight: 20,
  },
  optionsContainer: {
    gap: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'right',
  },
  optionDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    lineHeight: 18,
  },
}); 