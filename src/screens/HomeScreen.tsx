import { useCallback, useState } from 'react';
import { View, FlatList, Text, StyleSheet } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { getTransactions, getCategories, deleteTransaction } from '../db/storage';
import { Transaction, Category } from '../types';
import TransactionItem from '../components/TransactionItem';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import ZigzagEdge from '../components/ZigzagEdge';
import { colors, fonts } from '../theme';
import { HomeStackParamList } from '../navigation';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactions());
        setCategories(await getCategories());
        setLoading(false);
      })();
    }, [])
  );

  async function handleDelete(id: number) {
    await deleteTransaction(id);
    setTransactions(await getTransactions());
  }

  function handleEdit(id: number) {
    navigation.navigate('EditTransaction', { transactionId: id });
  }

  if (loading) return <LoadingSpinner />;

  const balance = transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceValue}>
          KES {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <ZigzagEdge fill={colors.ink} />

      <FlatList
        data={transactions}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TransactionItem
            transaction={item}
            category={categoryMap[item.categoryId]}
            onDelete={handleDelete}
            onPress={handleEdit}
          />
        )}
        ListEmptyComponent={
          <EmptyState
            emoji="🧾"
            title="No transactions yet"
            subtitle="Tap Add below to record your first income or expense."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  balanceCard: { padding: 20, paddingBottom: 28, backgroundColor: colors.ink },
  balanceLabel: { fontFamily: fonts.mono, color: '#9CA3AF', fontSize: 11, letterSpacing: 1.5 },
  balanceValue: { fontFamily: fonts.display, color: colors.white, fontSize: 32, marginTop: 6 },
});