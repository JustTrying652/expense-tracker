import { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getTransactions, getCategories, deleteTransaction } from '../db/storage';
import { Transaction, Category } from '../types';
import TransactionItem from '../components/TransactionItem';

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // useFocusEffect refetches every time the tab is focused, so new
  // transactions show up immediately after adding one on another tab.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactions());
        setCategories(await getCategories());
      })();
    }, [])
  );

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions(await getTransactions());
  }
  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>KES {balance.toLocaleString()}</Text>
      </View>
      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TransactionItem transaction={item} category={categoryMap[item.categoryId]} onDelete={handleDelete} />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet. Add your first one below.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  balanceCard: { padding: 20, backgroundColor: '#111827' },
  balanceLabel: { color: '#9ca3af', fontSize: 13 },
  balanceValue: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});