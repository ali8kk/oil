import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import { Calendar, X, Check } from 'lucide-react-native';

interface DatePickerProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  onDateChange: (date: string) => void;
  placeholder?: string;
}

const { height: screenHeight } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const SCROLL_THROTTLE = 100; // تأخير بين التحديثات

interface NumberPickerProps {
  values: number[];
  selectedValue: number;
  onValueChange: (value: number) => void;
  title: string;
}

function NumberPicker({ values, selectedValue, onValueChange, title }: NumberPickerProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const lastUpdateTime = useRef(0);

  useEffect(() => {
    // تحديد الموضع الابتدائي للعنصر المحدد
    const selectedIndex = values.findIndex(val => val === selectedValue);
    if (selectedIndex !== -1 && scrollViewRef.current) {
      const offset = selectedIndex * ITEM_HEIGHT;
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: offset,
          animated: false
        });
      }, 100);
    }
  }, [selectedValue, values]);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const selectedVal = values[index];
    
    if (selectedVal !== undefined && selectedVal !== selectedValue && !isScrolling) {
      const now = Date.now();
      if (now - lastUpdateTime.current > SCROLL_THROTTLE) {
        lastUpdateTime.current = now;
        onValueChange(selectedVal);
      }
    }
  };

  const handleScrollBegin = () => {
    setIsScrolling(true);
    // إيقاف أي تحديثات أثناء التمرير
  };

  const handleScrollEnd = (event: any) => {
    setIsScrolling(false);
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const selectedVal = values[index];
    
    if (selectedVal !== undefined) {
      onValueChange(selectedVal);
      // محاذاة العنصر المحدد مع تأخير صغير
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: index * ITEM_HEIGHT,
          animated: true
        });
      }, 100);
    }
  };

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerTitle}>{title}</Text>
      <View style={styles.pickerWrapper}>
        {/* خط التحديد العلوي */}
        <View style={[styles.selectionLine, styles.selectionLineTop]} />
        {/* خط التحديد السفلي */}
        <View style={[styles.selectionLine, styles.selectionLineBottom]} />
        
        <ScrollView
          ref={scrollViewRef}
          style={styles.picker}
          contentContainerStyle={{
            paddingTop: ITEM_HEIGHT * 2,
            paddingBottom: ITEM_HEIGHT * 2,
          }}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="normal"
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBegin}
          onScrollEndDrag={handleScrollEnd}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={64}
          bounces={false}
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
        >
          {values.map((value, index) => {
            const isSelected = value === selectedValue;
            return (
              <View
                key={value}
                style={[
                  styles.pickerItem,
                  isSelected && styles.selectedPickerItem
                ]}
              >
                <Text style={[
                  styles.pickerItemText,
                  isSelected && styles.selectedPickerItemText
                ]}>
                  {value.toString().padStart(2, '0')}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

export default function DatePicker({ icon, label, value, onDateChange, placeholder }: DatePickerProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDay, setTempDay] = useState(1);
  const [tempMonth, setTempMonth] = useState(1);
  const [tempYear, setTempYear] = useState(new Date().getFullYear());

  // تحويل التاريخ من dd/mm/yyyy إلى مكونات منفصلة
  useEffect(() => {
    if (value) {
      const [day, month, year] = value.split('/');
      setTempDay(parseInt(day) || 1);
      setTempMonth(parseInt(month) || 1);
      setTempYear(parseInt(year) || new Date().getFullYear());
    } else {
      // تعيين التاريخ الحالي كقيمة افتراضية
      const now = new Date();
      setTempDay(now.getDate());
      setTempMonth(now.getMonth() + 1);
      setTempYear(now.getFullYear());
    }
  }, [value]);

  // إنشاء قائمة الأيام (1-31)
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  
  // إنشاء قائمة الشهور (1-12)
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  // إنشاء قائمة السنوات (من 1970 إلى 2050)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 81 }, (_, i) => 1970 + i);

  // تحديث عدد الأيام حسب الشهر والسنة
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const maxDaysInSelectedMonth = getDaysInMonth(tempMonth, tempYear);
  const availableDays = days.slice(0, maxDaysInSelectedMonth);

  // التأكد من أن اليوم المحدد لا يتجاوز عدد أيام الشهر
  useEffect(() => {
    if (tempDay > maxDaysInSelectedMonth) {
      setTempDay(maxDaysInSelectedMonth);
    }
  }, [tempMonth, tempYear, maxDaysInSelectedMonth]);

  const handleConfirm = () => {
    const formattedDate = `${tempDay.toString().padStart(2, '0')}/${tempMonth.toString().padStart(2, '0')}/${tempYear}`;
    onDateChange(formattedDate);
    setShowPicker(false);
  };

  const handleCancel = () => {
    // استعادة القيم السابقة
    if (value) {
      const [day, month, year] = value.split('/');
      setTempDay(parseInt(day) || 1);
      setTempMonth(parseInt(month) || 1);
      setTempYear(parseInt(year) || new Date().getFullYear());
    }
    setShowPicker(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View style={styles.fieldIcon}>
          {icon}
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.dateButton}
        onPress={() => setShowPicker(true)}
      >
        <Calendar size={20} color="#9CA3AF" />
        <Text style={[styles.dateText, !value && styles.placeholderText]}>
          {value || placeholder || 'اختر التاريخ'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={showPicker}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={handleCancel}>
                <X size={24} color="#6B46C1" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>اختيار التاريخ</Text>
              <TouchableOpacity onPress={handleConfirm}>
                <Check size={24} color="#6B46C1" />
              </TouchableOpacity>
            </View>

            <View style={styles.datePickersContainer}>
              <NumberPicker
                values={availableDays}
                selectedValue={tempDay}
                onValueChange={setTempDay}
                title="اليوم"
              />
              
              <NumberPicker
                values={months}
                selectedValue={tempMonth}
                onValueChange={setTempMonth}
                title="الشهر"
              />
              
              <NumberPicker
                values={years}
                selectedValue={tempYear}
                onValueChange={setTempYear}
                title="السنة"
              />
            </View>

            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText}>
                التاريخ المحدد: {tempDay.toString().padStart(2, '0')}/{tempMonth.toString().padStart(2, '0')}/{tempYear}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>تأكيد</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>إلغاء</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'right',
    flex: 1,
  },
  fieldIcon: {
    marginLeft: 12,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    minHeight: 44,
  },
  dateText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#1F2937',
    textAlign: 'right',
    flex: 1,
    marginRight: 8,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  datePickersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pickerContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  pickerTitle: {
    fontSize: 14,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B46C1',
    marginBottom: 8,
    textAlign: 'center',
  },
  pickerWrapper: {
    position: 'relative',
    height: PICKER_HEIGHT,
    width: 80,
  },
  picker: {
    height: PICKER_HEIGHT,
  },
  selectionLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#6B46C1',
    zIndex: 1,
  },
  selectionLineTop: {
    top: ITEM_HEIGHT * 2,
  },
  selectionLineBottom: {
    top: ITEM_HEIGHT * 3,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedPickerItem: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
  },
  pickerItemText: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  selectedPickerItemText: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#6B46C1',
  },
  selectedDateContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    alignItems: 'center',
  },
  selectedDateText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#6B7280',
  },
});