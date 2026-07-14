import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { getTransactionsByMonth, getCategories } from '../db/storage';
import { Transaction, Category } from '../types';
import { TouchableOpacity, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildReportHtml } from '../utils/pdfTemplate';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const now = new Date();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1));
        setCategories(await getCategories());
      })();
    }, [])
  );

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const expenseByCategory: Record<number, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] ?? 0) + t.amount;
    });

  const pieData = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const cat = categoryMap[Number(catId)];
    return {
      name: cat?.name ?? 'Other',
      amount,
      color: cat?.color ?? '#999',
      legendFontColor: '#333',
      legendFontSize: 12,
    };
  });
  async function handleExport() {
    const monthLabel = `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`;
    const html = buildReportHtml({ transactions, categories, monthLabel });

    try {
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert('Export failed', 'Could not generate PDF. Try again.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.title}>
        {now.toLocaleString('default', { month: 'long' })} {now.getFullYear()}
      </Text>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Text style={styles.exportBtnText}>Export as PDF</Text>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: '#16a34a' }]}>
            KES {totalIncome.toLocaleString()}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#fee2e2' }]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: '#dc2626' }]}>
            KES {totalExpense.toLocaleString()}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Spending by Category</Text>
      {pieData.length > 0 ? (
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{ color: () => '#000' }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="0"
        />
      ) : (
        <Text style={styles.empty}>No expenses recorded this month yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
    exportBtn: { backgroundColor: '#111827', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  exportBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  container: { flex: 1, backgroundColor: '#fff' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 14 },
  summaryLabel: { fontSize: 12, color: '#374151' },
  summaryValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 12 },
  empty: { textAlign: 'center', marginTop: 20, color: '#999' },
});