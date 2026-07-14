import { View, Text, StyleSheet } from 'react-native';
import { Transaction, Category } from '../types';

interface Props {
  transaction: Transaction;
  category?: Category;
}

export default function TransactionItem({ transaction, category }: Props) {
  const isIncome = transaction.type === 'income';
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: category?.color ?? '#999' }]} />
      <View style={styles.info}>
        <Text style={styles.category}>{category?.name ?? 'Uncategorized'}</Text>
        {!!transaction.note && <Text style={styles.note}>{transaction.note}</Text>}
        <Text style={styles.date}>{new Date(transaction.date).toDateString()}</Text>
      </View>
      <Text style={[styles.amount, { color: isIncome ? '#16a34a' : '#dc2626' }]}>
        {isIncome ? '+' : '-'}KES {transaction.amount.toLocaleString()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  info: { flex: 1 },
  category: { fontSize: 15, fontWeight: '600', color: '#111' },
  note: { fontSize: 13, color: '#666', marginTop: 2 },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '700' },
});