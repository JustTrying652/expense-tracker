import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getRecurringRules, getCategories, deleteRecurringRule } from '../db/storage';
import { RecurringRule, Category } from '../types';
import { colors, fonts, spacing } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { detectRecurringCandidates, dismissSuggestion, RecurringSuggestion } from '../db/storage';
import { addRecurringRule } from '../db/storage';

export default function RecurringScreen() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<RecurringSuggestion[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setRules(await getRecurringRules());
        setCategories(await getCategories());
        setLoading(false);
      })();
    }, [])
  );

  async function handleDelete(id: number) {
    const doDelete = async () => {
      await deleteRecurringRule(id);
      setRules(await getRecurringRules());
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Stop this recurring transaction? Past entries stay, but no new ones will be created.')) {
        doDelete();
      }
      return;
    }
    Alert.alert('Stop recurring transaction?', 'Past entries stay, but no new ones will be created.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Stop', style: 'destructive', onPress: doDelete },
    ]);
  }

  if (loading) return <LoadingSpinner />;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>STANDING ORDERS</Text>
        <Text style={styles.headerTitle}>Recurring</Text>
      </View>
      <FlatList
        data={rules}
        keyExtractor={(r) => String(r.id)}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => {
          const cat = categoryMap[item.categoryId];
          const isIncome = item.type === 'income';
          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Text style={styles.categoryName}>{cat?.name ?? 'Uncategorized'}</Text>
                {!!item.note && <Text style={styles.note}>{item.note}</Text>}
                <Text style={styles.schedule}>DAY {item.dayOfMonth} OF EVERY MONTH</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={[styles.amount, { color: isIncome ? colors.stampGreen : colors.receiptRed }]}>
                  {isIncome ? '+' : '-'}{item.amount.toLocaleString()}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.stopBtn}>
                  <Text style={styles.stopBtnText}>STOP</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            emoji="🔁"
            title="No recurring transactions"
            subtitle="Check 'Repeat monthly' when adding a transaction to set one up."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { backgroundColor: colors.ink, paddingVertical: 20, paddingHorizontal: spacing.md },
  headerLabel: { fontFamily: fonts.mono, color: '#9CA3AF', fontSize: 11, letterSpacing: 2 },
  headerTitle: { fontFamily: fonts.display, color: colors.white, fontSize: 22, marginTop: 4 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    borderStyle: 'dashed',
  },
  rowLeft: { flex: 1, marginRight: 10 },
  categoryName: { fontFamily: fonts.displayMedium, fontSize: 14, color: colors.ink },
  note: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, marginTop: 4 },
  schedule: { fontFamily: fonts.mono, fontSize: 9, color: colors.ash, marginTop: 6, letterSpacing: 0.5 },
  rowRight: { alignItems: 'flex-end' },
  amount: { fontFamily: fonts.monoBold, fontSize: 15 },
  stopBtn: { marginTop: 8, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.receiptRed },
  stopBtnText: { fontFamily: fonts.displayMedium, fontSize: 10, color: colors.receiptRed, letterSpacing: 0.5 },
});