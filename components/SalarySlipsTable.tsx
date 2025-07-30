import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Pen, Trash2, Plus, X } from 'lucide-react-native';
import { useUserData } from '../contexts/UserDataContext';
import { SalaryData } from './SalaryModal';
import SalaryModal from './SalaryModal';

interface SalarySlipsTableProps {
  visible: boolean;
  onClose: () => void;
}

export default function SalarySlipsTable({ visible, onClose }: SalarySlipsTableProps) {
  const { salarySlips, updateSalarySlip, deleteSalarySlip, addSalarySlip } = useUserData();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (data: SalaryData) => {
    if (editingIndex !== null) {
      updateSalarySlip(editingIndex, data);
      setEditingIndex(null);
    }
  };

  const handleDelete = (index: number) => {
    console.log('handleDelete called with index:', index);
    
    // استخدام confirm للويب و Alert للموبايل
    const isWeb = typeof window !== 'undefined' && window.document;
    
    if (isWeb) {
      // للويب
      const confirmed = window.confirm('هل أنت متأكد من حذف هذه القصاصة؟');
      if (confirmed) {
        console.log('Delete confirmed, calling deleteSalarySlip with index:', index);
        deleteSalarySlip(index);
      }
    } else {
      // للموبايل
      try {
        Alert.alert(
          'تأكيد الحذف',
          'هل أنت متأكد من حذف هذه القصاصة؟',
          [
            { text: 'إلغاء', style: 'cancel' },
            { 
              text: 'حذف', 
              style: 'destructive',
              onPress: () => {
                console.log('Delete confirmed, calling deleteSalarySlip with index:', index);
                deleteSalarySlip(index);
              }
            }
          ]
        );
      } catch (error) {
        console.log('Alert failed, proceeding with direct delete:', error);
        deleteSalarySlip(index);
      }
    }
  };

  const handleAddNew = (data: SalaryData) => {
    addSalarySlip(data);
    setShowAddModal(false);
  };

  const formatNumber = (num: string) => {
    if (!num) return '0';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // ترتيب القصاصات تنازلياً حسب التاريخ
  const sortedSalarySlips = [...salarySlips].sort((a, b) => {
    // تحويل التاريخ إلى رقم للمقارنة
    const getDateValue = (dateStr: string) => {
      const [month, year] = dateStr.split('/');
      return parseInt(year) * 100 + parseInt(month);
    };
    
    return getDateValue(b.month) - getDateValue(a.month); // ترتيب تنازلي
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
            <Text style={styles.title}>قصاصات الراتب</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)} 
              style={styles.addButton}
            >
              <Plus size={24} color="#6B46C1" />
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            {salarySlips.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لا توجد قصاصات راتب</Text>
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
                    <Text style={[styles.headerCell, styles.bonusCell, { color: '#FFFFFF' }]}>المكافئات</Text>
                    <Text style={[styles.headerCell, styles.salaryCell]}>الراتب الكلي</Text>
                  </View>

                  {/* Table Rows */}
                  <ScrollView 
                    style={styles.tableBody}
                    showsVerticalScrollIndicator={true}
                  >
                    {sortedSalarySlips.map((slip, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.cell, styles.actionCell]}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEdit(salarySlips.indexOf(slip))}
                          >
                            <Pen size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDelete(salarySlips.indexOf(slip))}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.cell, styles.monthCell]}>
                          {slip.month}
                        </Text>
                        <Text style={[styles.cell, styles.bonusCell]}>
                          {formatNumber(slip.bonus)}
                        </Text>
                        <Text style={[styles.cell, styles.salaryCell]}>
                          {formatNumber(slip.totalSalary)}
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
          <SalaryModal
            visible={true}
            onClose={() => setEditingIndex(null)}
            onSave={handleSaveEdit}
            initialData={salarySlips[editingIndex]}
          />
        )}

        {/* Add Modal */}
        <SalaryModal
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
    minWidth: 400,
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
  actionCell: {
    width: 120,
    minWidth: 120,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  monthCell: {
    width: 120,
    minWidth: 120,
  },
  salaryCell: {
    width: 160,
    minWidth: 160,
  },
  bonusCell: {
    minWidth: 90,
    textAlign: 'center',
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: '#374151',
    paddingHorizontal: 8,
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