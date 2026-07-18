import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getCategories, getBudgets, setBudget, deleteBudget } from '../db/storage';
import { Category, Budget } from '../types';
import { showAlert } from '../utils/alert';
import { colors, fonts, spacing } from '../theme';
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
      showAlert('Invalid amount', 'Enter a limit greater than 0.');
      return;
    }
    await setBudget(categoryId, value);
    setBudgets(await getBudgets());
    showAlert('Saved', 'Budget updated.');
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

  if (loading) return <LoadingSpinner />;

  const budgetMap = Object.fromEntries(budgets.map((b) => [b.categoryId, b.monthlyLimit]));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>MONTHLY LIMITS</Text>
        <Text style={styles.headerTitle}>Budgets</Text>
      </View>
      <FlatList
        data={categories}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={{ padding: spacing.md }}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowTop}>
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text style={styles.categoryName}>{item.name}</Text>
            </View>
            <View style={styles.rowBottom}>
              <View style={styles.inputWrap}>
                <Text style={styles.currencyPrefix}>KES</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="No limit"
                  placeholderTextColor={colors.ash}
                  value={inputs[item.id] ?? ''}
                  onChangeText={(text) => setInputs((prev) => ({ ...prev, [item.id]: text }))}
                />
              </View>
              <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.saveBtn}>
                <Text style={styles.saveBtnText}>SAVE</Text>
              </TouchableOpacity>
              {budgetMap[item.id] != null && (
                <TouchableOpacity onPress={() => handleClear(item.id)} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
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
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#D9D3C4',
    borderStyle: 'dashed',
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  categoryName: { fontFamily: fonts.displayMedium, fontSize: 14, color: colors.ink },
  rowBottom: { flexDirection: 'row', alignItems: 'center' },
  inputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: '#D9D3C4', marginRight: 8 },
  currencyPrefix: { fontFamily: fonts.mono, fontSize: 12, color: colors.ash, marginRight: 4 },
  input: { flex: 1, fontFamily: fonts.mono, fontSize: 14, color: colors.ink, paddingVertical: 6 },
  saveBtn: { backgroundColor: colors.ink, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 6 },
  saveBtnText: { color: colors.white, fontFamily: fonts.displayMedium, fontSize: 11, letterSpacing: 0.5 },
  clearBtn: { marginLeft: 6, padding: 4 },
  clearBtnText: { color: colors.ash, fontSize: 14, fontWeight: '600' },
});