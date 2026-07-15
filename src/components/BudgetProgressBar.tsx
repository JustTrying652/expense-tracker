import { View, Text, StyleSheet } from 'react-native';

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
        <Text style={[styles.amountText, isOver && { color: '#dc2626' }]}>
          KES {spent.toLocaleString()} / {limit.toLocaleString()}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            { width: `${pct}%`, backgroundColor: isOver ? '#dc2626' : color },
          ]}
        />
      </View>
      {isOver && <Text style={styles.overText}>Over budget by KES {(spent - limit).toLocaleString()}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  categoryName: { fontSize: 13, fontWeight: '600', color: '#111' },
  amountText: { fontSize: 12, color: '#666' },
  track: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
  overText: { fontSize: 11, color: '#dc2626', marginTop: 2 },
});