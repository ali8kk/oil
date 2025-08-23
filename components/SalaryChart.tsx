import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';

interface SalaryData {
  month: string;
  year: string;
  salary: number;
}

interface SalaryChartProps {
  data: SalaryData[];
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 250;
const barWidth = 25;
const chartPadding = { top: 20, right: 20, bottom: 60, left: 60 };

export default function SalaryChart({ data }: SalaryChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>لا توجد بيانات رواتب لعرضها</Text>
      </View>
    );
  }

  // حساب القيم القصوى والدنيا
  const maxValue = Math.max(...data.map(item => item.salary));
  const minValue = 0;
  const valueRange = maxValue - minValue;

  // حساب أبعاد المخطط
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // تحديد عدد الأعمدة المرئية (عرض 5 أعمدة كحد أقصى)
  const maxVisibleBars = 5;
  const spacing = plotWidth / maxVisibleBars;
  
  // عرض جميع البيانات مع إمكانية التمرير
  const totalChartWidth = Math.max(chartWidth, data.length * spacing + chartPadding.left + chartPadding.right);
  
  // تحديد البيانات المرئية (الأحدث أولاً)
  const visibleData = data.slice(-maxVisibleBars);
  const startIndex = Math.max(0, data.length - maxVisibleBars);

  // دالة لحساب ارتفاع العمود
  const getBarHeight = (value: number) => {
    if (valueRange === 0) return 0;
    return (value / maxValue) * plotHeight;
  };

  // دالة لحساب موضع Y للعمود
  const getBarY = (value: number) => {
    return chartPadding.top + plotHeight - getBarHeight(value);
  };

  // تنسيق الأرقام
  const formatNumber = (num: number) => {
    const formatDecimal = (value: number, suffix: string) => {
      // إذا كان الرقم صحيحاً، لا نعرض فاصلة
      if (value % 1 === 0) {
        return value.toString() + suffix;
      }
      
      // إذا كان هناك أرقام بعد الفاصلة، نعرض حتى 3 أرقام
      const formatted = value.toFixed(3);
      // إزالة الأصفار غير الضرورية من النهاية
      const trimmed = parseFloat(formatted).toString();
      return trimmed + suffix;
    };
    
    if (num >= 1000000) {
      const millions = num / 1000000;
      return formatDecimal(millions, 'M');
    } else if (num >= 1000) {
      const thousands = num / 1000;
      return formatDecimal(thousands, 'k');
    }
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // إنشاء خطوط الشبكة
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const value = (maxValue / gridCount) * i;
    const y = chartPadding.top + plotHeight - (value / maxValue) * plotHeight;
    
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={chartPadding.left}
        y1={y}
                  x2={totalChartWidth - chartPadding.right}
        y2={y}
        stroke="#E5E7EB"
        strokeWidth={1}
        strokeDasharray="3,3"
      />
    );
    
    gridLines.push(
      <SvgText
        key={`grid-label-${i}`}
        x={chartPadding.left - 10}
        y={y + 4}
        fontSize="12"
        fill="#6B7280"
        textAnchor="end"
        fontFamily="Cairo-Regular"
      >
        {formatNumber(value)}
      </SvgText>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={totalChartWidth} height={chartHeight}>
          {/* خطوط الشبكة */}
          {gridLines}
          
          {/* المحور السيني */}
          <Line
            x1={chartPadding.left}
            y1={chartPadding.top + plotHeight}
            x2={totalChartWidth - chartPadding.right}
            y2={chartPadding.top + plotHeight}
            stroke="#374151"
            strokeWidth={2}
          />
          
          {/* المحور الصادي */}
          <Line
            x1={chartPadding.left}
            y1={chartPadding.top}
            x2={chartPadding.left}
            y2={chartPadding.top + plotHeight}
            stroke="#374151"
            strokeWidth={2}
          />

          {/* الأعمدة */}
          {data.slice().reverse().map((item, index) => {
            const x = chartPadding.left + (index * spacing) + (spacing - barWidth) / 2;
            const barHeight = getBarHeight(item.salary);
            const y = getBarY(item.salary);

            return (
              <React.Fragment key={index}>
                {/* عمود الراتب */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#10B981"
                  rx={3}
                />
                
                {/* تسمية الشهر */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartPadding.top + plotHeight + 20}
                  fontSize="12"
                  fill="#374151"
                  textAnchor="middle"
                  fontFamily="Cairo-SemiBold"
                >
                  {item.month}
                </SvgText>
                
                {/* تسمية السنة */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartPadding.top + plotHeight + 35}
                  fontSize="10"
                  fill="#6B7280"
                  textAnchor="middle"
                  fontFamily="Cairo-Regular"
                >
                  {item.year}
                </SvgText>
                
                {/* القيمة فوق العمود */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="11"
                  fill="#374151"
                  textAnchor="middle"
                  fontFamily="Cairo-SemiBold"
                >
                  {formatNumber(item.salary)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  scrollContent: {
    paddingRight: 20,
  },
  emptyChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
  },
});