import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, getBudgets, setBudget, deleteBudget } from '../db/storage';
import { Category, Budget } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';

export default function BudgetsScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [inputs, setInputs] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const cats = (await getCategories()).filter((c) => c.type === 'expense');
        const bud = await getBudgets();
        setCategories(cats);
        setBudgets(bud);
        const initialInputs: Record<number, string> = {};
        bud.forEach((b) => { initialInputs[b.categoryId] = String(b.monthlyLimit); });
        setInputs(initialInputs);
        setLoading(false);
      })();
    }, [])
  );

  async function handleSave(categoryId: number) {
    const value = parseFloat(inputs[categoryId]);
    if (!value || value <= 0) {
      Alert.alert('Invalid amount', 'Enter a limit greater than 0.');
      return;
    }
    await setBudget(categoryId, value);
    setBudgets(await getBudgets());
    Alert.alert('Saved', 'Budget updated.');
  }

  async function handleClear(categoryId: number) {
    await deleteBudget(categoryId);
    setBudgets(await getBudgets());
    setInputs((prev) => {
      const next = { ...prev };
      delete next[categoryId];
      return next;
    });
  }

  const budgetMap = Object.fromEntries(budgets.map((b) => [b.categoryId, b.monthlyLimit]));

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Monthly Budgets</Text>
      <Text style={styles.subheader}>Set a spending limit per category. Applies every month.</Text>
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: item.color }]} />
            <Text style={styles.categoryName}>{item.name}</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="No limit"
              value={inputs[item.id] ?? ''}
              onChangeText={(text) => setInputs((prev) => ({ ...prev, [item.id]: text }))}
            />
            <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            {budgetMap[item.id] != null && (
              <TouchableOpacity onPress={() => handleClear(item.id)} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { fontSize: 20, fontWeight: '700', paddingHorizontal: 16, paddingTop: 16 },
  subheader: { fontSize: 13, color: '#666', paddingHorizontal: 16, marginTop: 4, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  categoryName: { flex: 1, fontSize: 14, fontWeight: '600', color: '#111' },
  input: { width: 90, borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 8, fontSize: 13, marginRight: 8 },
  saveBtn: { backgroundColor: '#111827', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6 },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  clearBtn: { marginLeft: 6, padding: 4 },
  clearBtnText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
});