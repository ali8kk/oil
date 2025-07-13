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

function SyncIndicator() {
  const { isSyncing, isConnectedToDatabase } = useUserData();
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('SyncIndicator - isSyncing:', isSyncing, 'isConnectedToDatabase:', isConnectedToDatabase);
    
    if (isSyncing && isConnectedToDatabase) {
      console.log('Starting sync indicator');
      setShowSyncMessage(true);
      setSyncCompleted(false);
      
      // بدء دوران الكرة
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else if (!isSyncing && showSyncMessage && isConnectedToDatabase) {
      console.log('Sync completed');
      // إيقاف الدوران وإظهار علامة الصح
      spinValue.stopAnimation();
      setSyncCompleted(true);
      
      // إخفاء الرسالة بعد ثانيتين
      setTimeout(() => {
        setShowSyncMessage(false);
        setSyncCompleted(false);
      }, 2000);
    }
  }, [isSyncing, isConnectedToDatabase]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // للاختبار - إظهار المؤشر دائماً
  return (
    <View style={styles.syncIndicator}>
      <Text style={styles.syncText}>
        {syncCompleted ? 'تمت المزامنة' : 'يتم المزامنة'}
      </Text>
      <View style={styles.syncIconContainer}>
        {syncCompleted ? (
          <Check size={12} color="#FFFFFF" />
        ) : (
          <Animated.View style={[styles.spinningCircle, { transform: [{ rotate: spin }] }]}>
            <View style={styles.halfCircle} />
          </Animated.View>
        )}
      </View>
    </View>
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
        <View style={styles.fabWhiteCircle}>
          <TouchableOpacity 
            style={styles.fab} 
            onPress={handleFabPress}
          >
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
              <Plus size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>
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
  return (
    <>
      {/* تم حذف الشريط العلوي البنفسجي */}
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
            elevation: 8,
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
    bottom: 35,
    left: '50%',
    marginLeft: -32,
    zIndex: 1001,
  },
  fabWhiteCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6B46C1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 110,
    left: '50%',
    marginLeft: -80,
    zIndex: 1000,
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
    position: 'absolute',
    top: -45,
    right: 15,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 9999,
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
    fontWeight: 'bold',
  },
  syncIconContainer: {
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinningCircle: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  halfCircle: {
    width: 12,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
});