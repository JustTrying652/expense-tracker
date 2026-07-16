import { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTransactions, getCategories, deleteTransaction } from '../db/storage';
import { Transaction, Category } from '../types';
import TransactionItem from '../components/TransactionItem';
import { HomeStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

export default function HomeScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigation = useNavigation<NavProp>();

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactions());
        setCategories(await getCategories());
      })();
    }, [])
  );

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions(await getTransactions());
  }

  function handlePress(transaction: Transaction) {
    navigation.navigate('EditTransaction', { transaction });
  }

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

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
          <TransactionItem
            transaction={item}
            category={categoryMap[item.categoryId]}
            onDelete={handleDelete}
            onPress={handlePress}
          />
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