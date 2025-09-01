import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { User, ChevronRight, Settings2, Camera, Cloud, Download, Upload, X, Eye, EyeOff, Database, RefreshCw, Unlink, Settings } from 'lucide-react-native';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState, useEffect } from 'react';
import Toast from '../../components/Toast';
import { checkSupabaseConfig, testDirectConnection, clearSupabaseSession, supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthChoiceModal from '../../components/AuthChoiceModal';
import LoginModal from '../../components/LoginModal';
import RegisterModal from '../../components/RegisterModal';

import { useUserData } from '../../contexts/UserDataContext';

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
    logoutFromDatabase,
    saveToDatabase,
    loginUser,
    registerUser,
    setManualSyncing,
    toastMessage,
    accountCreationDate,
    usersCount,
    testLoadAccountInfo
  } = useUserData();
  
  const [showAuthChoice, setShowAuthChoice] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showUnlinkWarning, setShowUnlinkWarning] = useState(false);
  const [showLinkWarning, setShowLinkWarning] = useState(false);
  const [showVersionInfo, setShowVersionInfo] = useState(false);
  const [showApiCheckResult, setShowApiCheckResult] = useState(false);
  const [apiCheckMessage, setApiCheckMessage] = useState('');
  const [forceRender, setForceRender] = useState(0);
  
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
      
      setApiCheckMessage(message);
      setShowApiCheckResult(true);
    } catch (error) {
      console.error('Error checking API/URL:', error);
      setApiCheckMessage('حدث خطأ أثناء فحص الإعدادات');
      setShowApiCheckResult(true);
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
      <View style={styles.container}>
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          onTouchStart={handleSettingsPress}
        >
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
                title="تسجيل الخروج"
                subtitle="تسجيل الخروج من الحساب"
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
        
        {/* معلومات الحساب والنسخة */}
        <View style={styles.versionContainer}>
          {(() => {
            console.log('Settings render - accountCreationDate:', accountCreationDate, 'usersCount:', usersCount, 'isConnected:', isConnectedToDatabase, 'currentUserId:', currentUserId, 'forceRender:', forceRender);
            return null;
          })()}
          {isConnectedToDatabase && currentUserId && (
            <View style={styles.accountInfoRow}>
              <Text style={styles.accountInfoValue}>{accountCreationDate}</Text>
              <Text style={styles.accountInfoLabel}>تاريخ إنشاء الحساب: </Text>
            </View>
          )}
          <View style={styles.accountInfoRow}>
            <Text style={styles.accountInfoValue}>{usersCount}</Text>
            <Text style={styles.accountInfoLabel}>عدد المستخدمين: </Text>
          </View>
          <View style={styles.versionSpacing} />
          <Text style={styles.versionText}>النسخة 1.1.8</Text>
        </View>
              </ScrollView>
      </View>

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
              activeOpacity={0.7}
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
              activeOpacity={0.7}
            >
              <RefreshCw size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>مسح الجلسات</Text>
                <Text style={styles.toolsButtonDescription}>يحل مشكلة 401 ويمسح البيانات المحلية</Text>
              </View>
            </TouchableOpacity>

            {/* زر اختبار علامة المزامنة */}
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#10B981', marginBottom: 12 }]}
              onPress={() => {
                setManualSyncing(true);
                setTimeout(() => setManualSyncing(false), 3000);
              }}
              activeOpacity={0.7}
            >
              <RefreshCw size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>اختبار علامة المزامنة</Text>
                <Text style={styles.toolsButtonDescription}>إظهار علامة المزامنة لمدة 3 ثوانٍ</Text>
              </View>
            </TouchableOpacity>

            {/* زر معلومات النسخ */}
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#F59E0B', marginBottom: 12 }]}
              onPress={() => setShowVersionInfo(true)}
              activeOpacity={0.7}
            >
              <Settings size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>معلومات النسخ</Text>
                <Text style={styles.toolsButtonDescription}>عرض تاريخ التحديثات والإصلاحات</Text>
              </View>
            </TouchableOpacity>

            {/* زر اختبار معلومات الحساب */}
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#059669', marginBottom: 12 }]}
              onPress={testLoadAccountInfo}
              activeOpacity={0.7}
            >
              <Settings size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>اختبار معلومات الحساب</Text>
                <Text style={styles.toolsButtonDescription}>إعادة تحميل تاريخ إنشاء الحساب وعدد المستخدمين</Text>
              </View>
            </TouchableOpacity>

            {/* زر إجبار إعادة الرسم */}
            <TouchableOpacity
              style={[styles.toolsButton, { backgroundColor: '#DC2626', marginBottom: 12 }]}
              onPress={() => setForceRender(prev => prev + 1)}
              activeOpacity={0.7}
            >
              <Settings size={24} color="#ffffff" />
              <View style={styles.toolsButtonContent}>
                <Text style={styles.toolsButtonText}>إجبار إعادة الرسم</Text>
                <Text style={styles.toolsButtonDescription}>إعادة رسم الواجهة لضمان عرض البيانات</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Modal اختيار نوع العملية */}
      <AuthChoiceModal
        visible={showAuthChoice}
        onClose={() => setShowAuthChoice(false)}
        onChooseLogin={() => {
          setShowAuthChoice(false);
          setShowLoginModal(true);
        }}
        onChooseRegister={() => {
          setShowAuthChoice(false);
          setShowRegisterModal(true);
        }}
      />

      {/* Modal تسجيل الدخول */}
      <LoginModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={loginUser}
        onSwitchToRegister={() => {
          setShowLoginModal(false);
          setShowRegisterModal(true);
        }}
      />

      {/* Modal إنشاء حساب جديد */}
      <RegisterModal
        visible={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onRegister={registerUser}
        onSwitchToLogin={() => {
          setShowRegisterModal(false);
          setShowLoginModal(true);
        }}
        onNavigateToAccountInfo={() => {
          setShowRegisterModal(false);
          router.push('/account-info');
        }}
      />

      {/* Modal التحذير لتسجيل الخروج */}
      <Modal
        visible={showUnlinkWarning}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnlinkWarning(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تسجيل الخروج</Text>
              <TouchableOpacity
                onPress={() => setShowUnlinkWarning(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              هل أنت متأكد من تسجيل الخروج؟{'\n'}
              سيتم حذف البيانات المحلية من التطبيق{'\n'}
              لكنها ستبقى محفوظة في قاعدة البيانات
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
                  const result = await logoutFromDatabase();
                  if (result.success) {
                    console.log(result.message);
                  } else {
                    console.log('Error:', result.message);
                  }
                }}
              >
                <Unlink size={18} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>تسجيل الخروج</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal معلومات النسخ */}
      <Modal
        visible={showVersionInfo}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVersionInfo(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>معلومات النسخ</Text>
              <TouchableOpacity
                onPress={() => setShowVersionInfo(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.versionInfoScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.8</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح نهائي لمشكلة عدم ظهور تاريخ إنشاء الحساب{'\n'}
                  • تحسين آلية تحديث معلومات الحساب عند تسجيل الدخول{'\n'}
                  • إضافة useEffect إضافي لضمان تحديث البيانات في الواجهة{'\n'}
                  • تحسين استقرار عرض تاريخ إنشاء الحساب وعدد المستخدمين{'\n'}
                  • إصلاح مشكلة اختفاء التاريخ بعد ظهوره لثانية واحدة
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.7</Text>
                <Text style={styles.versionDescription}>
                  • إضافة معلومات الحساب في تبويب الإعدادات{'\n'}
                  • عرض تاريخ إنشاء الحساب من قاعدة البيانات{'\n'}
                  • عرض عدد المستخدمين المسجلين في النظام{'\n'}
                  • تحسين تنسيق التاريخ إلى الإنجليزية{'\n'}
                  • تحسين التصميم والألوان لمعلومات الحساب
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.6</Text>
                <Text style={styles.versionDescription}>
                  • تحسين مخطط الدخل السنوي في تبويب الإحصائيات{'\n'}
                  • إضافة قيم الراتب والحافز والأرباح داخل أعمدة المخطط{'\n'}
                  • تنسيق الأرقام: رقم واحد بعد الفاصلة داخل الأعمدة، 3 أرقام فوق العمود{'\n'}
                  • تحسين وضوح وعرض البيانات في المخططات
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.5</Text>
                <Text style={styles.versionDescription}>
                  • تحسين توازن أعمدة التقييم مع خطوط الشبكة في مخطط التقييمات الشهرية{"\n"}
                  • إصلاح مشكلة عدم توازن ارتفاع الأعمدة مع مواقع خطوط الشبكة{"\n"}
                  • تحسين مواقع النصوص فوق الأعمدة لتتوازن مع الأعمدة{"\n"}
                  • رفع جميع التقييمات في المحور الصادي لتحسين المظهر العام{"\n"}
                  • ضمان أن كل تقييم يقابل خط الشبكة الخاص به بدقة{"\n"}
                  • إصلاح مشكلة إخفاء القيم الصفرية في مدة الخدمة (إظهار 0 سنة، 0 شهر، 0 يوم)
                </Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.4</Text>
                <Text style={styles.versionDescription}>
                  • إضافة تقييم جديد "مكافئة خاصة"{"\n"}
                  • حذف تقييم "ضعيف" من جميع المخططات{"\n"}
                  • تحسين مخطط التقييمات الشهرية مع ترتيب جديد{"\n"}
                  • إصلاح مشكلة ظهور "مكافئة خاصة" في سطرين{"\n"}
                  • تحسين عرض التقييمات في جدول قصاصات الحافز{"\n"}
                  • إصلاح خطوط الشبكة المنقطة في مخطط التقييمات{"\n"}
                  • تحسين ألوان وترتيب التقييمات في جميع المخططات
                </Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.3</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة تعديل وحذف قصاصات الحافز{"\n"}
                  • إصلاح عدم تطابق القصاصات عند التعديل والحذف{"\n"}
                  • تحسين آلية التعامل مع القصاصات في الجداول{"\n"}
                  • إصلاح مشكلة فتح نافذة تعديل قصاصة خاطئة{"\n"}
                  • تحسين استقرار عمليات التعديل والحذف{"\n"}
                  • إصلاح مشكلة عدم تطابق المصفوفات المرتبة مع الأصلية
                </Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.2</Text>
                <Text style={styles.versionDescription}>
                  • تحسين عرض المخططات في تبويب الإحصائيات{"\n"}
                  • إصلاح تداخل الأعمدة في جميع المخططات{"\n"}
                  • عكس ترتيب الأعمدة (الأقدم على اليسار، الأحدث على اليمين){"\n"}
                  • إضافة إمكانية التمرير الأفقي لرؤية جميع البيانات{"\n"}
                  • تحسين تجربة المستخدم في عرض البيانات التاريخية{"\n"}
                  • إصلاح مشاكل العرض في المخططات المختلفة
                </Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.1</Text>
                <Text style={styles.versionDescription}>
                  • إضافة Google Analytics 4 وتتبع تغيّر المسارات (SPA).{"\n"}
                  • إدراج وسم GA ومعرّف القياس G-BFMDZ7E4C3 في public/index.html.{"\n"}
                  • تحسين تتبّع الزيارات دون تكرار الوسم.
                </Text>
              </View>
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.1.0</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة عدم ظهور التواريخ في القصاصات الجديدة.{"\n"}
                  • إضافة حقول "تاريخ الإضافة" و "تاريخ التعديل" تلقائياً.{"\n"}
                  • تحسين تجربة المستخدم - ظهور التواريخ فوراً عند الإضافة.{"\n"}
                  • تحديث "تاريخ التعديل" تلقائياً عند تعديل القصاصات.{"\n"}
                  • إصلاح مشكلة الحاجة للخروج والعودة لرؤية التواريخ.{"\n"}
                  • تحسين استقرار عرض البيانات في جميع الجداول.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.9</Text>
                <Text style={styles.versionDescription}>
                  • إضافة ألوان متناوبة للصفوف (zebra striping).{"\n"}
                  • الصفوف الزوجية: أبيض، الصفوف الفردية: رمادي فاتح.{"\n"}
                  • تحسين وضوح الخطوط الفاصلة بين الأعمدة والصفوف.{"\n"}
                  • تحسين قابلية القراءة في جميع الجداول.{"\n"}
                  • مظهر أكثر تنظيماً واحترافية للجداول.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.8</Text>
                <Text style={styles.versionDescription}>
                  • إضافة عمود "تاريخ الإضافة" في جميع جداول القصاصات.{"\n"}
                  • إضافة عمود "تاريخ التعديل" في جميع جداول القصاصات.{"\n"}
                  • تنسيق التواريخ: DD/MM/YYYY HH:MM AM/PM.{"\n"}
                  • تحسين عرض الجداول مع عرض أكبر للأعمدة.{"\n"}
                  • ضمان عرض التاريخ والوقت في سطر واحد.{"\n"}
                  • تكبير عناوين الأعمدة لسهولة القراءة.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.7</Text>
                                  <Text style={styles.versionDescription}>
                    • إصلاح مشكلة عدم ظهور Toast عند تسجيل الدخول والتسجيل.{"\n"}
                    • إضافة رسائل Toast مخصصة لعمليات تسجيل الدخول والتسجيل.{"\n"}
                    • تحسين نظام Toast ليعمل في جميع الصفحات.{"\n"}
                    • إصلاح زر فحص API و URL في نسخة الويب.{"\n"}
                    • تحسين الشريط العلوي: رفع النصوص وتكبير الخط.
                  </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.6</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة عدم ظهور Toast عند تسجيل الدخول والتسجيل.{"\n"}
                  • إضافة رسائل Toast مخصصة لعمليات تسجيل الدخول والتسجيل.{"\n"}
                  • تحسين نظام Toast ليعمل في جميع الصفحات.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.5</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة حذف القصاصات في نسخة الويب.{"\n"}
                  • استبدال Alert.alert بـ Modal مخصص للويب.{"\n"}
                  • تحسين تجربة المستخدم في نسخة الويب.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.4</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة عدم ظهور رسائل النجاح في الويب.{"\n"}
                  • تحسين نظام Toast للعمل في جميع الصفحات.{"\n"}
                  • إصلاح مشاكل التمرير في الإعدادات.
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.3</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشكلة حذف القصاصات في نسخة الويب{'\n'}
                  • إصلاح مشكلة عدم ظهور رسائل النجاح في الويب{'\n'}
                  • تحسين استجابة الأزرار في لوحة الأدوات للويب{'\n'}
                  • إصلاح مشكلة Alert.alert في الويب باستخدام window.confirm
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.2</Text>
                <Text style={styles.versionDescription}>
                  • إضافة زر معلومات النسخ في لوحة الأدوات{'\n'}
                  • عرض تاريخ التحديثات والإصلاحات لكل نسخة{'\n'}
                  • تحسين واجهة لوحة الأدوات
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.1</Text>
                <Text style={styles.versionDescription}>
                  • إصلاح مشاكل التمرير في شاشة الإعدادات{'\n'}
                  • إصلاح مشاكل التمرير في شاشة معلومات الحساب{'\n'}
                  • تحسين تجربة المستخدم عند وجود لوحة المفاتيح
                </Text>
              </View>
              
              <View style={styles.versionItem}>
                <Text style={styles.versionNumber}>النسخة 1.0.0</Text>
                <Text style={styles.versionDescription}>
                  • إضافة نظام المصادقة الجديد (تسجيل دخول/إنشاء حساب){'\n'}
                  • إصلاح مشكلة القيمة الافتراضية للمكافآت (250 → 0){'\n'}
                  • إضافة معالجة شاملة للأخطاء في قاعدة البيانات{'\n'}
                  • تحسين علامة المزامنة مع دعم حالة الخطأ{'\n'}
                  • إضافة معلومات النسخة في الإعدادات
                </Text>
              </View>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setShowVersionInfo(false)}
              >
                <Text style={styles.confirmButtonText}>إغلاق</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal نتيجة فحص API */}
      <Modal
        visible={showApiCheckResult}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowApiCheckResult(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>نتيجة فحص API و URL</Text>
              <TouchableOpacity
                onPress={() => setShowApiCheckResult(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalDescription} showsVerticalScrollIndicator={false}>
              <Text style={styles.apiCheckText}>{apiCheckMessage}</Text>
            </ScrollView>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setShowApiCheckResult(false)}
              >
                <Text style={styles.confirmButtonText}>إغلاق</Text>
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
                  setShowAuthChoice(true);
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
        message={toastMessage}
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
  versionContainer: {
    alignItems: 'flex-end',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  accountInfoRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 4,
    marginTop: 8,
  },
  accountInfoLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#000000',
    textAlign: 'right',
  },
  accountInfoValue: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#7C3AED',
    textAlign: 'right',
    marginRight: 4,
  },
  versionSpacing: {
    height: 12,
  },
  versionText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
  },
  versionInfoScroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  versionItem: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  versionNumber: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'right',
  },
  versionDescription: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    lineHeight: 20,
    textAlign: 'right',
  },
  apiCheckText: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    textAlign: 'right',
    lineHeight: 20,
  },
});