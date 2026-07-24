import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { PieChart } from 'react-native-chart-kit';
import * as Print from 'expo-print';
import {
  getTransactionsByMonth,
  getCategories,
  getBudgets,
  getMonthlyTotals,
  MonthlyTotal,
  getSavingsGoals,
  getSavingsContributions,
} from '../db/storage';
import { Transaction, Category, Budget, SavingsGoal, SavingsContribution } from '../types';
import { buildReportHtml } from '../utils/pdfTemplate';
import { showAlert } from '../utils/alert';
import { colors, fonts, spacing } from '../theme';
import BudgetProgressBar from '../components/BudgetProgressBar';
import TrendChart from '../components/TrendChart';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { generateInsights } from '../utils/insights';
import InsightCard from '../components/InsightCard';

const screenWidth = Dimensions.get('window').width;

export default function ReportsScreen() {
  const [viewDate, setViewDate] = useState(new Date());
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyTotals, setMonthlyTotals] = useState<MonthlyTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const isCurrentMonth = viewDate.getFullYear() === now.getFullYear() && viewDate.getMonth() === now.getMonth();
  const [prevTransactions, setPrevTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setTransactions(await getTransactionsByMonth(viewDate.getFullYear(), viewDate.getMonth() + 1));

        const prevDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
        setPrevTransactions(await getTransactionsByMonth(prevDate.getFullYear(), prevDate.getMonth() + 1));

        setCategories(await getCategories());
        setBudgets(await getBudgets());
        setMonthlyTotals(await getMonthlyTotals(6));
        setGoals(await getSavingsGoals());
        setContributions(await getSavingsContributions());
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
  function formatDelta(current: number, previous: number): { text: string; isIncrease: boolean } | null {
  if (previous === 0) {
    if (current === 0) return null;
    return { text: 'NEW', isIncrease: true };
  }
  const pctChange = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(pctChange));
  const isIncrease = pctChange > 0;
  return { text: `${isIncrease ? '▲' : '▼'} ${rounded}%`, isIncrease };
}

  const monthLabel = `${viewDate.toLocaleString('default', { month: 'long' })} ${viewDate.getFullYear()}`;

  if (loading) return <LoadingSpinner />;

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const expenseByCategory: Record<number, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      expenseByCategory[t.categoryId] = (expenseByCategory[t.categoryId] ?? 0) + t.amount;
    });
  const prevTotalIncome = prevTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const prevTotalExpense = prevTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const prevExpenseByCategory: Record<number, number> = {};
  prevTransactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      prevExpenseByCategory[t.categoryId] = (prevExpenseByCategory[t.categoryId] ?? 0) + t.amount;
    });

  const incomeDelta = formatDelta(totalIncome, prevTotalIncome);
  const expenseDelta = formatDelta(totalExpense, prevTotalExpense);

  // Union of categories with spend in either month, sorted by current-month spend descending
  const allCategoryIds = new Set([
    ...Object.keys(expenseByCategory).map(Number),
    ...Object.keys(prevExpenseByCategory).map(Number),
  ]);
  const categoryComparisons = Array.from(allCategoryIds)
    .map((catId) => ({
      catId,
      current: expenseByCategory[catId] ?? 0,
      previous: prevExpenseByCategory[catId] ?? 0,
    }))
    .filter((c) => c.current > 0) // only show categories with spend this month
    .sort((a, b) => b.current - a.current);
  const pieData = Object.entries(expenseByCategory).map(([catId, amount]) => {
    const cat = categoryMap[Number(catId)];
    return {
      name: cat?.name ?? 'Other',
      amount,
      color: cat?.color ?? colors.ash,
      legendFontColor: colors.ink,
      legendFontSize: 12,
    };
  });

  async function handleExport() {
    const html = buildReportHtml({ transactions, categories, monthLabel });
    try {
      await Print.printAsync({ html });
    } catch (err) {
      showAlert('Export failed', 'Could not generate PDF. Try again.');
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}>
      <View style={styles.monthNav}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navBtn}>
          <Text style={styles.navBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{monthLabel.toUpperCase()}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navBtn} disabled={isCurrentMonth}>
          <Text style={[styles.navBtnText, isCurrentMonth && { opacity: 0.3 }]}>›</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.exportBtn} onPress={handleExport}>
        <Text style={styles.exportBtnText}>EXPORT AS PDF</Text>
      </TouchableOpacity>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderColor: colors.stampGreen }]}>
          <Text style={styles.summaryLabel}>INCOME</Text>
          <Text style={[styles.summaryValue, { color: colors.stampGreen }]}>
            {totalIncome.toLocaleString()}
          </Text>
          {incomeDelta && (
            <Text style={[styles.deltaText, { color: incomeDelta.isIncrease ? colors.stampGreen : colors.receiptRed }]}>
              {incomeDelta.text} vs last month
            </Text>
          )}
        </View>
        <View style={[styles.summaryCard, { borderColor: colors.receiptRed }]}>
          <Text style={styles.summaryLabel}>EXPENSES</Text>
          <Text style={[styles.summaryValue, { color: colors.receiptRed }]}>
            {totalExpense.toLocaleString()}
          </Text>
          {expenseDelta && (
            <Text style={[styles.deltaText, { color: expenseDelta.isIncrease ? colors.receiptRed : colors.stampGreen }]}>
              {expenseDelta.text} vs last month
            </Text>
          )}
        </View>
      </View>

      <Text style={styles.sectionTitle}>SPENDING BY CATEGORY</Text>
      {pieData.length > 0 ? (
        <PieChart
          data={pieData}
          width={screenWidth - 32}
          height={200}
          chartConfig={{ color: () => colors.ink }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="0"
        />
      ) : (
        <EmptyState emoji="🧾" title="No expenses this month" subtitle="Your category breakdown will appear here once you add some." />
      )}
      {categoryComparisons.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>VS LAST MONTH</Text>
          {categoryComparisons.map(({ catId, current, previous }) => {
            const cat = categoryMap[catId];
            const delta = formatDelta(current, previous);
            return (
              <View key={catId} style={styles.compareRow}>
                <View style={[styles.compareDot, { backgroundColor: cat?.color ?? colors.ash }]} />
                <Text style={styles.compareName}>{cat?.name ?? 'Other'}</Text>
                <Text style={styles.compareAmount}>{current.toLocaleString()}</Text>
                {delta && (
                  <Text style={[styles.compareDelta, { color: delta.isIncrease ? colors.receiptRed : colors.stampGreen }]}>
                    {delta.text}
                  </Text>
                )}
              </View>
            );
          })}
        </>
      )}
      {budgets.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>BUDGET PROGRESS</Text>
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

      <Text style={styles.sectionTitle}>6-MONTH TREND</Text>
      <TrendChart data={monthlyTotals} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  navBtn: { paddingHorizontal: 20, paddingVertical: 4 },
  navBtnText: { fontSize: 24, color: colors.ink, fontFamily: fonts.display },
  title: { fontFamily: fonts.mono, fontSize: 13, color: colors.ink, letterSpacing: 1.5 },
  exportBtn: { backgroundColor: colors.ink, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  exportBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 12, letterSpacing: 1 },
  summaryRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 14, backgroundColor: colors.white, borderWidth: 1.5, borderStyle: 'dashed' },
  summaryLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 1 },
  summaryValue: { fontFamily: fonts.monoBold, fontSize: 18, marginTop: 4 },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink, letterSpacing: 0.5, marginBottom: 12, marginTop: 8 },
  deltaText: { fontFamily: fonts.mono, fontSize: 10, marginTop: 4, letterSpacing: 0.3 },
  compareRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EDE8DD' },
  compareDot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  compareName: { flex: 1, fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink },
  compareAmount: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, marginRight: 10 },
  compareDelta: { fontFamily: fonts.monoBold, fontSize: 11, width: 55, textAlign: 'right' },
});