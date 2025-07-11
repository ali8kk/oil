import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Award, DollarSign, TrendingUp, ChevronRight } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import Toast from '@/components/Toast';
import IncentiveSlipsTable from '@/components/IncentiveSlipsTable';
import SalarySlipsTable from '@/components/SalarySlipsTable';
import ProfitsSlipsTable from '@/components/ProfitsSlipsTable';

import { useUserData } from '@/contexts/UserDataContext';

interface SlipCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function SlipCard({ icon, title, subtitle, color, onPress }: SlipCardProps) {
  return (
    <TouchableOpacity style={[styles.slipCard, { borderRightColor: color }]} onPress={onPress}>
      <ChevronRight size={20} color="#9CA3AF" />
      <View style={styles.slipContent}>
        <Text style={styles.slipTitle}>{title}</Text>
        <Text style={styles.slipSubtitle}>{subtitle}</Text>
      </View>
      <View style={[styles.slipIcon, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
    </TouchableOpacity>
  );
}

export default function SlipsScreen() {
  const { 
    isLoading, 
    showSaveToast, 
    isSyncing
  } = useUserData();
  const [refreshKey, setRefreshKey] = useState(0);
  const [showIncentiveTable, setShowIncentiveTable] = useState(false);
  const [showSalaryTable, setShowSalaryTable] = useState(false);
  const [showProfitsTable, setShowProfitsTable] = useState(false);

  // إعادة تحديث البيانات عند التركيز على الصفحة
  useFocusEffect(
    useCallback(() => {
      setRefreshKey(prev => prev + 1);
    }, [])
  );

  const handleSlipPress = (type: string) => {
    if (type === 'الحافز') {
      setShowIncentiveTable(true);
    } else if (type === 'الراتب') {
      setShowSalaryTable(true);
    } else if (type === 'الأرباح') {
      setShowProfitsTable(true);
    } else {
      console.log(`عرض معلومات قصاصات ${type}`);
      // يمكن إضافة التنقل إلى صفحة تفاصيل القصاصات الأخرى هنا
    }
  };

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
        <Text style={styles.sectionTitle}>القصاصات المالية</Text>
        
        <View style={styles.slipsContainer}>
          <SlipCard
            icon={<Award size={24} color="#F59E0B" />}
            title="قصاصات الحافز"
            subtitle="عرض وإدارة قصاصات الحوافز"
            color="#F59E0B"
            onPress={() => handleSlipPress('الحافز')}
          />
          
          <SlipCard
            icon={<DollarSign size={24} color="#10B981" />}
            title="قصاصات الراتب"
            subtitle="عرض وإدارة قصاصات الرواتب"
            color="#10B981"
            onPress={() => handleSlipPress('الراتب')}
          />
          
          <SlipCard
            icon={<TrendingUp size={24} color="#3B82F6" />}
            title="قصاصات الأرباح"
            subtitle="عرض وإدارة قصاصات الأرباح"
            color="#3B82F6"
            onPress={() => handleSlipPress('الأرباح')}
          />
        </View>
      </ScrollView>

      <Toast
        visible={showSaveToast}
        message="تم حفظ التغييرات بنجاح! ✅"
        type="success"
        duration={2000}
        onHide={() => {}}
      />

      {/* Incentive Slips Table Modal */}
      <IncentiveSlipsTable
        visible={showIncentiveTable}
        onClose={() => setShowIncentiveTable(false)}
      />

      {/* Salary Slips Table Modal */}
      <SalarySlipsTable
        visible={showSalaryTable}
        onClose={() => setShowSalaryTable(false)}
      />

      {/* Profits Slips Table Modal */}
      <ProfitsSlipsTable
        visible={showProfitsTable}
        onClose={() => setShowProfitsTable(false)}
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
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginVertical: 20,
    textAlign: 'right',
  },
  slipsContainer: {
    marginBottom: 24,
  },
  slipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRightWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  slipIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  slipContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  slipTitle: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginBottom: 4,
    textAlign: 'right',
  },
  slipSubtitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'right',
  },
});