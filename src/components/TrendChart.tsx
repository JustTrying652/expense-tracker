import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { MonthlyTotal } from '../db/storage';
import EmptyState from './EmptyState';

const screenWidth = Dimensions.get('window').width;

interface Props {
  data: MonthlyTotal[];
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function TrendChart({ data }: Props) {
  const labels = data.map((d) => MONTH_ABBR[d.month - 1]);
  const expenseValues = data.map((d) => d.expense);

  const hasAnyData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasAnyData) {
    return <EmptyState emoji="📈" title="Not enough history yet" subtitle="Your monthly trend will build up as you use the app." />;
  }

  return (
    <View>
      <BarChart
        data={{
          labels,
          datasets: [{ data: expenseValues }],
        }}
        width={screenWidth - 32}
        height={200}
        yAxisLabel=""
        yAxisSuffix=""
        fromZero
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: () => '#dc2626',
          labelColor: () => '#374151',
          barPercentage: 0.6,
        }}
        style={{ borderRadius: 8 }}
      />
      <Text style={styles.caption}>Monthly expenses (KES)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: 'center', color: '#999', marginVertical: 12 },
  caption: { textAlign: 'center', fontSize: 11, color: '#999', marginTop: 4 },
});