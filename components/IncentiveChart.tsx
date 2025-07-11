import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';

interface IncentiveData {
  month: string;
  year: string;
  incentive: number;
}

interface IncentiveChartProps {
  data: IncentiveData[];
  color?: string;
  isRegularLeaveChart?: boolean; // خاصية جديدة لتحديد إذا كان هذا مخطط الإجازات الاعتيادية
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 250;
const barWidth = 25;
const chartPadding = { top: 20, right: 20, bottom: 60, left: 60 };

export default function IncentiveChart({ data, color = "#F59E0B", isRegularLeaveChart = false }: IncentiveChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>لا توجد بيانات حوافز لعرضها</Text>
      </View>
    );
  }

  // حساب القيم القصوى والدنيا
  const maxValue = Math.max(...data.map(item => item.incentive));
  const minValue = 0;
  const valueRange = maxValue - minValue;

  // حساب أبعاد المخطط
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // المسافة بين الأعمدة
  const spacing = plotWidth / Math.max(data.length, 1);

  // دالة لحساب ارتفاع العمود
  const getBarHeight = (value: number) => {
    if (isRegularLeaveChart) {
      const maxChartValue = 15; // استخدام 15 كأقصى قيمة لمخطط الإجازات
      return (value / maxChartValue) * plotHeight;
    } else {
      if (valueRange === 0) return 0;
      return (value / maxValue) * plotHeight;
    }
  };

  // دالة لحساب موضع Y للعمود
  const getBarY = (value: number) => {
    if (isRegularLeaveChart) {
      const maxChartValue = 15; // استخدام 15 كأقصى قيمة لمخطط الإجازات
      return chartPadding.top + plotHeight - (value / maxChartValue) * plotHeight;
    } else {
      return chartPadding.top + plotHeight - getBarHeight(value);
    }
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
  if (isRegularLeaveChart) {
    // قيم ثابتة لمخطط الإجازات الاعتيادية
    const gridValues = [0, 3, 6, 9, 12, 15];
    for (let i = 0; i < gridValues.length; i++) {
      const value = gridValues[i];
      const y = chartPadding.top + plotHeight - (value / 15) * plotHeight;
      
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={chartPadding.left}
          y1={y}
          x2={chartPadding.left + plotWidth}
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
          {value}
        </SvgText>
      );
    }
  } else {
    // القيم الأصلية للمخططات الأخرى
    const gridCount = 5;
    for (let i = 0; i <= gridCount; i++) {
      const value = (maxValue / gridCount) * i;
      const y = chartPadding.top + plotHeight - (value / maxValue) * plotHeight;
      
      gridLines.push(
        <Line
          key={`grid-${i}`}
          x1={chartPadding.left}
          y1={y}
          x2={chartPadding.left + plotWidth}
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
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={Math.max(chartWidth, data.length * 60)} height={chartHeight}>
          {/* خطوط الشبكة */}
          {gridLines}
          
          {/* المحور السيني */}
          <Line
            x1={chartPadding.left}
            y1={chartPadding.top + plotHeight}
            x2={chartPadding.left + plotWidth}
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
          {data.map((item, index) => {
            const x = chartPadding.left + (index * spacing) + (spacing - barWidth) / 2;
            const barHeight = getBarHeight(item.incentive);
            const y = getBarY(item.incentive);

            return (
              <React.Fragment key={index}>
                {/* عمود الحافز */}
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
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
                  {formatNumber(item.incentive)}
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