import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { X, Plus, Edit, Trash2 } from 'lucide-react-native';
import { useUserData } from '../contexts/UserDataContext';
import IncentiveModal from './IncentiveModal';

interface IncentiveSlipsTableProps {
  visible: boolean;
  onClose: () => void;
}

export default function IncentiveSlipsTable({ visible, onClose }: IncentiveSlipsTableProps) {
  const { incentiveSlips, updateIncentiveSlip, deleteIncentiveSlip, addIncentiveSlip } = useUserData();
  const [editingSlip, setEditingSlip] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingSlip, setDeletingSlip] = useState<any>(null);

  const handleEdit = (slip: any) => {
    setEditingSlip(slip);
  };

  const handleSaveEdit = (data: any) => {
    if (editingSlip) {
      // إيجاد index القصاصة في المصفوفة الأصلية
      const originalIndex = incentiveSlips.findIndex(item => 
        item.created_at === editingSlip.created_at && 
        item.month === editingSlip.month
      );
      if (originalIndex !== -1) {
        updateIncentiveSlip(originalIndex, data);
      }
      setEditingSlip(null);
    }
  };

  const handleDelete = (slip: any) => {
    setDeletingSlip(slip);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (deletingSlip) {
      // إيجاد index القصاصة في المصفوفة الأصلية
      const originalIndex = incentiveSlips.findIndex(item => 
        item.created_at === deletingSlip.created_at && 
        item.month === deletingSlip.month
      );
      if (originalIndex !== -1) {
        deleteIncentiveSlip(originalIndex);
      }
      setShowDeleteModal(false);
      setDeletingSlip(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingSlip(null);
  };

  const handleAddNew = (data: any) => {
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
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <Text style={[styles.headerCell, styles.actionCell]}>الإجراءات</Text>
                    <Text style={[styles.headerCell, styles.monthCell]}>الشهر</Text>
                    <Text style={[styles.headerCell, styles.pointsCell]}>النقاط</Text>
                    <Text style={[styles.headerCell, styles.ratingCell]}>التقييم</Text>
                    <Text style={[styles.headerCell, styles.leaveCell]}>الإجازات</Text>
                    <Text style={[styles.headerCell, styles.rewardsCell]}>المكافآت</Text>
                    <Text style={[styles.headerCell, styles.incentiveCell]}>الحافز الكلي</Text>
                    <Text style={[styles.headerCell, styles.dateCell, { fontSize: 13 }]}>تاريخ الإضافة</Text>
                    <Text style={[styles.headerCell, styles.dateCell, { fontSize: 13 }]}>تاريخ التعديل</Text>
                  </View>

                  {/* Table Body */}
                  <ScrollView 
                    style={styles.tableBody}
                    showsVerticalScrollIndicator={true}
                  >
                    {sortedIncentiveSlips.map((slip, index) => (
                      <View key={index} style={[
                        styles.tableRow,
                        index % 2 === 0 ? styles.evenRow : styles.oddRow
                      ]}>
                        <View style={[styles.cell, styles.actionCell]}>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleEdit(slip)}
                          >
                            <Edit size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => handleDelete(slip)}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.cell, styles.monthCell]}>{slip.month}</Text>
                        <Text style={[styles.cell, styles.pointsCell]}>{formatNumber(slip.points)}</Text>
                        <Text style={[
                          styles.cell, 
                          styles.ratingCell,
                          slip.rating === 'مكافئة خاصة' ? { fontSize: 11, lineHeight: 14 } : {}
                        ]}>
                          {slip.rating}
                        </Text>
                        <Text style={[styles.cell, styles.leaveCell]}>
                          {slip.regularLeave || '0'} / {slip.sickLeave || '0'}
                        </Text>
                        <Text style={[styles.cell, styles.rewardsCell]}>{formatNumber(slip.rewards)}</Text>
                        <Text style={[styles.cell, styles.incentiveCell]}>{formatNumber(slip.totalIncentive)}</Text>
                        <Text style={[styles.cell, styles.dateCell, { flexWrap: 'nowrap' }]} numberOfLines={1}>
                          {slip.created_at ? (() => {
                            const date = new Date(slip.created_at);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
                            const timeHours = date.getHours() % 12 || 12;
                            return `${day}/${month}/${year} ${timeHours}:${minutes} ${ampm}`;
                          })() : '-'}
                        </Text>
                        <Text style={[styles.cell, styles.dateCell, { flexWrap: 'nowrap' }]} numberOfLines={1}>
                          {slip.updated_at ? (() => {
                            const date = new Date(slip.updated_at);
                            const year = date.getFullYear();
                            const month = String(date.getMonth() + 1).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            const hours = String(date.getHours()).padStart(2, '0');
                            const minutes = String(date.getMinutes()).padStart(2, '0');
                            const ampm = date.getHours() >= 12 ? 'PM' : 'AM';
                            const timeHours = date.getHours() % 12 || 12;
                            return `${day}/${month}/${year} ${timeHours}:${minutes} ${ampm}`;
                          })() : '-'}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              </ScrollView>
            )}
          </View>
        </View>

        {/* Modal إضافة/تعديل قصاصة */}
        <IncentiveModal
          visible={editingSlip !== null || showAddModal}
          onClose={() => {
            setEditingSlip(null);
            setShowAddModal(false);
          }}
          onSave={(data: any) => {
            if (editingSlip !== null) {
              handleSaveEdit(data);
            } else {
              handleAddNew(data);
            }
          }}
          initialData={editingSlip || undefined}
        />

        {/* Modal تأكيد الحذف */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDelete}
        >
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContent}>
              <View style={styles.deleteModalHeader}>
                <Text style={styles.deleteModalTitle}>تأكيد الحذف</Text>
                <TouchableOpacity
                  onPress={cancelDelete}
                  style={styles.deleteCloseButton}
                >
                  <X size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.deleteModalBody}>
                <Text style={styles.deleteModalMessage}>هل أنت متأكد من حذف هذه القصاصة؟</Text>
              </View>
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.cancelDeleteButton]}
                  onPress={cancelDelete}
                >
                  <Text style={styles.cancelDeleteButtonText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteModalButton, styles.confirmDeleteButton]}
                  onPress={confirmDelete}
                >
                  <Text style={styles.confirmDeleteButtonText}>حذف</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  addFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6B46C1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
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
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#6B46C1',
    borderBottomWidth: 2,
    borderBottomColor: '#5B21B6',
  },
  tableBody: {
    flex: 1,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    minHeight: 50,
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F1F5F9',
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
    borderRightColor: '#E5E7EB',
    textAlignVertical: 'center',
  },
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
  dateCell: {
    width: 160,
    minWidth: 160,
    fontSize: 11,
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
  // أنماط Modal التأكيد
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  deleteModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  deleteModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  deleteModalTitle: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    textAlign: 'center',
    flex: 1,
  },
  deleteCloseButton: {
    padding: 4,
  },
  deleteModalBody: {
    marginBottom: 20,
  },
  deleteModalMessage: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  deleteModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelDeleteButton: {
    backgroundColor: '#F3F4F6',
  },
  confirmDeleteButton: {
    backgroundColor: '#EF4444',
  },
  cancelDeleteButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#374151',
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
    color: '#FFFFFF',
  },
});