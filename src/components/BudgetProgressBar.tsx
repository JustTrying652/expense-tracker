import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme';

interface Props {
  categoryName: string;
  color: string;
  spent: number;
  limit: number;
}

export default function BudgetProgressBar({ categoryName, color, spent, limit }: Props) {
  const pct = Math.min((spent / limit) * 100, 100);
  const isOver = spent > limit;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.categoryName}>{categoryName}</Text>
        <Text style={[styles.amountText, isOver && { color: colors.receiptRed }]}>
          KES {spent.toLocaleString()} / {limit.toLocaleString()}
        </Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct}%`, backgroundColor: isOver ? colors.receiptRed : color }]} />
      </View>
      {isOver && (
        <Text style={styles.overText}>OVER BY KES {(spent - limit).toLocaleString()}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  categoryName: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink },
  amountText: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash },
  track: { height: 8, backgroundColor: '#EDE8DD', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  overText: { fontFamily: fonts.mono, fontSize: 10, color: colors.receiptRed, marginTop: 3, letterSpacing: 0.5 },
});