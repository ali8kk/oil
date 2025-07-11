import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Check } from 'lucide-react-native';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onHide?: () => void;
}

const { width } = Dimensions.get('window');

export default function Toast({ 
  visible, 
  message, 
  type = 'success', 
  duration = 3000, 
  onHide 
}: ToastProps) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // إظهار الإشعار
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();

      // إخفاء الإشعار تلقائياً
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      })
    ]).start(() => {
      onHide?.();
    });
  };

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#10B981',
          borderColor: '#059669',
        };
      case 'error':
        return {
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
        };
      case 'info':
        return {
          backgroundColor: '#3B82F6',
          borderColor: '#2563EB',
        };
      default:
        return {
          backgroundColor: '#10B981',
          borderColor: '#059669',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <Check size={20} color="#FFFFFF" />;
      case 'error':
        return <Check size={20} color="#FFFFFF" />;
      case 'info':
        return <Check size={20} color="#FFFFFF" />;
      default:
        return <Check size={20} color="#FFFFFF" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY }],
          opacity,
        }
      ]}
    >
      <View style={[styles.toast, getToastStyle()]}>
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.icon}>
            {getIcon()}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    zIndex: 1000,
    elevation: 1000,
  },
  toast: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
    textAlign: 'right',
    flex: 1,
  },
  icon: {
    marginLeft: 12,
  },
});