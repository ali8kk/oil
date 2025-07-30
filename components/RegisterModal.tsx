import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { X, Eye, EyeOff } from 'lucide-react-native';

interface RegisterModalProps {
  visible: boolean;
  onClose: () => void;
  onRegister: (computerId: string, password: string) => Promise<{ success: boolean; message: string }>;
  onSwitchToLogin: () => void;
  onNavigateToAccountInfo?: () => void;
}

export default function RegisterModal({ visible, onClose, onRegister, onSwitchToLogin, onNavigateToAccountInfo }: RegisterModalProps) {
  const [computerId, setComputerId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateForm = () => {
    if (!computerId.trim()) {
      setErrorMessage('يرجى إدخال رقم الحاسبة');
      return false;
    }
    if (!password.trim()) {
      setErrorMessage('يرجى إدخال كلمة السر');
      return false;
    }
    if (password.length !== 4) {
      setErrorMessage('كلمة السر يجب أن تكون 4 أرقام بالضبط');
      return false;
    }
    
    // التحقق من أن كلمة السر تحتوي على أرقام فقط
    if (!/^\d{4}$/.test(password)) {
      setErrorMessage('كلمة السر يجب أن تحتوي على 4 أرقام فقط');
      return false;
    }
    if (!confirmPassword.trim()) {
      setErrorMessage('يرجى تأكيد كلمة السر');
      return false;
    }
    
    if (confirmPassword.length !== 4) {
      setErrorMessage('تأكيد كلمة السر يجب أن يكون 4 أرقام بالضبط');
      return false;
    }
    
    // التحقق من أن تأكيد كلمة السر يحتوي على أرقام فقط
    if (!/^\d{4}$/.test(confirmPassword)) {
      setErrorMessage('تأكيد كلمة السر يجب أن يحتوي على 4 أرقام فقط');
      return false;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('كلمة السر وتأكيدها غير متطابقين');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const result = await onRegister(computerId.trim(), password);
      
      if (result.success) {
        Alert.alert('تم إنشاء الحساب', result.message, [
          { text: 'حسناً', onPress: () => {
            setComputerId('');
            setPassword('');
            setConfirmPassword('');
            setErrorMessage('');
            onClose();
            // فتح لوحة معلومات الحساب بعد إنشاء الحساب بنجاح
            if (onNavigateToAccountInfo) {
              onNavigateToAccountInfo();
            }
          }}
        ]);
      } else {
        setErrorMessage(result.message);
      }
    } catch (error) {
      setErrorMessage('حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setComputerId('');
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>إنشاء حساب جديد</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalDescription}>
            أدخل رقم الحاسبة وكلمة السر لإنشاء حساب جديد
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>رقم الحاسبة</Text>
            <TextInput
              style={styles.textInput}
              value={computerId}
              onChangeText={(text) => {
                const numericValue = text.replace(/[^0-9]/g, '');
                setComputerId(numericValue);
                setErrorMessage('');
              }}
              placeholder="أدخل رقم الحاسبة"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
              maxLength={10}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>كلمة السر</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={password}
                onChangeText={(text) => {
                  // السماح بالأرقام فقط مع حد أقصى 4 أرقام
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setPassword(numericValue);
                  setErrorMessage('');
                }}
                placeholder="أدخل كلمة السر (4 أرقام)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                secureTextEntry={!showPassword}
                textAlign="right"
                maxLength={4}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>تأكيد كلمة السر</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.textInput, styles.passwordInput]}
                value={confirmPassword}
                onChangeText={(text) => {
                  // السماح بالأرقام فقط مع حد أقصى 4 أرقام
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setConfirmPassword(numericValue);
                  setErrorMessage('');
                }}
                placeholder="أعد إدخال كلمة السر (4 أرقام)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                secureTextEntry={!showConfirmPassword}
                textAlign="right"
                maxLength={4}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color="#6B7280" />
                ) : (
                  <Eye size={20} color="#6B7280" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.registerButton, 
                (!computerId || !password || !confirmPassword) && styles.disabledButton
              ]}
              onPress={handleRegister}
              disabled={!computerId || !password || !confirmPassword || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>إنشاء الحساب</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.switchContainer}>
            <Text style={styles.switchText}>لديك حساب بالفعل؟</Text>
            <TouchableOpacity onPress={onSwitchToLogin}>
              <Text style={styles.switchLink}>تسجيل الدخول</Text>
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
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'right',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 0,
    paddingRight: 16,
  },
  eyeButton: {
    padding: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    textAlign: 'right',
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  registerButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  switchText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
  },
  switchLink: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B46C1',
  },
}); 