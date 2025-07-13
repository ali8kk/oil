import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings, RefreshCw } from 'lucide-react-native';
import { checkSupabaseConfig, testDirectConnection, clearSupabaseSession, supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AddScreen() {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        <TouchableOpacity
          style={styles.checkButton}
          onPress={handleCheckApiUrl}
        >
          <Settings size={24} color="#ffffff" />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>فحص API و URL</Text>
            <Text style={styles.buttonDescription}>يفحص صحة إعدادات قاعدة البيانات</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.checkButton, { backgroundColor: '#DC2626', marginTop: 16 }]}
          onPress={handleClearSessions}
        >
          <RefreshCw size={24} color="#ffffff" />
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>مسح الجلسات</Text>
            <Text style={styles.buttonDescription}>يحل مشكلة 401 ويمسح البيانات المحلية</Text>
          </View>
        </TouchableOpacity>
        

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  content: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 280,
    minHeight: 70,
  },
  buttonContent: {
    flex: 1,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#ffffff',
  },
  buttonDescription: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#ffffff',
    opacity: 0.9,
    marginTop: 4,
  },
});