import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useFocusEffect, useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import {
  getCategories,
  addTransaction,
  updateTransaction,
  getTransactionById,
  getBudgets,
  getTransactionsByMonth,
  addRecurringRule,
} from '../db/storage';
import { Category, TransactionType } from '../types';
import { showAlert } from '../utils/alert';
import { HomeStackParamList } from '../navigation';
import { colors, fonts, spacing } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import DateTimePicker from '@react-native-community/datetimepicker';


type EditRouteProp = RouteProp<HomeStackParamList, 'EditTransaction'>;

export default function AddTransactionScreen() {
  const route = useRoute<EditRouteProp>();
  const navigation = useNavigation();
  const editingId = route.params?.transactionId;
  const isEditMode = editingId != null;

  const [type, setType] = useState<TransactionType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loaded, setLoaded] = useState(!isEditMode);
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const cats = await getCategories();
        setCategories(cats);

        if (isEditMode) {
          const existing = await getTransactionById(editingId);
          if (existing) {
            setType(existing.type);
            setCategoryId(existing.categoryId);
            setAmount(String(existing.amount));
            setNote(existing.note ?? '');
            setDate(new Date(existing.date));
          }
          setLoaded(true);
        } else {
          const firstMatch = cats.find((c) => c.type === type);
          setCategoryId((prev) => prev ?? (firstMatch ? firstMatch.id : null));
        }
      })();
    }, [isEditMode, editingId])
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  async function checkBudgetStatus(categoryId: number) {
    const budgets = await getBudgets();
    const budget = budgets.find((b) => b.categoryId === categoryId);
    if (!budget) return null;

    const now = new Date();
    const monthTx = await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
    const spent = monthTx
      .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
      .reduce((s, t) => s + t.amount, 0);

    const pct = spent / budget.monthlyLimit;
    if (pct >= 1) return { status: 'over' as const, spent, limit: budget.monthlyLimit };
    if (pct >= 0.8) return { status: 'warning' as const, spent, limit: budget.monthlyLimit };
    return { status: 'ok' as const, spent, limit: budget.monthlyLimit };
  }

  async function handleSave() {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) {
      showAlert('Invalid amount', 'Enter an amount greater than 0.');
      return;
    }
    if (!categoryId) {
      showAlert('Pick a category', 'Choose a category before saving.');
      return;
    }

    const payload = {
      type,
      amount: parsed,
      categoryId,
      note: note.trim(),
      date: new Date().toISOString(),
    };

    if (isEditMode) {
      await updateTransaction(editingId, payload);
      showAlert('Updated', 'Transaction updated.');
      navigation.goBack();
      return;
    }

    await addTransaction(payload);

    if (repeatMonthly) {
      const today = new Date();
      await addRecurringRule({
        type,
        amount: parsed,
        categoryId,
        note: note.trim(),
        dayOfMonth: today.getDate(),
        lastGeneratedMonth: `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`,
      });
    }

    setAmount('');
    setNote('');
    setRepeatMonthly(false);

    if (type === 'expense') {
      const result = await checkBudgetStatus(categoryId);
      const categoryName = categories.find((c) => c.id === categoryId)?.name ?? 'this category';

      if (result?.status === 'over') {
        showAlert(
          'Over budget',
          `You've spent KES ${result.spent.toLocaleString()} on ${categoryName} this month — KES ${(result.spent - result.limit).toLocaleString()} over your KES ${result.limit.toLocaleString()} limit.`
        );
        return;
      }
      if (result?.status === 'warning') {
        showAlert(
          'Approaching budget',
          `You've used KES ${result.spent.toLocaleString()} of your KES ${result.limit.toLocaleString()} ${categoryName} budget (${Math.round((result.spent / result.limit) * 100)}%).`
        );
        return;
      }
    }

    showAlert('Saved', 'Transaction added.');
  }

  if (!loaded) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>{isEditMode ? 'EDIT ENTRY' : 'NEW ENTRY'}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'expense' && { backgroundColor: colors.receiptRed, borderColor: colors.receiptRed }]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>EXPENSE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, type === 'income' && { backgroundColor: colors.stampGreen, borderColor: colors.stampGreen }]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>INCOME</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>AMOUNT (KES)</Text>
        <TextInput
          style={styles.amountInput}
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.ash}
        />

        <Text style={styles.label}>CATEGORY</Text>
        <View style={styles.chipRow}>
          {filteredCategories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.chip,
                { borderColor: c.color },
                categoryId === c.id && { backgroundColor: c.color },
              ]}
              onPress={() => setCategoryId(c.id)}
            >
              <Text style={[styles.chipText, { color: categoryId === c.id ? colors.white : c.color }]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>NOTE (OPTIONAL)</Text>
        <TextInput
          style={styles.input}
          value={note}
          onChangeText={setNote}
          placeholder="e.g. Lunch with friends"
          placeholderTextColor={colors.ash}
        />
        {!isEditMode && (
          <TouchableOpacity style={styles.repeatRow} onPress={() => setRepeatMonthly((v) => !v)}>
            <View style={[styles.checkbox, repeatMonthly && styles.checkboxActive]}>
              {repeatMonthly && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.repeatLabel}>Repeat monthly</Text>
              <Text style={styles.repeatHint}>
                Auto-adds this on day {new Date().getDate()} of every month
              </Text>
            </View>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditMode ? 'UPDATE TRANSACTION' : 'SAVE TRANSACTION'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { backgroundColor: colors.ink, paddingVertical: 20, paddingHorizontal: spacing.md },
  headerLabel: { fontFamily: fonts.mono, color: '#9CA3AF', fontSize: 12, letterSpacing: 2 },
  body: { padding: spacing.md },
  toggleRow: { flexDirection: 'row', marginBottom: spacing.lg, gap: spacing.sm },
  toggleBtn: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    backgroundColor: colors.paper,
  },
  toggleText: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ash, letterSpacing: 0.5 },
  toggleTextActive: { color: colors.white },
  label: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, letterSpacing: 1, marginBottom: 8, marginTop: 18 },
  amountInput: {
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    borderRadius: 8,
    padding: 14,
    fontFamily: fonts.monoBold,
    fontSize: 24,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    fontFamily: fonts.mono,
    color: colors.ink,
    backgroundColor: colors.white,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipText: { fontFamily: fonts.displayMedium, fontSize: 13 },
  saveBtn: { backgroundColor: colors.ink, padding: 16, borderRadius: 8, alignItems: 'center', marginTop: spacing.lg },
  saveBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 14, letterSpacing: 1 },
  repeatRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 12, backgroundColor: colors.white, borderRadius: 8, borderWidth: 1.5, borderColor: '#D9D3C4' },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: '#D9D3C4', marginRight: 12, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.stampGreen, borderColor: colors.stampGreen },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  repeatLabel: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink },
  repeatHint: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, marginTop: 2 },
});