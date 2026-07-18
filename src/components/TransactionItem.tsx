import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { Transaction, Category } from '../types';
import { colors, fonts } from '../theme';
import CategoryStamp from './CategoryStamp';

interface Props {
  transaction: Transaction;
  category?: Category;
  onDelete: (id: number) => void;
  onPress: (id: number) => void;
}

export default function TransactionItem({ transaction, category, onDelete, onPress }: Props) {
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
    <TouchableOpacity style={styles.row} onPress={() => onPress(transaction.id)} activeOpacity={0.7}>
      <View style={styles.left}>
        <CategoryStamp name={category?.name ?? 'Other'} color={category?.color ?? colors.ash} />
        {!!transaction.note && <Text style={styles.note}>{transaction.note}</Text>}
        <Text style={styles.date}>{new Date(transaction.date).toDateString().toUpperCase()}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? colors.stampGreen : colors.receiptRed }]}>
          {isIncome ? '+' : '-'}{transaction.amount.toLocaleString()}
        </Text>
        <TouchableOpacity onPress={confirmDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    borderBottomColor: '#D9D3C4',
    backgroundColor: colors.paper,
  },
  left: { flex: 1, marginRight: 10 },
  note: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, marginTop: 5 },
  date: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, marginTop: 3, letterSpacing: 0.5 },
  right: { alignItems: 'flex-end' },
  amount: { fontFamily: fonts.monoBold, fontSize: 16 },
  deleteBtn: { padding: 4, marginTop: 6 },
  deleteBtnText: { fontSize: 13, color: colors.ash, fontWeight: '600' },
});