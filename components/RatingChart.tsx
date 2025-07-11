import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Svg, Rect, Line, Text as SvgText } from 'react-native-svg';

interface RatingData {
  month: string;
  year: string;
  rating: string;
}

interface RatingChartProps {
  data: RatingData[];
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - 40;
const chartHeight = 250;
const barWidth = 25;
const chartPadding = { top: 20, right: 20, bottom: 60, left: 80 }; // زيادة اليسار من 60 إلى 80

export default function RatingChart({ data }: RatingChartProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>لا توجد بيانات تقييم لعرضها</Text>
      </View>
    );
  }

  // تحويل التقييمات إلى أرقام
  const ratingToNumber = (rating: string) => {
    switch (rating) {
      case 'ممتاز': return 5;
      case 'جيد جداً': return 4;
      case 'جيد': return 3;
      case 'متوسط': return 2;
      case 'ضعيف': return 1;
      default: return 2; // متوسط كافتراضي
    }
  };

  const numberToRating = (num: number) => {
    switch (num) {
      case 5: return 'ممتاز';
      case 4: return 'جيد جداً';
      case 3: return 'جيد';
      case 2: return 'متوسط';
      case 1: return 'ضعيف';
      default: return 'متوسط';
    }
  };

  // حساب القيم القصوى والدنيا
  const maxValue = 5; // أعلى تقييم
  const minValue = 1; // أدنى تقييم
  const valueRange = maxValue - minValue;

  // حساب أبعاد المخطط
  const plotWidth = chartWidth - chartPadding.left - chartPadding.right;
  const plotHeight = chartHeight - chartPadding.top - chartPadding.bottom;
  
  // المسافة بين الأعمدة
  const spacing = plotWidth / Math.max(data.length, 1);

  // دالة لحساب ارتفاع العمود
  const getBarHeight = (value: number) => {
    return (value / maxValue) * plotHeight;
  };

  // دالة لحساب موضع Y للعمود
  const getBarY = (value: number) => {
    return chartPadding.top + plotHeight - getBarHeight(value);
  };

  // إنشاء خطوط الشبكة
  const gridLines = [];
  const gridCount = 5;
  for (let i = 0; i <= gridCount; i++) {
    const value = i + 1; // من 1 إلى 5
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
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={true}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.chartContainer}>
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
              const ratingValue = ratingToNumber(item.rating);
              const barHeight = getBarHeight(ratingValue);
              const y = getBarY(ratingValue);

              // تحديد لون العمود حسب التقييم
              const getBarColor = (rating: number) => {
                switch (rating) {
                  case 5: return '#10B981'; // ممتاز - أخضر
                  case 4: return '#3B82F6'; // جيد جداً - أزرق
                  case 3: return '#F59E0B'; // جيد - برتقالي
                  case 2: return '#8B5CF6'; // متوسط - بنفسجي
                  case 1: return '#EF4444'; // ضعيف - أحمر
                  default: return '#8B5CF6';
                }
              };

              return (
                <React.Fragment key={index}>
                  {/* عمود التقييم */}
                  <Rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={barHeight}
                    fill={getBarColor(ratingValue)}
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
                </React.Fragment>
              );
            })}
          </Svg>
          
          {/* النصوص على المحور الصادي باستخدام React Native Text */}
          {Array.from({ length: gridCount + 1 }, (_, i) => {
            const value = i + 1; // من 1 إلى 5
            const y = chartPadding.top + plotHeight - (value / maxValue) * plotHeight;
            
            return (
              <View
                key={`y-label-${i}`}
                style={[
                  styles.yAxisLabelContainer,
                  {
                    left: chartPadding.left - 65,
                    top: y - 8,
                  }
                ]}
              >
                <Text style={styles.yAxisLabelText}>
                  {numberToRating(value)}
                </Text>
              </View>
            );
          })}
          
          {/* النصوص فوق الأعمدة باستخدام React Native Text */}
          {data.map((item, index) => {
            const x = chartPadding.left + (index * spacing) + (spacing - barWidth) / 2;
            const ratingValue = ratingToNumber(item.rating);
            const y = getBarY(ratingValue);
            
            return (
              <View
                key={`text-${index}`}
                style={[
                  styles.ratingTextContainer,
                  {
                    left: x + barWidth / 2 - 20,
                    top: y - 25,
                  }
                ]}
              >
                <Text style={styles.ratingText}>
                  {item.rating}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>
      
      {/* مفتاح الألوان */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#10B981' }]} />
          <Text style={styles.legendText}>ممتاز</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#3B82F6' }]} />
          <Text style={styles.legendText}>جيد جداً</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>جيد</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
          <Text style={styles.legendText}>متوسط</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>ضعيف</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chartContainer: {
    position: 'relative',
  },
  scrollContent: {
    alignItems: 'center',
  },
  ratingTextContainer: {
    position: 'absolute',
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingText: {
    fontSize: 9,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptyChart: {
    height: chartHeight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    fontFamily: 'Cairo-Regular',
    color: '#374151',
  },
  yAxisLabelContainer: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
  },
  yAxisLabelText: {
    fontSize: 10,
    fontFamily: 'Cairo-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
}); 