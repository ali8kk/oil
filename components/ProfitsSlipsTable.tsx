import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Pen, Trash2, Plus, X } from 'lucide-react-native';
import { useUserData } from '@/contexts/UserDataContext';
import { ProfitsData } from './ProfitsModal';
import ProfitsModal from './ProfitsModal';

interface ProfitsSlipsTableProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfitsSlipsTable({ visible, onClose }: ProfitsSlipsTableProps) {
  const { profitsSlips, updateProfitsSlip, deleteProfitsSlip, addProfitsSlip } = useUserData();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleEdit = (index: number) => {
    setEditingIndex(index);
  };

  const handleSaveEdit = (data: ProfitsData) => {
    if (editingIndex !== null) {
      updateProfitsSlip(editingIndex, data);
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
          onPress: () => deleteProfitsSlip(index)
        }
      ]
    );
  };

  const handleAddNew = (data: ProfitsData) => {
    addProfitsSlip(data);
    setShowAddModal(false);
  };

  const formatNumber = (num: string) => {
    if (!num) return '0';
    return num.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // ترتيب القصاصات حسب السنة (تنازلي) والفترة (الثانية أولاً)
  const sortedProfitsSlips = [...profitsSlips].sort((a, b) => {
    // مقارنة السنة أولاً
    const yearA = parseInt(a.profitYear);
    const yearB = parseInt(b.profitYear);
    
    if (yearA !== yearB) {
      return yearB - yearA; // ترتيب تنازلي للسنة
    }
    
    // إذا كانت السنة متشابهة، رتب حسب الفترة
    const periodA = a.profitPeriod;
    const periodB = b.profitPeriod;
    
    // الفترة الثانية تأتي أولاً
    if (periodA === '50% الثانية' && periodB === '50% الأولى') {
      return -1;
    }
    if (periodA === '50% الأولى' && periodB === '50% الثانية') {
      return 1;
    }
    
    return 0;
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
            <Text style={styles.title}>قصاصات الأرباح</Text>
            <TouchableOpacity 
              onPress={() => setShowAddModal(true)} 
              style={styles.addButton}
            >
              <Plus size={24} color="#6B46C1" />
            </TouchableOpacity>
          </View>

          <View style={styles.tableContainer}>
            {profitsSlips.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>لا توجد قصاصات أرباح</Text>
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
                    <Text style={[styles.headerCell, styles.yearCell]}>السنة</Text>
                    <Text style={[styles.headerCell, styles.periodCell]}>الفترة</Text>
                    <Text style={[styles.headerCell, styles.pointsCell]}>النقاط</Text>
                    <Text style={[styles.headerCell, styles.ratingCell]}>التقييم</Text>
                    <Text style={[styles.headerCell, styles.profitsCell]}>الأرباح الكلية</Text>
                  </View>

                  {/* Table Rows */}
                  <ScrollView 
                    style={styles.tableBody}
                    showsVerticalScrollIndicator={true}
                  >
                    {sortedProfitsSlips.map((slip, index) => (
                      <View key={index} style={styles.tableRow}>
                        <View style={[styles.cell, styles.actionCell]}>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleEdit(profitsSlips.indexOf(slip))}
                          >
                            <Pen size={16} color="#3B82F6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.actionButton}
                            onPress={() => handleDelete(profitsSlips.indexOf(slip))}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.cell, styles.yearCell]}>
                          {slip.profitYear}
                        </Text>
                        <Text style={[styles.cell, styles.periodCell]}>
                          {slip.profitPeriod}
                        </Text>
                        <Text style={[styles.cell, styles.pointsCell]}>
                          {formatNumber(slip.profitPoints)}
                        </Text>
                        <Text style={[styles.cell, styles.ratingCell]}>
                          {slip.rating || 'متوسط'}
                        </Text>
                        <Text style={[styles.cell, styles.profitsCell]}>
                          {formatNumber(slip.totalProfits)}
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
          <ProfitsModal
            visible={true}
            onClose={() => setEditingIndex(null)}
            onSave={handleSaveEdit}
            initialData={profitsSlips[editingIndex]}
          />
        )}

        {/* Add Modal */}
        <ProfitsModal
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
    minWidth: 700,
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
  pointsCell: {
    width: 100,
    minWidth: 100,
  },
  yearCell: {
    width: 80,
    minWidth: 80,
  },
  periodCell: {
    width: 120,
    minWidth: 120,
  },
  ratingCell: {
    width: 90,
    minWidth: 90,
  },
  profitsCell: {
    width: 160,
    minWidth: 160,
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