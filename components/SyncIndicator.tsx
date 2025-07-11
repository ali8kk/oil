import { View, Text, Animated, StyleSheet } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react-native';
import { useUserData } from '@/contexts/UserDataContext';

export default function SyncIndicator() {
  const { isSyncing, isConnectedToDatabase } = useUserData();
  const [showSyncMessage, setShowSyncMessage] = useState(false);
  const [syncCompleted, setSyncCompleted] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isSyncing && isConnectedToDatabase) {
      setShowSyncMessage(true);
      setSyncCompleted(false);
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        })
      ).start();
    } else if (!isSyncing && showSyncMessage && isConnectedToDatabase) {
      spinValue.stopAnimation();
      setSyncCompleted(true);
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

  if (!isConnectedToDatabase) return null;
  if (!showSyncMessage && !syncCompleted) return null;

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

const styles = StyleSheet.create({
  syncIndicator: {
    position: 'absolute',
    top: 45,
    right: 6 ,
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
    backgroundColor: 'transparent',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
}); 