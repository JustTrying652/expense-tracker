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
import SearchFilterBar, { TypeFilter, DateFilter } from '../components/SearchFilterBar';

type NavProp = NativeStackNavigationProp<HomeStackParamList, 'HomeList'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

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

  
  const isFiltered = search.trim() !== '' || typeFilter !== 'all' || dateFilter !== 'all';
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  function matchesDateFilter(dateStr: string): boolean {
    if (dateFilter === 'all') return true;
    const txDate = new Date(dateStr);
    const now = new Date();

    if (dateFilter === 'thisMonth') {
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    }
    if (dateFilter === 'lastMonth') {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return txDate.getFullYear() === lastMonth.getFullYear() && txDate.getMonth() === lastMonth.getMonth();
    }
    if (dateFilter === 'last3Months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return txDate >= threeMonthsAgo;
    }
    return true;
  }

  const filteredTransactions = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (!matchesDateFilter(t.date)) return false;

    if (search.trim()) {
      const query = search.trim().toLowerCase();
      const categoryName = categoryMap[t.categoryId]?.name?.toLowerCase() ?? '';
      const note = t.note?.toLowerCase() ?? '';
      if (!categoryName.includes(query) && !note.includes(query)) return false;
    }

    return true;
  });
  const balance = filteredTransactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount),
    0
  );

  return (
    <View style={styles.container}>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>CURRENT BALANCE</Text>
        <Text style={styles.balanceValue}>
          KES {balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </Text>
      </View>
      <ZigzagEdge fill={colors.ink} />
      <SearchFilterBar
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        dateFilter={dateFilter}
        onDateFilterChange={setDateFilter}
      />

      <FlatList
        data={filteredTransactions}
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
            emoji={isFiltered ? '🔍' : '🧾'}
            title={isFiltered ? 'No matches' : 'No transactions yet'}
            subtitle={isFiltered ? 'Try a different search or filter.' : 'Tap Add below to record your first income or expense.'}
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