import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MonthlyTotal } from '../db/storage';
import { colors, fonts } from '../theme';
import EmptyState from './EmptyState';

interface Props {
  data: MonthlyTotal[];
  onSelectMonth?: (year: number, month: number) => void;
}

const MONTH_ABBR = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_BAR_HEIGHT = 140;

export default function TrendChart({ data, onSelectMonth }: Props) {
  const hasAnyData = data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasAnyData) {
    return (
      <EmptyState
        emoji="📈"
        title="Not enough history yet"
        subtitle="Your monthly trend will build up as you use the app."
      />
    );
  }

  const maxValue = Math.max(...data.map((d) => Math.max(d.income, d.expense)), 1);

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.stampGreen }]} />
          <Text style={styles.legendText}>INCOME</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.receiptRed }]} />
          <Text style={styles.legendText}>EXPENSE</Text>
        </View>
      </View>

      <View style={styles.chartArea}>
        {data.map((d, i) => {
          const incomeHeight = (d.income / maxValue) * MAX_BAR_HEIGHT;
          const expenseHeight = (d.expense / maxValue) * MAX_BAR_HEIGHT;

          return (
            <TouchableOpacity
              key={i}
              style={styles.column}
              activeOpacity={0.6}
              onPress={() => onSelectMonth?.(d.year, d.month)}
            >
              <View style={styles.barPair}>
                <View style={[styles.bar, { height: Math.max(incomeHeight, 2), backgroundColor: colors.stampGreen }]} />
                <View style={[styles.bar, { height: Math.max(expenseHeight, 2), backgroundColor: colors.receiptRed }]} />
              </View>
              <Text style={styles.monthLabel}>{MONTH_ABBR[d.month - 1]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.baseline} />
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 0.5 },
  chartArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: MAX_BAR_HEIGHT + 10,
  },
  column: { alignItems: 'center', flex: 1 },
  barPair: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: MAX_BAR_HEIGHT },
  bar: { width: 10, borderRadius: 2 },
  monthLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, marginTop: 6, letterSpacing: 0.5 },
  baseline: { height: 1.5, backgroundColor: '#D9D3C4', marginTop: -1 },
});