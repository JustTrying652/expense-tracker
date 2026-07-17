import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import { getTransactionsByMonth, getCategories, getBudgets, getMonthlyTotals, MonthlyTotal } from '../db/storage';
import { Transaction, Category, Budget } from '../types';
import * as Print from 'expo-print';
import { buildReportHtml } from '../utils/pdfTemplate';
import BudgetProgressBar from '../components/BudgetProgressBar';
import TrendChart from '../components/TrendChart';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const [viewDate, setViewDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const now = new Date();
  const isCurrentMonth = viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);


  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactionsByMonth(viewDate.getFullYear(), viewDate.getMonth() + 1));
        setCategories(await getCategories());
        setBudgets(await getBudgets());
        setMonthlyTotals(await getMonthlyTotals(6));
        setLoading(false);
      })();
    }, [viewDate])
  );
  function goToPrevMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function goToNextMonth() {
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }
  const monthLabel = `${viewDate.toLocaleString('default', { month: 'long' })} ${viewDate.getFullYear()}`;
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
    const html = buildReportHtml({ transactions, categories, monthLabel });
    try {
      await Print.printAsync({ html });
    } catch (err) {
      Alert.alert('Export failed', 'Could not generate PDF. Try again.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{monthLabel}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn} disabled={isCurrentMonth}>
          <Text style={[styles.navBtnText, isCurrentMonth && { opacity: 0.3 }]}>›</Text>
        </TouchableOpacity>
      </View>
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
      {budgets.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Budget Progress</Text>
          {budgets.map((b) => {
            const cat = categoryMap[b.categoryId];
            if (!cat) return null;
            const spent = expenseByCategory[b.categoryId] ?? 0;
            return (
              <BudgetProgressBar
                key={b.categoryId}
                categoryName={cat.name}
                color={cat.color}
                spent={spent}
                limit={b.monthlyLimit}
              />
            );
          })}
        </>
      )}
      <Text style={styles.sectionTitle}>6-Month Trend</Text>
      <TrendChart data={monthlyTotals} />
    </ScrollView>
    
  );
}

const styles = StyleSheet.create({
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  navBtn: { paddingHorizontal: 20, paddingVertical: 4 },
  navBtnText: { fontSize: 24, color: '#111827', fontWeight: '600' },
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