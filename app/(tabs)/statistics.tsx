import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { useUserData } from '@/contexts/UserDataContext';
import Chart from '@/components/Chart';
import IncentiveChart from '@/components/IncentiveChart';
import SalaryChart from '@/components/SalaryChart';
import ProfitsChart from '@/components/ProfitsChart';
import RatingChart from '@/components/RatingChart';
import YearlyIncomeChart from '@/components/YearlyIncomeChart';
import Toast from '@/components/Toast';
import { 
  DollarSign, 
  TrendingUp, 
  Award, 
  Calendar, 
  BarChart3, 
  Star,
  Users,
  Target
} from 'lucide-react-native';

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, color, subtitle }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
        {subtitle && (
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
  );
}

export default function StatisticsScreen() {
  const { 
    salarySlips, 
    incentiveSlips, 
    profitsSlips, 
    userData
  } = useUserData();
  
  const [showSaveToast, setShowSaveToast] = useState(false);
  
  // State for chart modals
  const [selectedChart, setSelectedChart] = useState<string | null>(null);

  // تنسيق الأرقام
  const formatNumber = (num: string | number) => {
    const cleanNum = typeof num === 'string' ? num.replace(/,/g, '') : num.toString();
    const number = parseFloat(cleanNum);
    if (isNaN(number)) return '0';
    return number.toLocaleString('en-US');
  };

  // حساب البيانات للمخطط البياني المجمع
  const getChartData = () => {
    const monthlyData: { [key: string]: { salary: number; incentive: number; month: string; year: string } } = {};

    // جمع بيانات الراتب
    salarySlips.forEach(slip => {
      const key = slip.month; // الشهر بصيغة MM/YYYY
      const [month, year] = key.split('/');
      const salary = parseFloat(slip.totalSalary.replace(/,/g, '')) || 0;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { salary: 0, incentive: 0, month, year };
      }
      monthlyData[key].salary += salary;
    });

    // جمع بيانات الحافز
    incentiveSlips.forEach(slip => {
      const key = slip.month; // الشهر بصيغة MM/YYYY
      const [month, year] = key.split('/');
      const incentive = parseFloat(slip.totalIncentive.replace(/,/g, '')) || 0;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { salary: 0, incentive: 0, month, year };
      }
      monthlyData[key].incentive += incentive;
    });

    // تحويل البيانات إلى مصفوفة وترتيبها
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        salary: data.salary,
        incentive: data.incentive,
        total: data.salary + data.incentive,
      }))
      .sort((a, b) => {
        // ترتيب حسب السنة ثم الشهر
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  // حساب البيانات لمخطط الحافز
  const getIncentiveChartData = () => {
    const monthlyData: { [key: string]: { incentive: number; month: string; year: string } } = {};

    incentiveSlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      const incentive = parseFloat(slip.totalIncentive.replace(/,/g, '')) || 0;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { incentive: 0, month, year };
      }
      monthlyData[key].incentive += incentive;
    });

    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        incentive: data.incentive,
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  // حساب البيانات لمخطط الراتب
  const getSalaryChartData = () => {
    const monthlyData: { [key: string]: { salary: number; month: string; year: string } } = {};

    salarySlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      const salary = parseFloat(slip.totalSalary.replace(/,/g, '')) || 0;
      
      if (!monthlyData[key]) {
        monthlyData[key] = { salary: 0, month, year };
      }
      monthlyData[key].salary += salary;
    });

    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        salary: data.salary,
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  // حساب البيانات لمخطط الأرباح (يجمع الفترتين لكل سنة)
  const getProfitsChartData = () => {
    const yearlyData: { [key: string]: { firstHalf: number; secondHalf: number; total: number } } = {};

    profitsSlips.forEach(slip => {
      const year = slip.profitYear;
      const profits = parseFloat(slip.totalProfits.replace(/,/g, '')) || 0;
      
      if (!yearlyData[year]) {
        yearlyData[year] = { firstHalf: 0, secondHalf: 0, total: 0 };
      }
      
      // تقسيم الأرباح إلى النصفين بناءً على الفترة
      const period = slip.profitPeriod;
      if (period === '50% الأولى' || period === 'first') {
        yearlyData[year].firstHalf += profits;
      } else if (period === '50% الثانية' || period === 'second') {
        yearlyData[year].secondHalf += profits;
      }
      
      yearlyData[year].total += profits;
    });

    return Object.entries(yearlyData)
      .map(([year, data]) => ({
        year,
        totalProfits: data.total,
        firstHalf: data.firstHalf,
        secondHalf: data.secondHalf,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

  // حساب بيانات مخطط المكافآت الشهرية
  const getMonthlyRewardsChartData = () => {
    const monthlyData: { [key: string]: { rewards: number; month: string; year: string } } = {};
    
    // إضافة المكافآت من قصاصات الحوافز
    incentiveSlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      const rewards = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
      if (!monthlyData[key]) {
        monthlyData[key] = { rewards: 0, month, year };
      }
      monthlyData[key].rewards += rewards;
    });
    
    // إضافة المكافآت من قصاصات الراتب
    salarySlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      const bonus = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
      if (!monthlyData[key]) {
        monthlyData[key] = { rewards: 0, month, year };
      }
      monthlyData[key].rewards += bonus;
    });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        rewards: data.rewards,
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  // حساب بيانات مخطط المكافآت السنوية (يعتمد على تاريخ القصاصة)
  const getYearlyRewardsChartData = () => {
    const yearlyData: { [key: string]: number } = {};
    
    // إضافة المكافآت من قصاصات الحوافز
    incentiveSlips.forEach(slip => {
      const [month, year] = slip.month.split('/');
      const rewards = parseFloat(slip.rewards?.replace(/,/g, '') || '0');
      const slipYear = parseInt(year);
      
      if (!yearlyData[slipYear]) {
        yearlyData[slipYear] = 0;
      }
      yearlyData[slipYear] += rewards;
    });
    
    // إضافة المكافآت من قصاصات الراتب
    salarySlips.forEach(slip => {
      const [month, year] = slip.month.split('/');
      const bonus = parseFloat(slip.bonus?.replace(/,/g, '') || '0');
      const slipYear = parseInt(year);
      
      if (!yearlyData[slipYear]) {
        yearlyData[slipYear] = 0;
      }
      yearlyData[slipYear] += bonus;
    });
    
    return Object.entries(yearlyData)
      .map(([year, totalRewards]) => ({
        year,
        totalRewards,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

  // حساب البيانات لمخطط الدخل السنوي (يجمع الرواتب والحوافز والأرباح فقط)
  const getYearlyIncomeChartData = () => {
    const yearlyData: { [key: string]: { salary: number; incentive: number; profits: number; total: number } } = {};
    
    // إضافة الرواتب السنوية (بدون المكافآت)
    salarySlips.forEach(slip => {
      const [month, year] = slip.month.split('/');
      const salary = parseFloat(slip.totalSalary?.replace(/,/g, '') || '0');
      // لا نضيف المكافآت (bonus) إلى الراتب
      const slipYear = parseInt(year);
      
      if (!yearlyData[slipYear]) {
        yearlyData[slipYear] = { salary: 0, incentive: 0, profits: 0, total: 0 };
      }
      yearlyData[slipYear].salary += salary;
    });
    
    // إضافة الحوافز السنوية (بدون المكافآت)
    incentiveSlips.forEach(slip => {
      const [month, year] = slip.month.split('/');
      const incentive = parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0');
      // لا نضيف المكافآت (rewards) إلى الحافز
      const slipYear = parseInt(year);
      
      if (!yearlyData[slipYear]) {
        yearlyData[slipYear] = { salary: 0, incentive: 0, profits: 0, total: 0 };
      }
      yearlyData[slipYear].incentive += incentive;
    });
    
    // إضافة الأرباح السنوية
    profitsSlips.forEach(slip => {
      const year = slip.profitYear;
      const profits = parseFloat(slip.totalProfits?.replace(/,/g, '') || '0');
      const slipYear = parseInt(year);
      
      if (!yearlyData[slipYear]) {
        yearlyData[slipYear] = { salary: 0, incentive: 0, profits: 0, total: 0 };
      }
      yearlyData[slipYear].profits += profits;
    });
    
    // حساب المجموع السنوي
    Object.keys(yearlyData).forEach(year => {
      const data = yearlyData[year];
      data.total = data.salary + data.incentive + data.profits;
    });
    
    return Object.entries(yearlyData)
      .map(([year, data]) => ({
        year,
        salary: data.salary,
        incentive: data.incentive,
        profits: data.profits,
        total: data.total,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  };

    const chartData = getChartData();
  const incentiveChartData = getIncentiveChartData();
  const salaryChartData = getSalaryChartData();
  const profitsChartData = getProfitsChartData();
  const monthlyRewardsChartData = getMonthlyRewardsChartData();
  const yearlyRewardsChartData = getYearlyRewardsChartData();
    const yearlyIncomeChartData = getYearlyIncomeChartData();
  
  // حساب بيانات مخطط التقييمات الشهرية
  const getMonthlyRatingsChartData = () => {
    const monthlyData: { [key: string]: { rating: string; month: string; year: string } } = {};
    
    incentiveSlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      
      if (!monthlyData[key]) {
        monthlyData[key] = { rating: slip.rating || 'متوسط', month, year };
      }
    });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        rating: data.rating,
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  // حساب بيانات مخطط الإجازات الاعتيادية الشهرية
  const getMonthlyRegularLeaveChartData = () => {
    const monthlyData: { [key: string]: { regularLeave: number; month: string; year: string } } = {};
    
    incentiveSlips.forEach(slip => {
      const key = slip.month;
      const [month, year] = key.split('/');
      const regularLeave = parseFloat(slip.regularLeave?.replace(/,/g, '') || '0');
      
      if (!monthlyData[key]) {
        monthlyData[key] = { regularLeave: 0, month, year };
      }
      monthlyData[key].regularLeave += regularLeave;
    });
    
    return Object.entries(monthlyData)
      .map(([key, data]) => ({
        month: data.month,
        year: data.year,
        regularLeave: data.regularLeave,
      }))
      .sort((a, b) => {
        const yearDiff = parseInt(a.year) - parseInt(b.year);
        if (yearDiff !== 0) return yearDiff;
        return parseInt(a.month) - parseInt(b.month);
      });
  };

  const monthlyRatingsChartData = getMonthlyRatingsChartData();
  const monthlyRegularLeaveChartData = getMonthlyRegularLeaveChartData();
  
  // حساب الإحصائيات من القصاصات الفعلية
  const totalSalaryValue = salarySlips.reduce((total, slip) => {
    return total + (parseFloat(slip.totalSalary?.replace(/,/g, '') || '0'));
  }, 0);
  
  const totalIncentiveValue = incentiveSlips.reduce((total, slip) => {
    return total + (parseFloat(slip.totalIncentive?.replace(/,/g, '') || '0'));
  }, 0);
  
  const totalProfitsValue = profitsSlips.reduce((total, slip) => {
    return total + (parseFloat(slip.totalProfits?.replace(/,/g, '') || '0'));
  }, 0);
  
  // حساب إجمالي المكافئات
  const totalBonusValue = salarySlips.reduce((total, slip) => {
    return total + (parseFloat(slip.bonus?.replace(/,/g, '') || '0'));
  }, 0);
  
  const totalRewardsValue = incentiveSlips.reduce((total, slip) => {
    return total + (parseFloat(slip.rewards?.replace(/,/g, '') || '0'));
  }, 0);
  
  const totalBonusesValue = totalBonusValue + totalRewardsValue;
  
  // حساب عدد المكافئات المضافة
  const bonusCount = salarySlips.filter(slip => parseFloat(slip.bonus?.replace(/,/g, '') || '0') > 0).length;
  const rewardsCount = incentiveSlips.filter(slip => parseFloat(slip.rewards?.replace(/,/g, '') || '0') > 0).length;
  const totalBonusesCount = bonusCount + rewardsCount;
  
  // حساب الفترة الزمنية - من أول قصاصة حافز إلى اليوم
  const getEarliestIncentiveDate = () => {
    if (incentiveSlips.length === 0) return null;
    
    const incentiveDates = incentiveSlips.map(slip => {
      const [month, year] = slip.month.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    });
    
    return new Date(Math.min(...incentiveDates.map(d => d.getTime())));
  };
  
  const earliestIncentiveDate = getEarliestIncentiveDate();
  
  const formatDateRange = () => {
    if (!earliestIncentiveDate) return '';
    
    const month = earliestIncentiveDate.getMonth() + 1;
    const year = earliestIncentiveDate.getFullYear();
    const startDate = `${month}/${year}`;
    
    return `(${startDate} - اليوم)`;
  };
  
  const dateRangeText = formatDateRange();
  
  const totalEarnings = totalSalaryValue + totalIncentiveValue + totalProfitsValue;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* الإحصائيات الرئيسية */}
        <Text style={styles.sectionTitle}>الإحصائيات المالية</Text>
        
        <View style={styles.statsGrid}>
          <StatCard
            title="إجمالي الدخل"
            value={`${formatNumber(totalEarnings)} د.ع`}
            icon={<TrendingUp size={24} color="#3B82F6" />}
            color="#3B82F6"
            subtitle={`راتب + حافز + أرباح ${dateRangeText}`}
          />
          
          <StatCard
            title="إجمالي الرواتب"
            value={`${formatNumber(totalSalaryValue)} د.ع`}
            icon={<DollarSign size={24} color="#10B981" />}
            color="#10B981"
            subtitle={`${salarySlips.length} قصاصة راتب ${dateRangeText}`}
          />
          
          <StatCard
            title="إجمالي الحوافز"
            value={`${formatNumber(totalIncentiveValue)} د.ع`}
            icon={<Award size={24} color="#F59E0B" />}
            color="#F59E0B"
            subtitle={`${incentiveSlips.length} قصاصة حافز ${dateRangeText}`}
          />
          
          <StatCard
            title="إجمالي الأرباح"
            value={`${formatNumber(totalProfitsValue)} د.ع`}
            icon={<BarChart3 size={24} color="#8B5CF6" />}
            color="#8B5CF6"
            subtitle={`${profitsSlips.length} قصاصة أرباح ${dateRangeText}`}
          />
          
          <StatCard
            title="إجمالي المكافئات"
            value={`${formatNumber(totalBonusesValue)} د.ع`}
            icon={<Award size={24} color="#EC4899" />}
            color="#EC4899"
            subtitle={`${totalBonusesCount} مكافئة ${dateRangeText}`}
          />
        </View>


        
        {/* المخططات الكبيرة الأصلية */}
        <Text style={styles.sectionTitle}>مخطط الدخل الشهري</Text>
        <View style={styles.chartContainer}>
          <Chart data={chartData} />
        </View>

        <Text style={styles.sectionTitle}>مخطط الحوافز الشهري</Text>
        <View style={styles.chartContainer}>
          <IncentiveChart data={incentiveChartData} color="#F59E0B" />
        </View>

        <Text style={styles.sectionTitle}>مخطط الرواتب الشهري</Text>
        <View style={styles.chartContainer}>
          <SalaryChart data={salaryChartData} />
        </View>

        <Text style={styles.sectionTitle}>مخطط الأرباح السنوي</Text>
        <View style={styles.chartContainer}>
          <ProfitsChart data={profitsChartData} />
        </View>

        <Text style={styles.sectionTitle}>مخطط المكافآت الشهرية</Text>
        <View style={styles.chartContainer}>
          <IncentiveChart data={monthlyRewardsChartData.map(item => ({ month: item.month, year: item.year, incentive: item.rewards }))} color="#EC4899" />
        </View>

        <Text style={styles.sectionTitle}>مخطط المكافآت السنوية</Text>
        <View style={styles.chartContainer}>
          <IncentiveChart data={yearlyRewardsChartData.map(item => ({ month: '', year: item.year, incentive: item.totalRewards }))} color="#EC4899" />
        </View>

        <Text style={styles.sectionTitle}>مخطط الدخل السنوي</Text>
        <View style={styles.chartContainer}>
          <YearlyIncomeChart data={yearlyIncomeChartData} />
        </View>

        <Text style={styles.sectionTitle}>مخطط التقييمات الشهرية</Text>
        <View style={styles.chartContainer}>
          <RatingChart data={monthlyRatingsChartData} />
        </View>

        <Text style={styles.sectionTitle}>مخطط الإجازات الاعتيادية الشهرية</Text>
        <View style={styles.chartContainer}>
          <IncentiveChart 
            data={monthlyRegularLeaveChartData.map(item => ({ month: item.month, year: item.year, incentive: item.regularLeave }))} 
            color="#10B981" 
            isRegularLeaveChart={true}
          />
        </View>
      </ScrollView>

      <Toast
        visible={showSaveToast}
        message="تم حفظ التغييرات بنجاح! ✅"
        type="success"
        duration={2000}
        onHide={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingTop: 36,
    height: 92, // 56 + 36
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 22,
    fontFamily: 'Cairo-Bold',
    textAlign: 'center',
    marginTop: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 60,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Cairo-Bold',
    color: '#374151',
    marginVertical: 20,
    textAlign: 'right',
  },
  statsGrid: {
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  statContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'right',
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Cairo-Bold',
    marginBottom: 2,
    textAlign: 'right',
  },
  statSubtitle: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
  },
  chartContainer: {
    marginBottom: 24,
  },
  miniChartsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 20,
  },
  singleChartContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 16,
  },
});