import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Pen, Trash2, Plus, X } from 'lucide-react-native';
import { useUserData } from '@/contexts/UserDataContext';
import { IncentiveData } from './IncentiveModal';
import IncentiveModal from './IncentiveModal';

interface IncentiveSlipsTableProps {
  visible: boolean;
  onClose: () => void;
}

export default function IncentiveSlipsTable({ visible, onClose }: IncentiveSlipsTableProps) {
  const { incentiveSlips, updateIncentiveSlip, deleteIncentiveSlip, addIncentiveSlip } = useUserData();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (data: IncentiveData) => {
    if (editingIndex !== null) {
      updateIncentiveSlip(editingIndex, data);
      setEditingIndex(null);
    }
  };

  const handleDelete = (index: number) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من حذف هذه القصاصة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: () => deleteIncentiveSlip(index)
        }
      ]
    );
  };

  const handleAddNew = (data: IncentiveData) => {
    addIncentiveSlip(data);
    setShowAddModal(false);
  };

  const formatNumber = (num: string) => {
    if (!num) return '0';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // تحويل الشهر من النص إلى الأرقام
  const formatMonthToNumbers = (monthText: string) => {
    if (!monthText) return '';
    
    const monthNames = {
      'يناير': '01',
      'فبراير': '02',
      'مارس': '03',
      'أبريل': '04',
      'مايو': '05',
      'يونيو': '06',
      'يوليو': '07',
      'أغسطس': '08',
      'سبتمبر': '09',
      'أكتوبر': '10',
      'نوفمبر': '11',
      'ديسمبر': '12'
    };

    // استخراج اسم الشهر والسنة
    const parts = monthText.split(' ');
    if (parts.length === 2) {
      const monthName = parts[0];
      const year = parts[1];
      const monthNumber = monthNames[monthName as keyof typeof monthNames];
      return monthNumber ? `${monthNumber}/${year}` : monthText;
    }
    
    return monthText;
  };

  // ترتيب القصاصات تنازلياً حسب التاريخ
  const sortedIncentiveSlips = [...incentiveSlips].sort((a, b) => {
    const dateA = formatMonthToNumbers(a.month);
    const dateB = formatMonthToNumbers(b.month);
    
    // تحويل التاريخ إلى رقم للمقارنة
    const getDateValue = (dateStr: string) => {
      const [month, year] = dateStr.split('/');
      return parseInt(year) * 100 + parseInt(month);
    };
    
    return getDateValue(dateB) - getDateValue(dateA); // ترتيب تنازلي
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.title}>قصاصات الحافز</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)} 
              style={styles.addButton}
            >
              <Plus size={24} color="#6B46C1" />
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            {incentiveSlips.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لا توجد قصاصات حافز</Text>
                <TouchableOpacity 
                  style={styles.addFirstButton}
                  onPress={() => setShowAddModal(true)}
                >
                  <Plus size={20} color="#FFFFFF" />
                  <Text style={styles.addFirstButtonText}>إضافة أول قصاصة</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={true}
                style={styles.horizontalScroll}
                contentContainerStyle={styles.scrollContent}
              >
                <View style={styles.table}>
                  {/* Table Header - الإجراءات أولاً ثم الشهر */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.actionCell]}>الإجراءات</Text>
                    <Text style={[styles.headerCell, styles.monthCell]}>الشهر</Text>
                    <Text style={[styles.headerCell, styles.pointsCell]}>النقاط</Text>
                    <Text style={[styles.headerCell, styles.ratingCell]}>التقييم</Text>
                    <Text style={[styles.headerCell, styles.leaveCell]}>الإجازات الاعتيادية</Text>
                    <Text style={[styles.headerCell, styles.leaveCell]}>الإجازات المرضية</Text>
                    <Text style={[styles.headerCell, styles.rewardsCell]}>المكافآت</Text>
                    <Text style={[styles.headerCell, styles.incentiveCell]}>الحافز الكلي</Text>
                  </View>

                  {/* Table Rows - الإجراءات أولاً ثم الشهر */}
                  <ScrollView 
                    style={styles.tableBody}
                    showsVerticalScrollIndicator={true}
                  >
                    {sortedIncentiveSlips.map((slip, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.cell, styles.actionCell]}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEdit(incentiveSlips.indexOf(slip))}
                          >
                            <Pen size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDelete(incentiveSlips.indexOf(slip))}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.cell, styles.monthCell]}>
                          {formatMonthToNumbers(slip.month)}
                        </Text>
                        <Text style={[styles.cell, styles.pointsCell]}>
                          {formatNumber(slip.points)}
                        </Text>
                        <Text style={[styles.cell, styles.ratingCell]}>
                          {slip.rating}
                        </Text>
                        <Text style={[styles.cell, styles.leaveCell]}>
                          {slip.regularLeave || '0'}
                        </Text>
                        <Text style={[styles.cell, styles.leaveCell]}>
                          {slip.sickLeave || '0'}
                        </Text>
                        <Text style={[styles.cell, styles.rewardsCell]}>
                          {formatNumber(slip.rewards)}
                        </Text>
                        <Text style={[styles.cell, styles.incentiveCell]}>
                          {formatNumber(slip.totalIncentive)}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Edit Modal */}
        {editingIndex !== null && (
          <IncentiveModal
            visible={true}
            onClose={() => setEditingIndex(null)}
            onSave={handleSaveEdit}
            initialData={incentiveSlips[editingIndex]}
          />
        )}

        {/* Add Modal */}
        <IncentiveModal
          visible={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleAddNew}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    height: '90%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  addButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  tableContainer: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    marginBottom: 20,
  },
  addFirstButton: {
    backgroundColor: '#6B46C1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFirstButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  horizontalScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingRight: 20,
  },
  table: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minWidth: 800, // عرض أدنى للجدول لضمان ظهور جميع الأعمدة
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    borderBottomWidth: 2,
    borderBottomColor: '#5B21B6',
  },
  tableBody: {
    flex: 1, // استخدام المساحة المتاحة بالكامل
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
    minHeight: 50,
  },
  headerCell: {
    fontSize: 14,
    fontFamily: 'Cairo-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#5B21B6',
    textAlignVertical: 'center',
  },
  cell: {
    fontSize: 13,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRightWidth: 1,
    borderRightColor: '#F3F4F6',
    textAlignVertical: 'center',
  },
  // تحديد عرض ثابت لكل عمود - الإجراءات أولاً
  actionCell: {
    width: 100,
    minWidth: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  monthCell: {
    width: 100,
    minWidth: 100,
  },
  pointsCell: {
    width: 80,
    minWidth: 80,
  },
  ratingCell: {
    width: 90,
    minWidth: 90,
  },
  leaveCell: {
    width: 120,
    minWidth: 120,
  },
  rewardsCell: {
    width: 100,
    minWidth: 100,
  },
  incentiveCell: {
    width: 120,
    minWidth: 120,
  },
  actionButton: {
    padding: 8,
    marginHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});