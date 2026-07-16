import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, addTransaction, getBudgets, getTransactionsByMonth } from '../db/storage';
import { Category, TransactionType, Budget } from '../types';
import { showAlert } from '../utils/alert'; 
import { useState, useCallback } from 'react';

export default function AddTransactionScreen() {
  const [type, setType] = useState<TransactionType>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const cats = await getCategories();
        setCategories(cats);
        const firstMatch = cats.find((c) => c.type === type);
        setCategoryId(firstMatch ? firstMatch.id : null);
      })();
    }, [type])
  );

  const filteredCategories = categories.filter((c) => c.type === type);

  async function checkBudgetStatus(categoryId: number): Promise<{ status: 'ok' | 'warning' | 'over'; spent: number; limit: number } | null> {
  const budgets = await getBudgets();
  const budget = budgets.find((b) => b.categoryId === categoryId);
  if (!budget) return null;

  const now = new Date();
  const monthTx = await getTransactionsByMonth(now.getFullYear(), now.getMonth() + 1);
  const spent = monthTx
    .filter((t) => t.type === 'expense' && t.categoryId === categoryId)
    .reduce((s, t) => s + t.amount, 0);

  const pct = spent / budget.monthlyLimit;
  if (pct >= 1) return { status: 'over', spent, limit: budget.monthlyLimit };
  if (pct >= 0.8) return { status: 'warning', spent, limit: budget.monthlyLimit };
  return { status: 'ok', spent, limit: budget.monthlyLimit };
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

    await addTransaction({
      type,
      amount: parsed,
      categoryId,
      note: note.trim(),
      date: new Date().toISOString(),
    });

    setAmount('');
    setNote('');

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

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'expense' && styles.toggleActiveExpense]}
          onPress={() => setType('expense')}
        >
          <Text style={[styles.toggleText, type === 'expense' && styles.toggleTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, type === 'income' && styles.toggleActiveIncome]}
          onPress={() => setType('income')}
        >
          <Text style={[styles.toggleText, type === 'income' && styles.toggleTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Amount (KES)</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
        placeholder="0.00"
      />

      <Text style={styles.label}>Category</Text>
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
            <Text style={{ color: categoryId === c.id ? '#fff' : c.color, fontWeight: '600' }}>
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. Lunch with friends"
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Save Transaction</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  toggleRow: { flexDirection: 'row', marginBottom: 20, borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  toggleBtn: { flex: 1, padding: 12, alignItems: 'center', backgroundColor: '#f5f5f5' },
  toggleActiveExpense: { backgroundColor: '#dc2626' },
  toggleActiveIncome: { backgroundColor: '#16a34a' },
  toggleText: { fontWeight: '600', color: '#666' },
  toggleTextActive: { color: '#fff' },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, marginRight: 8, marginBottom: 8 },
  saveBtn: { backgroundColor: '#111827', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});