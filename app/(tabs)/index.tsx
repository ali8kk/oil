import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Button } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Eye, EyeOff, BookOpen } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import Toast from '../../components/Toast';

import { useUserData } from '../../contexts/UserDataContext';

interface InfoRowProps {
  label: string;
  value: string;
  isHidden?: boolean;
  onToggleVisibility?: () => void;
  isServiceDuration?: boolean;
  isLive?: boolean;
  isRewardsRow?: boolean;
}

function InfoRow({ label, value, isHidden = false, onToggleVisibility, isServiceDuration = false, isLive = false, isRewardsRow = false }: InfoRowProps) {
  const { userData, calculateServiceDuration } = useUserData();
  const [liveValue, setLiveValue] = useState(value);

  // تحديث القيمة المباشرة كل ثانية للخدمة
  useEffect(() => {
    if (isLive && isServiceDuration && userData.startDate) {
      const interval = setInterval(() => {
        setLiveValue(calculateServiceDuration(userData.startDate));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLive, isServiceDuration, userData.startDate, calculateServiceDuration]);

  const displayValue = isLive ? liveValue : value;

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoContent}>
        <View style={isServiceDuration ? styles.serviceValueContainer : styles.valueContainer}>
          <Text 
            style={[
              styles.value,
              isServiceDuration && styles.serviceDurationValue,
              isRewardsRow && styles.rewardsValue
            ]} 
            numberOfLines={isServiceDuration ? undefined : 1}
            ellipsizeMode="tail"
          >
            {isHidden ? '******' : (displayValue || 'غير محدد')}
          </Text>
          {onToggleVisibility && (
            <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
              {isHidden ? (
                <EyeOff size={20} color="#6B46C1" />
              ) : (
                <Eye size={20} color="#6B46C1" />
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={isServiceDuration ? styles.serviceLabel : styles.label} numberOfLines={1}>{label}:</Text>
      </View>
    </View>
  );
}

interface SmallLabelInfoRowProps extends InfoRowProps {
  smallLabel?: boolean;
}

function SmallLabelInfoRow({ label, value, isHidden = false, onToggleVisibility, isServiceDuration = false, isLive = false, isRewardsRow = false, smallLabel = false }: SmallLabelInfoRowProps) {
  const { userData, calculateServiceDuration } = useUserData();
  const [liveValue, setLiveValue] = useState(value);

  // تحديث القيمة المباشرة كل ثانية للخدمة
  useEffect(() => {
    if (isLive && isServiceDuration && userData.startDate) {
      const interval = setInterval(() => {
        setLiveValue(calculateServiceDuration(userData.startDate));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isLive, isServiceDuration, userData.startDate, calculateServiceDuration]);

  const displayValue = isLive ? liveValue : value;

  return (
    <View style={styles.infoRow}>
      <View style={styles.infoContent}>
        <View style={styles.valueContainer}>
          <Text 
            style={[
              styles.value,
              isServiceDuration && styles.serviceDurationValue,
              isRewardsRow && styles.rewardsValue
            ]} 
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isHidden ? '******' : (displayValue || 'غير محدد')}
          </Text>
          {onToggleVisibility && (
            <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeButton}>
              {isHidden ? (
                <EyeOff size={20} color="#6B46C1" />
              ) : (
                <Eye size={20} color="#6B46C1" />
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={[styles.label, smallLabel && styles.smallLabel]} numberOfLines={1}>{label}:</Text>
      </View>
    </View>
  );
}

interface CourseCheckboxProps {
  courseName: string;
  isCompleted: boolean;
  onToggle: () => void;
}

function CourseCheckbox({ courseName, isCompleted, onToggle }: CourseCheckboxProps) {
  return (
    <TouchableOpacity style={styles.courseItem} onPress={onToggle}>
      <View style={styles.courseContent}>
        <View style={[styles.checkbox, isCompleted && styles.checkboxChecked]}>
          {isCompleted && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <Text style={[styles.courseName, isCompleted && styles.courseNameCompleted]}>
          {courseName}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function PersonalInfoScreen() {
  const { userData, calculateServiceDuration, calculateServiceDays, getCurrentFiscalYear, checkAndResetRewards, updateCourseCompletion, isLoading, showSaveToast, isSyncing, salarySlips, incentiveSlips, manualSyncing, isConnectedToDatabase, setManualSyncing } = useUserData();
  const [isRewardsHidden, setIsRewardsHidden] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);



  const serviceDays = calculateServiceDays(userData.startDate);

  // حساب إجمالي المكافآت من القصاصات الفعلية


  // دالة لتنسيق الأرقام الصحيحة (للمكافآت الكلية)
  const formatInteger = (num: string) => {
    if (!num) return 'غير محدد';
    const cleanNum = num.replace(/,/g, '');
    const intNum = Math.round(parseFloat(cleanNum));
    if (isNaN(intNum)) return 'غير محدد';
    return intNum.toLocaleString('en-US');
  };

  // دالة لتنسيق الأرقام العشرية (لرصيد المرضية)
  const formatDecimal = (num: string) => {
    if (!num) return 'غير محدد';
    const cleanNum = num.replace(/,/g, '');
    const floatNum = parseFloat(cleanNum);
    if (isNaN(floatNum)) return 'غير محدد';
    return floatNum.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  };

  // إعادة تحديث البيانات عند التركيز على الصفحة
  useFocusEffect(
    useCallback(() => {
      // التحقق من تصفير المكافآت عند التركيز على الصفحة
      checkAndResetRewards();
      setRefreshKey(prev => prev + 1);
    }, [checkAndResetRewards])
  );

  // الحصول على السنة المالية الحالية
  const fiscalYear = getCurrentFiscalYear();

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6B46C1" />
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false} key={refreshKey}>
        {/* حقل الدرجة والمرحلة */}
        <View style={styles.gradeStageContainer}>
          <Text style={styles.gradeStageText}>
            المرحلة: <Text style={styles.gradeStageValue}>{userData.stage || '1'}</Text>
          </Text>
          <Text style={styles.gradeStageText}>
            الدرجة: <Text style={styles.gradeStageValue}>{userData.grade || '10'}</Text>
          </Text>
        </View>
        
        <View style={styles.card}>
          <InfoRow label="الاسم" value={userData.name} />
          <InfoRow label="رقم الحاسبة" value={userData.computerId} />
          <InfoRow label="رصيد الإجازات" value={userData.vacationBalance ? `${userData.vacationBalance} يوم` : 'غير محدد'} />
          <InfoRow label="رصيد المرضية" value={userData.sickLeaveBalance ? `${formatDecimal(userData.sickLeaveBalance)} يوم` : 'غير محدد'} />
          <InfoRow label="الترقية القادمة" value={userData.nextPromotionDate} />
          <InfoRow label="العلاوة القادمة" value={userData.nextAllowanceDate} />
          <InfoRow 
            label="الخدمة" 
            value={calculateServiceDuration(userData.startDate)} 
            isServiceDuration={true}
            isLive={!!userData.startDate}
          />
          <InfoRow label="عدد أيام الخدمة" value={serviceDays > 0 ? `${serviceDays} يوم` : 'غير محدد'} />
          <SmallLabelInfoRow 
            label={`مكافآت سنة ${fiscalYear}`}
            value={userData.totalRewards && parseFloat(userData.totalRewards) > 0 ? `${formatInteger(userData.totalRewards)} دينار` : 'غير محدد'}
            isHidden={isRewardsHidden}
            onToggleVisibility={() => setIsRewardsHidden(!isRewardsHidden)}
            isRewardsRow={true}
            smallLabel={true}
          />
          
          {/* حقل الدورات */}
          <View style={styles.coursesSection}>
            <View style={styles.coursesHeader}>
              <BookOpen size={20} color="#6B46C1" />
              <Text style={styles.coursesTitle}>الدورات:</Text>
            </View>
            <View style={styles.coursesContainer}>
              {userData.coursesNames.map((courseName, index) => (
                <CourseCheckbox
                  key={index}
                  courseName={courseName}
                  isCompleted={userData.coursesCompleted[index] || false}
                  onToggle={() => updateCourseCompletion(index, !userData.coursesCompleted[index])}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    marginTop: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 80, // إضافة مساحة للزر
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  infoRow: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 15,
  },
  infoContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 24,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    minWidth: 120,
    maxWidth: 140,
  },
  smallLabel: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    minWidth: 120,
    maxWidth: 160,
  },
  serviceLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    minWidth: 50,
    maxWidth: 60,
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
    justifyContent: 'flex-start',
    paddingRight: 5,
  },
  serviceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2.2,
    justifyContent: 'flex-start',
    paddingRight: 8,
  },
  value: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B46C1',
    textAlign: 'left',
    flex: 1,
  },
  serviceDurationValue: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B46C1',
    textAlign: 'left',
    flex: 1,
    paddingRight: 3,
    lineHeight: 20,
  },
  rewardsValue: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B46C1',
    textAlign: 'left',
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  gradeStageContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
    marginHorizontal: 20,
    gap: 20,
  },
  gradeStageText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
  gradeStageValue: {
    fontSize: 12,
    fontFamily: 'Cairo-Bold',
    color: '#6B46C1',
  },
  coursesSection: {
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  coursesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
  coursesTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    marginRight: 8,
  },
  courseItem: {
    marginBottom: 16,
    width: '100%',
  },
  courseContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 4,
  },
  courseName: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    marginRight: 12,
    textAlign: 'right',
    flex: 1,
  },
  courseNameCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  coursesContainer: {
    gap: 8,
  },
});