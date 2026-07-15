import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Transaction, Category } from '../types';

interface Props {
  transaction: Transaction;
  category?: Category;
  onDelete: (id: number) => void;
}

export default function TransactionItem({ transaction, category, onDelete }: Props) {
  const isIncome = transaction.type === 'income';

  function confirmDelete() {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Delete this transaction? This cannot be undone.');
      if (confirmed) onDelete(transaction.id);
      return;
    }
    Alert.alert('Delete transaction?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(transaction.id) },
    ]);
  }

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
      <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
        <Text style={styles.deleteBtnText}>✕</Text>
      </TouchableOpacity>
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
  amount: { fontSize: 15, fontWeight: '700', marginRight: 10 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 16, color: '#9ca3af', fontWeight: '600' },
});