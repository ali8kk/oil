import { View, Text, Animated, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react-native';
import { useUserData } from '../contexts/UserDataContext';

export default function SyncIndicator() {
  const { manualSyncing, isConnectedToDatabase, syncError } = useUserData();
  const [show, setShow] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [showError, setShowError] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;
  const prevManualSyncing = useRef(false);

  useEffect(() => {
    // عند بدء المزامنة اليدوية
    if (manualSyncing) {
      setShow(true);
      setShowCompleted(false);
      setShowError(false);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        })
      ).start();
    }
    // عند انتهاء المزامنة اليدوية
    if (!manualSyncing && prevManualSyncing.current) {
      spinValue.stopAnimation();
      setShowCompleted(true);
      setTimeout(() => {
        setShow(false);
        setShowCompleted(false);
      }, 1500);
    }
    prevManualSyncing.current = manualSyncing;
    // إذا فقد الاتصال بقاعدة البيانات أخفِ العلامة
    if (!isConnectedToDatabase) {
      setShow(false);
      setShowCompleted(false);
      setShowError(false);
    }
  }, [manualSyncing, isConnectedToDatabase]);

  // معالجة حالة الخطأ
  useEffect(() => {
    if (syncError) {
      setShow(true);
      setShowCompleted(false);
      setShowError(true);
      spinValue.stopAnimation();
      setTimeout(() => {
        setShow(false);
        setShowError(false);
      }, 3000);
    }
  }, [syncError]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (!isConnectedToDatabase || (!show && !showCompleted && !showError)) return null;

  console.log('SyncIndicator:', { manualSyncing, isConnectedToDatabase, show, showCompleted, showError });

  return (
    <View style={[
      styles.syncIndicator,
      showError && styles.syncIndicatorError
    ]}>
      <Text style={styles.syncText}>
        {showError ? 'فشلت المزامنة' : showCompleted ? 'تمت المزامنة' : 'يتم المزامنة'}
      </Text>
      <View style={styles.syncIconContainer}>
        {showError ? (
          <Text style={styles.errorIcon}>✕</Text>
        ) : showCompleted ? (
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

const styles = StyleSheet.create({
  syncIndicator: {
    backgroundColor: '#10B981',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  syncIndicatorError: {
    backgroundColor: '#EF4444',
  },
  syncText: {
    fontSize: 9,
    fontFamily: 'Cairo-Regular',
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  syncIconContainer: {
    width: 12,
    height: 12,
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
    width: 10,
    height: 10,
    backgroundColor: 'transparent',
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  errorIcon: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
}); 