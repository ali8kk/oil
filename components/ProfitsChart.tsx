import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';

interface ProfitsData {
  year: string;
  totalProfits: number;
  firstHalf?: number; // 50% الأولى
  secondHalf?: number; // 50% الثانية
}

interface ProfitsChartProps {
  data: ProfitsData[];
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 250;
const barWidth = 40;
const chartPadding = { top: 20, right: 20, bottom: 40, left: 60 };

export default function ProfitsChart({ data }: ProfitsChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>لا توجد بيانات أرباح لعرضها</Text>
      </View>
    );
  }

  // حساب القيم القصوى والدنيا
  const maxValue = Math.max(...data.map(item => item.totalProfits));
  const minValue = 0;
  const valueRange = maxValue - minValue;

  // حساب أبعاد المخطط
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // المسافة بين الأعمدة
  const spacing = plotWidth / Math.max(data.length, 1);

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

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <Svg width={Math.max(chartWidth, data.length * 80)} height={chartHeight}>
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
            const barHeight = getBarHeight(item.totalProfits);
            const y = getBarY(item.totalProfits);

            // استخدام القيم الصحيحة من البيانات
            const firstHalf = item.firstHalf || 0;
            const secondHalf = item.secondHalf || 0;
            
            // تحديد ما إذا كان هناك فترتان أم فترة واحدة فقط
            const hasBothPeriods = firstHalf > 0 && secondHalf > 0;
            const hasOnlyFirst = firstHalf > 0 && secondHalf === 0;
            const hasOnlySecond = secondHalf > 0 && firstHalf === 0;

            return (
              <React.Fragment key={index}>
                {hasBothPeriods ? (
                  // عرض العمود مقسم إلى جزئين
                  <>
                    {/* النصف الأول من العمود */}
                    <Rect
                      x={x}
                      y={y + getBarHeight(secondHalf)}
                      width={barWidth}
                      height={getBarHeight(firstHalf)}
                      fill="#8B5CF6"
                      rx={4}
                    />
                    
                    {/* النصف الثاني من العمود */}
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={getBarHeight(secondHalf)}
                      fill="#A78BFA"
                      rx={4}
                    />
                    
                    {/* القيمة داخل النصف الأول */}
                    {firstHalf > 0 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y + getBarHeight(secondHalf) + getBarHeight(firstHalf) / 2 + 4}
                        fontSize="10"
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontFamily="Cairo-SemiBold"
                      >
                        {formatNumber(firstHalf)}
                      </SvgText>
                    )}
                    
                    {/* القيمة داخل النصف الثاني */}
                    {secondHalf > 0 && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y + getBarHeight(secondHalf) / 2 + 4}
                        fontSize="10"
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontFamily="Cairo-SemiBold"
                      >
                        {formatNumber(secondHalf)}
                      </SvgText>
                    )}
                  </>
                ) : (
                  // عرض العمود كقطعة واحدة
                  <>
                    <Rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={barHeight}
                      fill={hasOnlyFirst ? "#8B5CF6" : "#A78BFA"}
                      rx={4}
                    />
                    
                    {/* القيمة داخل العمود */}
                    {(firstHalf > 0 || secondHalf > 0) && (
                      <SvgText
                        x={x + barWidth / 2}
                        y={y + barHeight / 2 + 4}
                        fontSize="10"
                        fill="#FFFFFF"
                        textAnchor="middle"
                        fontFamily="Cairo-SemiBold"
                      >
                        {formatNumber(firstHalf > 0 ? firstHalf : secondHalf)}
                      </SvgText>
                    )}
                  </>
                )}
                
                {/* تسمية السنة */}
                <SvgText
                  x={x + barWidth / 2}
                  y={chartPadding.top + plotHeight + 25}
                  fontSize="14"
                  fill="#374151"
                  textAnchor="middle"
                  fontFamily="Cairo-SemiBold"
                >
                  {item.year}
                </SvgText>
                
                {/* المجموع الكلي فوق العمود */}
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fontSize="11"
                  fill="#374151"
                  textAnchor="middle"
                  fontFamily="Cairo-SemiBold"
                >
                  {formatNumber(item.totalProfits)}
                </SvgText>
              </React.Fragment>
            );
          })}
        </Svg>
      </ScrollView>
      
      {/* مفتاح الألوان في الأسفل */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendText}>النصف الأول (50%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#A78BFA' }]} />
          <Text style={styles.legendText}>النصف الثاني (50%)</Text>
        </View>
      </View>
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
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
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