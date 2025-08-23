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
      case 'ممتاز': return 6;
      case 'مكافئة خاصة': return 5;
      case 'جيد جداً': return 4;
      case 'جيد': return 3;
      case 'متوسط': return 2;
      default: return 2; // متوسط كافتراضي
    }
  };

  const numberToRating = (num: number) => {
    switch (num) {
      case 6: return 'ممتاز';
      case 5: return 'مكافئة خاصة';
      case 4: return 'جيد جداً';
      case 3: return 'جيد';
      case 2: return 'متوسط';
      default: return 'متوسط';
    }
  };

  // حساب القيم القصوى والدنيا
  const maxValue = 6; // أعلى تقييم
  const minValue = 2; // أدنى تقييم
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
    return (value / maxValue) * plotHeight;
  };

  // دالة لحساب موضع Y للعمود
  const getBarY = (value: number) => {
    return chartPadding.top + plotHeight - getBarHeight(value);
  };

  // إنشاء خطوط الشبكة
  const gridLines = [];
  const gridCount = 4; // 5 تقييمات (من 2 إلى 6) = 4 مسافات
  for (let i = 0; i <= gridCount; i++) {
    const value = 6 - i; // من 6 (ممتاز) إلى 2 (متوسط)
    
    // ترتيب خطوط الشبكة حسب النسب المئوية
    let adjustedY;
    if (value === 6) { // ممتاز - عند 100% (أعلى نقطة)
      adjustedY = chartPadding.top;
    } else if (value === 5) { // مكافئة خاصة - عند 80%
      adjustedY = chartPadding.top + (plotHeight * 0.2);
    } else if (value === 4) { // جيد جداً - عند 60%
      adjustedY = chartPadding.top + (plotHeight * 0.4);
    } else if (value === 3) { // جيد - عند 40%
      adjustedY = chartPadding.top + (plotHeight * 0.6);
    } else if (value === 2) { // متوسط - عند 20% (أدنى نقطة)
      adjustedY = chartPadding.top + (plotHeight * 0.8);
    }
    
    gridLines.push(
      <Line
        key={`grid-${i}`}
        x1={chartPadding.left}
        y1={adjustedY}
        x2={totalChartWidth - chartPadding.right}
        y2={adjustedY}
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
              const ratingValue = ratingToNumber(item.rating);
              
              // حساب موقع العمود وارتفاعه ليتوازن مع خطوط الشبكة
              let barY, barHeight;
              if (ratingValue === 6) { // ممتاز - عند 100% (أعلى نقطة)
                barY = chartPadding.top;
                barHeight = plotHeight;
              } else if (ratingValue === 5) { // مكافئة خاصة - عند 80%
                barY = chartPadding.top + (plotHeight * 0.2);
                barHeight = plotHeight * 0.8;
              } else if (ratingValue === 4) { // جيد جداً - عند 60%
                barY = chartPadding.top + (plotHeight * 0.4);
                barHeight = plotHeight * 0.6;
              } else if (ratingValue === 3) { // جيد - عند 40%
                barY = chartPadding.top + (plotHeight * 0.6);
                barHeight = plotHeight * 0.4;
              } else if (ratingValue === 2) { // متوسط - عند 20%
                barY = chartPadding.top + (plotHeight * 0.8);
                barHeight = plotHeight * 0.2;
              } else {
                // للقيم الأخرى، استخدم الحساب الأصلي
                barHeight = getBarHeight(ratingValue);
                barY = getBarY(ratingValue);
              }

              // تحديد لون العمود حسب التقييم
              const getBarColor = (rating: number) => {
                switch (rating) {
                  case 6: return '#10B981'; // ممتاز - أخضر
                  case 5: return '#8B5CF6'; // مكافئة خاصة - بنفسجي
                  case 4: return '#3B82F6'; // جيد جداً - أزرق
                  case 3: return '#F59E0B'; // جيد - برتقالي
                  case 2: return '#EF4444'; // متوسط - أحمر
                  default: return '#EF4444';
                }
              };

              return (
                <React.Fragment key={index}>
                  {/* عمود التقييم */}
                  <Rect
                    x={x}
                    y={barY}
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
            const value = 6 - i; // من 6 (ممتاز) إلى 2 (متوسط)
            
            // ترتيب التقييمات حسب النسب المئوية
            let adjustedTop;
            if (value === 6) { // ممتاز - عند 100% (أعلى نقطة)
              adjustedTop = chartPadding.top - 10;
            } else if (value === 5) { // مكافئة خاصة - عند 80%
              adjustedTop = chartPadding.top + (plotHeight * 0.2) - 10;
            } else if (value === 4) { // جيد جداً - عند 60%
              adjustedTop = chartPadding.top + (plotHeight * 0.4) - 10;
            } else if (value === 3) { // جيد - عند 40%
              adjustedTop = chartPadding.top + (plotHeight * 0.6) - 10;
            } else if (value === 2) { // متوسط - عند 20% (أدنى نقطة)
              adjustedTop = chartPadding.top + (plotHeight * 0.8) - 10;
            }
            
            return (
              <View
                key={`y-label-${i}`}
                style={[
                  styles.yAxisLabelContainer,
                  {
                    left: chartPadding.left - 65,
                    top: adjustedTop,
                  }
                ]}
              >
                <Text style={[
                  styles.yAxisLabelText,
                  value === 5 ? { fontSize: 9, lineHeight: 11, width: 60 } : {}
                ]}>
                  {numberToRating(value)}
                </Text>
              </View>
            );
          })}
          
          {/* النصوص فوق الأعمدة باستخدام React Native Text */}
          {data.slice().reverse().map((item, index) => {
            const x = chartPadding.left + (index * spacing) + (spacing - barWidth) / 2;
            const ratingValue = ratingToNumber(item.rating);
            
            // حساب موقع النص ليتوازن مع العمود
            let textY;
            if (ratingValue === 6) { // ممتاز - عند 100% (أعلى نقطة)
              textY = chartPadding.top - 25;
            } else if (ratingValue === 5) { // مكافئة خاصة - عند 80%
              textY = chartPadding.top + (plotHeight * 0.2) - 25;
            } else if (ratingValue === 4) { // جيد جداً - عند 60%
              textY = chartPadding.top + (plotHeight * 0.4) - 25;
            } else if (ratingValue === 3) { // جيد - عند 40%
              textY = chartPadding.top + (plotHeight * 0.6) - 25;
            } else if (ratingValue === 2) { // متوسط - عند 20%
              textY = chartPadding.top + (plotHeight * 0.8) - 25;
            } else {
              // للقيم الأخرى، استخدم الحساب الأصلي
              textY = getBarY(ratingValue) - 25;
            }
            
            return (
              <View
                key={`text-${index}`}
                style={[
                  styles.ratingTextContainer,
                  {
                    left: x + barWidth / 2 - 20,
                    top: textY,
                  }
                ]}
              >
                <Text style={[
                  styles.ratingText,
                  item.rating === 'مكافئة خاصة' ? { fontSize: 9, lineHeight: 32, width: 50, top: -5 } : {}
                ]}>
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
          <View style={[styles.legendColor, { backgroundColor: '#8B5CF6' }]} />
          <Text style={[styles.legendText, { fontSize: 10, lineHeight: 12 }]}>مكافئة خاصة</Text>
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
          <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
          <Text style={styles.legendText}>متوسط</Text>
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