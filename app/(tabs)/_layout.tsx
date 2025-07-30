import { Tabs } from 'expo-router';
import { Chrome as Home, User, Settings, ChartBar as BarChart3, FileText, Plus, Check, X } from 'lucide-react-native';
import { View, TouchableOpacity, StyleSheet, Text, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Award, DollarSign, TrendingUp } from 'lucide-react-native';
import IncentiveModal, { IncentiveData } from '../../components/IncentiveModal';
import SalaryModal, { SalaryData } from '../../components/SalaryModal';
import ProfitsModal, { ProfitsData } from '../../components/ProfitsModal';
import { useUserData } from '../../contexts/UserDataContext';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useSegments } from 'expo-router';
import SyncIndicator from '../../components/SyncIndicator';
import { Svg, Path } from 'react-native-svg';
import Ionicons from '@expo/vector-icons/Ionicons';

interface FabMenuItemProps {
  icon: React.ReactNode;
  title: string;
  onPress: () => void;
}

function FabMenuItem({ icon, title, onPress }: FabMenuItemProps) {
  return (
    <TouchableOpacity style={styles.fabMenuItem} onPress={onPress}>
      <View style={styles.fabMenuItemContent}>
        <Text style={styles.fabMenuItemText}>{title}</Text>
        <View style={styles.fabMenuItemIcon}>
          {icon}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function CustomTabBar() {
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showIncentiveModal, setShowIncentiveModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showProfitsModal, setShowProfitsModal] = useState(false);
  const { addIncentiveSlip, addSalarySlip, addProfitsSlip } = useUserData();
  
  // إضافة Animated Value للدوران
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const [currentIcon, setCurrentIcon] = useState<'plus' | 'x'>('plus');
  const [isAnimating, setIsAnimating] = useState(false);

  const handleFabPress = () => {
    if (isAnimating) return; // منع الضغط أثناء الدوران
    
    setIsAnimating(true);
    const newShowFabMenu = !showFabMenu;
    setShowFabMenu(newShowFabMenu);
    
    // تشغيل تأثير الدوران
    Animated.timing(rotateAnim, {
      toValue: newShowFabMenu ? 1 : 0,
      duration: 300, // تقليل المدة
      useNativeDriver: true,
    }).start(() => {
      // تغيير الأيقونة بعد انتهاء الدوران
      setCurrentIcon(newShowFabMenu ? 'x' : 'plus');
      setIsAnimating(false);
    });
  };

  const handleOverlayPress = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShowFabMenu(false);
    
    // تشغيل تأثير الدوران للعودة إلى +
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIcon('plus');
      setIsAnimating(false);
    });
  };

  const resetFabButton = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setShowFabMenu(false);
    
    // تشغيل تأثير الدوران للعودة إلى +
    Animated.timing(rotateAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setCurrentIcon('plus');
      setIsAnimating(false);
    });
  };

  const handleMenuItemPress = (type: string) => {
    setShowFabMenu(false);
    
    // إعادة تعيين الزر عند الضغط على أي خيار
    resetFabButton();
    
    if (type === 'حافز') {
      setShowIncentiveModal(true);
    } else if (type === 'راتب') {
      setShowSalaryModal(true);
    } else if (type === 'أرباح') {
      setShowProfitsModal(true);
    } else {
      console.log(`إضافة قصاصة ${type}`);
    }
  };

  const handleIncentiveSave = (data: IncentiveData) => {
    addIncentiveSlip(data);
    setShowIncentiveModal(false);
  };

  const handleSalarySave = (data: SalaryData) => {
    addSalarySlip(data);
    setShowSalaryModal(false);
  };

  const handleProfitsSave = (data: ProfitsData) => {
    addProfitsSlip(data);
    setShowProfitsModal(false);
  };

  return (
    <View style={styles.tabBarContainer}>
      {/* Sync Indicator */}
      {/* <SyncIndicator /> */}
      
      {/* FAB Menu */}
      {showFabMenu && (
        <View style={styles.fabMenuContainer}>
          <FabMenuItem
            icon={<Award size={20} color="#FFFFFF" />}
            title="قصاصة حافز"
            onPress={() => handleMenuItemPress('حافز')}
          />
          <FabMenuItem
            icon={<DollarSign size={20} color="#FFFFFF" />}
            title="قصاصة راتب"
            onPress={() => handleMenuItemPress('راتب')}
          />
          <FabMenuItem
            icon={<TrendingUp size={20} color="#FFFFFF" />}
            title="قصاصة أرباح"
            onPress={() => handleMenuItemPress('أرباح')}
          />
        </View>
      )}

      {/* FAB Button with White Circle */}
      <View style={styles.fabContainer}>
        {/* الحلقة البيضاء - تختفي عند فتح القائمة */}
        <Animated.View 
          style={[
            styles.fabWhiteCircle,
            {
              opacity: showFabMenu ? 0 : 1,
            }
          ]}
        />
        
        {/* الزر البنفسجي - يبقى ظاهراً دائماً */}
        <TouchableOpacity style={styles.fab} onPress={handleFabPress}>
          <Animated.View
            style={{
              transform: [{
                rotate: rotateAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '45deg']
                })
              }]
            }}
          >
            <Ionicons name="add" size={32} color="#fff" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Overlay */}
      {showFabMenu && (
        <TouchableOpacity 
          style={styles.overlay} 
          onPress={handleOverlayPress}
          activeOpacity={1}
        />
      )}

      {/* Incentive Modal */}
      <IncentiveModal
        visible={showIncentiveModal}
        onClose={() => setShowIncentiveModal(false)}
        onSave={handleIncentiveSave}
      />

      {/* Salary Modal */}
      <SalaryModal
        visible={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        onSave={handleSalarySave}
      />

      {/* Profits Modal */}
      <ProfitsModal
        visible={showProfitsModal}
        onClose={() => setShowProfitsModal(false)}
        onSave={handleProfitsSave}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();

  // استخراج اسم التبويب الحالي
  const currentTab = segments[segments.length - 1];
  let headerTitle = 'المعلومات الشخصية';
  if (currentTab === 'home') headerTitle = 'القصاصات';
  else if (currentTab === 'statistics') headerTitle = 'الإحصائيات';
  else if (currentTab === 'settings') headerTitle = 'الإعدادات';
  else if (currentTab === 'add') headerTitle = '';
  // أي قيمة أخرى أو فارغة تبقى 'المعلومات الشخصية'

  return (
    <>
      {/* الشريط العلوي البنفسجي */}
      <View style={[styles.topHeader, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{headerTitle}</Text>
          <View style={styles.syncContainer}>
            <SyncIndicator />
          </View>
        </View>
      </View>
      
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: '#E5E7EB',
            paddingBottom: 2,
            paddingTop: 2,
            height: 65,
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          },
          tabBarActiveTintColor: '#6B46C1',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarLabelStyle: {
            fontFamily: 'Cairo-SemiBold',
            fontSize: 11,
            marginTop: -2,
            marginBottom: 2,
          },
          tabBarIconStyle: {
            marginBottom: -4,
            marginTop: 2,
          },
          tabBarItemStyle: {
            paddingVertical: 2,
            justifyContent: 'flex-start',
            alignItems: 'center',
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'الرئيسية',
            tabBarIcon: ({ color, size }) => (
              <User size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="home"
          options={{
            title: 'القصاصات',
            tabBarIcon: ({ color, size }) => (
              <FileText size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            tabBarIcon: () => null,
            tabBarButton: () => null,
          }}
        />
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'الإحصائيات',
            tabBarIcon: ({ color, size }) => (
              <BarChart3 size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'الإعدادات',
            tabBarIcon: ({ color, size }) => (
              <Settings size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <CustomTabBar />
    </>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    marginLeft: -35,
    zIndex: 1001,
    // overflow: 'visible',
  },
  fabWhiteCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },

  fab: {
    position: 'absolute',
    top: 7,
    left: 7,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
    // elevation: 8,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 4 },
    // shadowOpacity: 0.3,
    // shadowRadius: 8,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 110,
    left: '50%',
    marginLeft: -80,
    zIndex: 1002,
    alignItems: 'center',
  },
  fabMenuItem: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    marginBottom: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabMenuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 160,
  },
  fabMenuItemText: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
  },
  fabMenuItemIcon: {
    marginLeft: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    top: -1000,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  syncIndicator: {
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  syncText: {
    fontSize: 10,
    fontFamily: 'Cairo-Regular',
    color: '#FFFFFF',
  },
  syncIconContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
  },
  halfCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
  },
  topHeader: {
    backgroundColor: '#6B46C1',
    paddingBottom: 8, // تقليل ارتفاع الشريط
    paddingTop: 4,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    position: 'relative',
    height: 50,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 16,
    flex: 1,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  syncContainer: {
    position: 'absolute',
    right: 5,
    top: '60%',
    transform: [{ translateY: -10 }],
  },
  spacer: {
    flex: 1,
  },
  fabHalfCircle: {
    position: 'absolute',
    top: -32,
    left: 0,
    right: 0,
    height: 32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#6B46C1',
    zIndex: 1,
  },
});