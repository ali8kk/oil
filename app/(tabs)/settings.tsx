import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ChevronRight, Settings2, Camera, Cloud, Download, Upload, X, Eye, EyeOff, Database, RefreshCw, Unlink, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, useEffect } from 'react';
import Toast from '@/components/Toast';
import { checkSupabaseConfig, testDirectConnection, clearSupabaseSession, supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useUserData } from '@/contexts/UserDataContext';

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
}

function SettingItem({ icon, title, subtitle, onPress }: SettingItemProps) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <ChevronRight size={20} color="#9CA3AF" />
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <View style={styles.settingIcon}>
        {icon}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { 
    showSaveToast, 
    isSyncing, 
    userData, 
    isConnectedToDatabase, 
    currentUserId,
    linkToDatabase,
    syncToDatabase,
    unlinkFromDatabase,
    saveToDatabase
  } = useUserData();
  
  const [showComputerIdInput, setShowComputerIdInput] = useState(false);
  const [inputComputerId, setInputComputerId] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showUnlinkWarning, setShowUnlinkWarning] = useState(false);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  
  // منطق الكشف عن الضغط المتكرر
  const [pressCount, setPressCount] = useState(0);
  const [lastPressTime, setLastPressTime] = useState(0);
  const [showToolsInterface, setShowToolsInterface] = useState(false);
  
  const handleSettingsPress = () => {
    const currentTime = Date.now();
    
    // إذا مر أكثر من 5 ثواني منذ آخر ضغط، إعادة تعيين العداد
    if (currentTime - lastPressTime > 5000) {
      setPressCount(1);
    } else {
      setPressCount(prev => prev + 1);
    }
    
    setLastPressTime(currentTime);
    
    // إذا وصل العداد إلى 10، إظهار الأدوات مباشرة
    if (pressCount + 1 >= 10) {
      setShowToolsInterface(true);
      setPressCount(0);
    }
  };

  const handleCheckApiUrl = async () => {
    try {
      const config = checkSupabaseConfig();
      const directResult = await testDirectConnection();
      
      let message = '=== فحص إعدادات Supabase ===\n\n';
      
      // إضافة معلومات الإعدادات
      message += `URL موجود: ${!!config.url ? '✅' : '❌'}\n`;
      message += `Key موجود: ${!!config.key ? '✅' : '❌'}\n`;
      message += `صحة الإعدادات: ${config.isValid ? '✅ صحيح' : '❌ خطأ'}\n\n`;
      
      // إضافة المشاكل إن وجدت
      if (config.issues.length > 0) {
        message += 'المشاكل:\n';
        config.issues.forEach(issue => {
          message += `• ${issue}\n`;
        });
        message += '\n';
      }
      
      // إضافة نتيجة الاتصال المباشر
      message += `نتيجة الاتصال المباشر: ${directResult.success ? '✅ نجح' : '❌ فشل'}\n`;
      if (!directResult.success) {
        message += `خطأ: ${directResult.error}\n`;
      }
      
      // اختبار الاتصال الفعلي مع قاعدة البيانات
      message += '\n=== اختبار الاتصال بقاعدة البيانات ===\n';
      
      try {
        // اختبار قراءة من جدول users
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        
        if (usersError) {
          message += `❌ فشل الاتصال بقاعدة البيانات\n`;
          message += `خطأ: ${usersError.message}\n`;
          if (usersError.code === 'PGRST116') {
            message += `\n💡 المشكلة: جدول 'users' غير موجود أو لا يمكن الوصول إليه`;
          }
        } else {
          message += `✅ نجح الاتصال بقاعدة البيانات\n`;
          message += `✅ يمكن قراءة البيانات من الجداول\n`;
        }
        
        // اختبار كتابة (اختبار بسيط)
        const { error: writeError } = await supabase
          .from('users')
          .select('id')
          .limit(1);
        
        if (writeError) {
          message += `⚠️ تحذير: مشاكل في الصلاحيات\n`;
          message += `خطأ: ${writeError.message}\n`;
        } else {
          message += `✅ الصلاحيات تعمل بشكل صحيح\n`;
        }
        
      } catch (dbError) {
        message += `❌ خطأ في الاتصال بقاعدة البيانات\n`;
        message += `خطأ: ${dbError}\n`;
      }
      
      if (!directResult.success) {
        message += `\n💡 الحل: اضغط زر "مسح الجلسات" لحل مشكلة 401`;
      }
      
      Alert.alert('فحص API و URL', message);
    } catch (error) {
      console.error('Error checking API/URL:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء فحص الإعدادات');
    }
  };

  const handleClearSessions = async () => {
    Alert.alert(
      'مسح الجلسات',
      'هل أنت متأكد من مسح جميع الجلسات المخزنة؟ هذا قد يحل مشاكل الاتصال بقاعدة البيانات.',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'مسح',
          style: 'destructive',
          onPress: async () => {
            try {
              // مسح جلسات Supabase
              await clearSupabaseSession();
              
              // مسح البيانات المحلية
              await AsyncStorage.clear();
              
              Alert.alert(
                'تم المسح بنجاح',
                'تم مسح جميع الجلسات والبيانات المحلية. أعد تشغيل التطبيق.',
                [
                  {
                    text: 'حسناً',
                    onPress: () => {
                      // يمكن إضافة إعادة تشغيل التطبيق هنا
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error clearing sessions:', error);
              Alert.alert('خطأ', 'حدث خطأ أثناء مسح الجلسات');
            }
          },
        },
      ]
    );
  };
  
  const handleAccountInfoPress = () => {
    router.push('/account-info');
  };

  const handleAppSettingsPress = () => {
    router.push('/app-settings');
  };

  const handleInstagramPress = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://instagram.com/ali.8k');
    } catch (error) {
      console.error('Error opening Instagram:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <TouchableOpacity 
        style={styles.container} 
        activeOpacity={1} 
        onPress={handleSettingsPress}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الحساب</Text>
          
          <SettingItem
            icon={<User size={24} color="#6B46C1" />}
            title="معلومات الحساب"
            subtitle="تحديث المعلومات الشخصية"
            onPress={handleAccountInfoPress}
          />
          
          <SettingItem
            icon={<Settings2 size={24} color="#3B82F6" />}
            title="إعدادات التطبيق"
            subtitle="تخصيص منطق عمل التطبيق"
            onPress={handleAppSettingsPress}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مزامنة المعلومات</Text>
          
          <View style={styles.syncInfo}>
            <Cloud size={16} color="#6B7280" />
            <Text style={styles.syncInfoText}>
              {isConnectedToDatabase && userData.computerId 
                ? `الحساب الحالي مربوط بقاعدة البيانات الخاصة بـ ${userData.computerId} وعملية المزامنة تتم بشكل تلقائي بعد أي إضافة أو تعديل`
                : "يمكنك مزامنة بياناتك مع قاعدة البيانات لحفظها واستعادتها لاحقاً"
              }
            </Text>
          </View>

          {!isConnectedToDatabase ? (
            <>
              <SettingItem
                icon={<Cloud size={24} color="#10B981" />}
                title="ربط بقاعدة البيانات"
                subtitle="اضغط للربط أو إنشاء حساب جديد"
                onPress={() => setShowLinkWarning(true)}
              />
            </>
          ) : (
            <View style={{ marginTop: 8 }}>
              {/* تم حذف زري تحميل البيانات وحفظ البيانات لأن المزامنة تلقائية */}
              <SettingItem
                icon={<Unlink size={24} color="#EF4444" />}
                title="فك الربط"
                subtitle="إلغاء الربط مع قاعدة البيانات"
                onPress={() => setShowUnlinkWarning(true)}
              />
            </View>
          )}
        </View>
        <View style={[styles.section, { marginBottom: 32 }]}> 
          <Text style={styles.sectionTitle}>تواصل معنا</Text>
          <SettingItem
            icon={<Camera size={24} color="#E4405F" />}
            title="Insta : ali.8k"
            subtitle="تابعنا على Instagram"
            onPress={handleInstagramPress}
          />
        </View>
      </ScrollView>
      </TouchableOpacity>

      {/* واجهة الأدوات المخفية */}
      {showToolsInterface && (
        <View style={styles.toolsOverlay}>
          <View style={styles.toolsContent}>
            <View style={styles.toolsHeader}>
              <Text style={styles.toolsTitle}>🔧 أدوات إصلاح قاعدة البيانات</Text>
              <TouchableOpacity
                onPress={() => setShowToolsInterface(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.toolsDescription}>
              أدوات متقدمة لإصلاح مشاكل قاعدة البيانات. استخدمها بحذر!
            </Text>
            
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#7C3AED', marginBottom: 12 }]}
              onPress={handleCheckApiUrl}
            >
              <Settings size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>فحص API و URL</Text>
                <Text style={styles.toolsButtonDescription}>يفحص صحة إعدادات قاعدة البيانات</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#DC2626' }]}
              onPress={handleClearSessions}
            >
              <RefreshCw size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>مسح الجلسات</Text>
                <Text style={styles.toolsButtonDescription}>يحل مشكلة 401 ويمسح البيانات المحلية</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Modal
        visible={showComputerIdInput}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComputerIdInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>ربط بقاعدة البيانات</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowComputerIdInput(false);
                  setInputComputerId('');
                  setInputPassword('');
                  setErrorMessage('');
                }}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              أدخل رقم الحاسبة وكلمة السر لربط حسابك بقاعدة البيانات{'\n'}
              إذا كان الحساب موجود في قاعدة البيانات سيتم استدعاء البيانات منه{'\n'}
              إذا لم يكن موجود سيتم إنشاء حساب جديد مع الاحتفاظ بالبيانات الحالية
            </Text>
            
            <TextInput
              style={styles.modalTextInput}
              value={inputComputerId}
              onChangeText={(text) => {
                // السماح بالأرقام فقط
                const numericValue = text.replace(/[^0-9]/g, '');
                setInputComputerId(numericValue);
                setErrorMessage('');
              }}
              placeholder="أدخل رقم الحاسبة"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              textAlign="right"
              maxLength={10}
            />
            
            <View style={styles.passwordInputContainer}>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIconContainer}>
                {showPassword ? <Eye size={20} color="#6B7280" /> : <EyeOff size={20} color="#6B7280" />}
              </TouchableOpacity>
              <TextInput
                style={[styles.modalTextInput, { flex: 1 }]}
                value={inputPassword}
                onChangeText={(text) => {
                  // السماح بالأرقام فقط مع حد أقصى 4 أرقام
                  const numericValue = text.replace(/[^0-9]/g, '').slice(0, 4);
                  setInputPassword(numericValue);
                  setErrorMessage('');
                }}
                placeholder="أدخل كلمة السر (4 أرقام)"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                textAlign="right"
                maxLength={4}
                secureTextEntry={!showPassword}
              />
            </View>
            {errorMessage ? (
              <Text style={{ color: 'red', textAlign: 'center', marginBottom: 8 }}>{errorMessage}</Text>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setShowComputerIdInput(false);
                  setInputComputerId('');
                  setInputPassword('');
                  setErrorMessage('');
                }}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton, (!inputComputerId || !inputPassword) && styles.disabledButton]}
                onPress={async () => {
                  if (inputComputerId && inputPassword) {
                    let timeoutId: any;
                    let finished = false;
                    // حماية ضد التعليق
                    timeoutId = setTimeout(() => {
                      if (!finished) {
                        setErrorMessage('انتهت مهلة الربط. تحقق من الاتصال وحاول مرة أخرى.');
                      }
                    }, 10000);
                    const result = await linkToDatabase(inputComputerId, inputPassword);
                    finished = true;
                    clearTimeout(timeoutId);
                    if (result.success) {
                      setShowComputerIdInput(false);
                      setInputComputerId('');
                      setInputPassword('');
                      setErrorMessage('');
                      console.log(result.message);
                    } else {
                      setErrorMessage(result.message || 'حدث خطأ أثناء الربط');
                    }
                  }
                }}
                disabled={!inputComputerId || !inputPassword || isSyncing}
              >
                <Cloud size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>
                  {isSyncing ? 'جاري الربط...' : 'تأكيد الربط'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal التحذير لفك الربط */}
      <Modal
        visible={showUnlinkWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnlinkWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تحذير فك الربط</Text>
              <TouchableOpacity
                onPress={() => setShowUnlinkWarning(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              سيتم حذف كل المعلومات الموجودة في التطبيق{'\n'}
              لاكن ستبقى مخزنه في قاعدة المعلومات{'\n'}
              ويمكنك استرجاعها في اي وقت
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowUnlinkWarning(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={async () => {
                  setShowUnlinkWarning(false);
                  const result = await unlinkFromDatabase();
                  if (result.success) {
                    console.log(result.message);
                  } else {
                    console.log('Error:', result.message);
                  }
                }}
              >
                <Unlink size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>استمرار</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal التحذير للربط */}
      <Modal
        visible={showLinkWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLinkWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تحذير الربط</Text>
              <TouchableOpacity
                onPress={() => setShowLinkWarning(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              سيتم حذف جميع المعلومات الحاليه
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLinkWarning(false)}
              >
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => {
                  setShowLinkWarning(false);
                  setShowComputerIdInput(true);
                }}
              >
                <Cloud size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>استمرار</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast
        visible={showSaveToast}
        message="تم حفظ التغييرات بنجاح! ✅"
        type="success"
        duration={2000}
        onHide={() => {}}
      />
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
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginBottom: 16,
    textAlign: 'right',
  },
  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingIcon: {
    marginLeft: 16,
  },
  settingContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  settingTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    marginBottom: 2,
    textAlign: 'right',
  },
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginTop: 8,
  },
  syncInfoText: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    flex: 1,
    lineHeight: 18,
  },
  settingSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  localNote: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 20,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    flex: 1,
    marginHorizontal: 4,
  },
  syncButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
    marginLeft: 8,
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
    minHeight: 48,
    marginBottom: 12
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalTextInput: {
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
    minHeight: 48,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmButton: {
    backgroundColor: '#10B981',
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
  confirmButtonText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
  },
  eyeIconContainer: {
    padding: 4,
    marginRight: 8,
    alignSelf: 'center',
  },
  toolsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
  },
  toolsContent: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  toolsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toolsTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
  },
  toolsDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
    marginBottom: 20,
    lineHeight: 20,
  },
  toolsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    minHeight: 70,
    gap: 12,
  },
  toolsButtonContent: {
    flex: 1,
  },
  toolsButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
  },
  toolsButtonDescription: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
});