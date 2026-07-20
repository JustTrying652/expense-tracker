import { useCallback, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, Platform, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSavingsGoals,
  addSavingsGoal,
  deleteSavingsGoal,
  getSavingsContributions,
  addSavingsContribution,
} from '../db/storage';
import { SavingsGoal, SavingsContribution } from '../types';
import { parseAmount } from '../utils/parseAmount';
import { showAlert } from '../utils/alert';
import { colors, fonts, spacing } from '../theme';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import DateField from '../components/DateField';

export default function GoalsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [contributions, setContributions] = useState<SavingsContribution[]>([]);
  const [loading, setLoading] = useState(true);

  // New goal form
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());

  // Per-goal contribution inputs
  const [contribInputs, setContribInputs] = useState<Record<number, string>>({});

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setGoals(await getSavingsGoals());
        setContributions(await getSavingsContributions());
        setLoading(false);
      })();
    }, [])
  );

  async function handleAddGoal() {
    const parsedTarget = parseAmount(targetAmount);
    if (!name.trim()) {
      showAlert('Name required', 'Give your goal a name.');
      return;
    }
    if (!parsedTarget) {
      showAlert('Invalid amount', 'Enter a target amount greater than 0.');
      return;
    }

    await addSavingsGoal({
      name: name.trim(),
      targetAmount: parsedTarget,
      targetDate: targetDate.toISOString(),
    });

    setName('');
    setTargetAmount('');
    setTargetDate(new Date());
    setGoals(await getSavingsGoals());
    showAlert('Goal added', 'Your savings goal is set up.');
  }

  async function handleContribute(goalId: number) {
    const value = parseAmount(contribInputs[goalId]);
    if (!value) {
      showAlert('Invalid amount', 'Enter a contribution amount greater than 0.');
      return;
    }

    await addSavingsContribution({ goalId, amount: value, date: new Date().toISOString() });
    setContributions(await getSavingsContributions());
    setContribInputs((prev) => ({ ...prev, [goalId]: '' }));
    showAlert('Added', 'Contribution recorded.');
  }

  async function handleDeleteGoal(id: number) {
    const doDelete = async () => {
      await deleteSavingsGoal(id);
      setGoals(await getSavingsGoals());
      setContributions(await getSavingsContributions());
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Delete this goal? Its contribution history will be lost.')) doDelete();
      return;
    }
    Alert.alert('Delete goal?', 'Its contribution history will be lost.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
      ListHeaderComponent={
        <>
          <View style={styles.headerBlock}>
            <Text style={styles.headerLabel}>SAVINGS TARGETS</Text>
            <Text style={styles.headerTitle}>Goals</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>GOAL NAME</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Emergency Fund"
              placeholderTextColor={colors.ash}
            />

            <Text style={styles.label}>TARGET AMOUNT (KES)</Text>
            <TextInput
              style={styles.input}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
              placeholder="50,000"
              placeholderTextColor={colors.ash}
            />

            <Text style={styles.label}>TARGET DATE</Text>
            <DateField value={targetDate} onChange={setTargetDate} minimumDate={new Date()} />

            <TouchableOpacity style={styles.addBtn} onPress={handleAddGoal}>
              <Text style={styles.addBtnText}>ADD GOAL</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>YOUR GOALS</Text>
        </>
      }
      data={goals}
      keyExtractor={(g) => String(g.id)}
      ListEmptyComponent={
        <EmptyState emoji="🎯" title="No goals yet" subtitle="Set one up above to start tracking progress." />
      }
      renderItem={({ item }) => {
        const saved = contributions
          .filter((c) => c.goalId === item.id)
          .reduce((s, c) => s + c.amount, 0);
        const pct = Math.min((saved / item.targetAmount) * 100, 100);
        const isComplete = saved >= item.targetAmount;

        return (
          <View style={styles.goalCard}>
            <View style={styles.goalTop}>
              <Text style={styles.goalName}>{item.name}</Text>
              <TouchableOpacity onPress={() => handleDeleteGoal(item.id)}>
                <Text style={styles.deleteText}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  { width: `${pct}%`, backgroundColor: isComplete ? colors.stampGreen : colors.kangaGold },
                ]}
              />
            </View>

            <View style={styles.goalMeta}>
              <Text style={styles.goalAmount}>
                KES {saved.toLocaleString()} / {item.targetAmount.toLocaleString()}
              </Text>
              {item.targetDate && (
                <Text style={styles.goalDate}>
                  BY {new Date(item.targetDate).toLocaleDateString()}
                </Text>
              )}
            </View>

            {isComplete ? (
              <Text style={styles.completeText}>🎉 GOAL REACHED</Text>
            ) : (
              <View style={styles.contribRow}>
                <TextInput
                  style={styles.contribInput}
                  placeholder="Add amount"
                  placeholderTextColor={colors.ash}
                  keyboardType="numeric"
                  value={contribInputs[item.id] ?? ''}
                  onChangeText={(text) => setContribInputs((prev) => ({ ...prev, [item.id]: text }))}
                />
                <TouchableOpacity style={styles.contribBtn} onPress={() => handleContribute(item.id)}>
                  <Text style={styles.contribBtnText}>ADD</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  headerBlock: { backgroundColor: colors.ink, paddingVertical: 20, paddingHorizontal: spacing.md, marginHorizontal: -spacing.md, marginTop: -spacing.md, marginBottom: spacing.md },
  headerLabel: { fontFamily: fonts.mono, color: '#9CA3AF', fontSize: 11, letterSpacing: 2 },
  headerTitle: { fontFamily: fonts.display, color: colors.white, fontSize: 22, marginTop: 4 },
  form: { backgroundColor: colors.white, borderRadius: 10, padding: spacing.md, borderWidth: 1.5, borderColor: '#D9D3C4', marginBottom: spacing.lg },
  label: { fontFamily: fonts.mono, fontSize: 11, color: colors.ash, letterSpacing: 1, marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1.5, borderColor: '#D9D3C4', borderRadius: 8, padding: 12, fontFamily: fonts.mono, fontSize: 14, color: colors.ink, backgroundColor: colors.white },
  addBtn: { backgroundColor: colors.ink, padding: 14, borderRadius: 8, alignItems: 'center', marginTop: spacing.md },
  addBtnText: { color: colors.white, fontFamily: fonts.display, fontSize: 13, letterSpacing: 1 },
  sectionTitle: { fontFamily: fonts.displayMedium, fontSize: 13, color: colors.ink, letterSpacing: 0.5, marginBottom: 12 },
  goalCard: { backgroundColor: colors.white, borderRadius: 10, padding: 14, marginBottom: 12, borderWidth: 1.5, borderColor: '#D9D3C4', borderStyle: 'dashed' },
  goalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  goalName: { fontFamily: fonts.displayMedium, fontSize: 15, color: colors.ink },
  deleteText: { color: colors.ash, fontSize: 14, fontWeight: '600' },
  track: { height: 10, backgroundColor: '#EDE8DD', borderRadius: 5, overflow: 'hidden', marginBottom: 8 },
  fill: { height: '100%', borderRadius: 5 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  goalAmount: { fontFamily: fonts.monoBold, fontSize: 12, color: colors.ink },
  goalDate: { fontFamily: fonts.mono, fontSize: 10, color: colors.ash, letterSpacing: 0.5 },
  completeText: { fontFamily: fonts.displayMedium, fontSize: 12, color: colors.stampGreen, textAlign: 'center', marginTop: 4 },
  contribRow: { flexDirection: 'row', gap: 8 },
  contribInput: { flex: 1, borderWidth: 1.5, borderColor: '#D9D3C4', borderRadius: 8, padding: 10, fontFamily: fonts.mono, fontSize: 13, color: colors.ink },
  contribBtn: { backgroundColor: colors.kangaGold, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  contribBtnText: { color: colors.white, fontFamily: fonts.displayMedium, fontSize: 12, letterSpacing: 0.5 },
});