import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  seedCategoriesIfEmpty,
  getCategories,
  addTransaction,
  getTransactions,
  getTransactionsByMonth,
  updateTransaction,
  deleteTransaction,
  setBudget,
  getBudgets,
  getMonthlyTotals,
  addRecurringRule,
  generateDueRecurringTransactions,
  getRecurringRules,
} from './storage';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('categories', () => {
  it('seeds default categories only when empty', async () => {
    await seedCategoriesIfEmpty();
    const first = await getCategories();
    expect(first.length).toBeGreaterThan(0);

    await seedCategoriesIfEmpty(); // calling again should not duplicate
    const second = await getCategories();
    expect(second.length).toBe(first.length);
  });
});

describe('transactions CRUD', () => {
  it('adds and retrieves a transaction with an auto-incrementing id', async () => {
    await addTransaction({ type: 'expense', amount: 500, categoryId: 1, note: 'lunch', date: '2026-07-15T00:00:00.000Z' });
    await addTransaction({ type: 'income', amount: 2000, categoryId: 2, note: '', date: '2026-07-16T00:00:00.000Z' });

    const all = await getTransactions();
    expect(all).toHaveLength(2);
    expect(all[0].id).not.toBe(all[1].id);
  });

  it('sorts transactions newest-first', async () => {
    await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: '', date: '2026-07-01T00:00:00.000Z' });
    await addTransaction({ type: 'expense', amount: 200, categoryId: 1, note: '', date: '2026-07-20T00:00:00.000Z' });

    const all = await getTransactions();
    expect(all[0].amount).toBe(200); // most recent date first
  });

  it('updates a transaction in place, preserving its id', async () => {
    await addTransaction({ type: 'expense', amount: 500, categoryId: 1, note: 'lunch', date: '2026-07-15T00:00:00.000Z' });
    const [tx] = await getTransactions();

    await updateTransaction(tx.id, { type: 'expense', amount: 750, categoryId: 1, note: 'lunch (corrected)', date: tx.date });

    const [updated] = await getTransactions();
    expect(updated.id).toBe(tx.id);
    expect(updated.amount).toBe(750);
    expect(updated.note).toBe('lunch (corrected)');
  });

  it('deletes a transaction', async () => {
    await addTransaction({ type: 'expense', amount: 500, categoryId: 1, note: '', date: '2026-07-15T00:00:00.000Z' });
    const [tx] = await getTransactions();

    await deleteTransaction(tx.id);
    expect(await getTransactions()).toHaveLength(0);
  });
});

describe('getTransactionsByMonth', () => {
  it('only returns transactions within the given year/month', async () => {
    await addTransaction({ type: 'expense', amount: 100, categoryId: 1, note: 'june', date: '2026-06-30T00:00:00.000Z' });
    await addTransaction({ type: 'expense', amount: 200, categoryId: 1, note: 'july', date: '2026-07-01T00:00:00.000Z' });
    await addTransaction({ type: 'expense', amount: 300, categoryId: 1, note: 'july late', date: '2026-07-31T00:00:00.000Z' });
    await addTransaction({ type: 'expense', amount: 400, categoryId: 1, note: 'august', date: '2026-08-01T00:00:00.000Z' });

    const julyOnly = await getTransactionsByMonth(2026, 7);
    expect(julyOnly).toHaveLength(2);
    expect(julyOnly.map((t) => t.note).sort()).toEqual(['july', 'july late']);
  });
});

describe('budgets', () => {
  it('sets a new budget and updates an existing one for the same category', async () => {
    await setBudget(1, 5000);
    expect(await getBudgets()).toEqual([{ categoryId: 1, monthlyLimit: 5000 }]);

    await setBudget(1, 7500); // same category — should update, not duplicate
    expect(await getBudgets()).toEqual([{ categoryId: 1, monthlyLimit: 7500 }]);
  });
});

describe('getMonthlyTotals', () => {
  it('always returns exactly monthsBack entries, even with no data', async () => {
    const totals = await getMonthlyTotals(6);
    expect(totals).toHaveLength(6);
    expect(totals.every((t) => t.income === 0 && t.expense === 0)).toBe(true);
  });

  it('aggregates income and expense correctly per month', async () => {
    const now = new Date();
    const thisMonthIso = new Date(now.getFullYear(), now.getMonth(), 10).toISOString();

    await addTransaction({ type: 'income', amount: 3000, categoryId: 1, note: '', date: thisMonthIso });
    await addTransaction({ type: 'expense', amount: 1200, categoryId: 2, note: '', date: thisMonthIso });

    const totals = await getMonthlyTotals(1);
    expect(totals).toHaveLength(1);
    expect(totals[0].income).toBe(3000);
    expect(totals[0].expense).toBe(1200);
  });
});

describe('recurring transactions', () => {
  it('generates nothing when the rule is already up to date', async () => {
    const now = new Date();
    const currentKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await addRecurringRule({
      type: 'expense',
      amount: 1000,
      categoryId: 1,
      note: 'rent',
      dayOfMonth: 1,
      lastGeneratedMonth: currentKey,
    });

    const count = await generateDueRecurringTransactions();
    expect(count).toBe(0);
  });

  it('catches up multiple missed months in one pass', async () => {
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    const staleKey = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`;

    await addRecurringRule({
      type: 'expense',
      amount: 1000,
      categoryId: 1,
      note: 'rent',
      dayOfMonth: 1,
      lastGeneratedMonth: staleKey,
    });

    const count = await generateDueRecurringTransactions();
    expect(count).toBe(4); // 4 months missed, all backfilled

    const rules = await getRecurringRules();
    const now2 = new Date();
    const currentKey = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}`;
    expect(rules[0].lastGeneratedMonth).toBe(currentKey);
  });

  it('clamps day 31 correctly for shorter months', async () => {
    // February rule with dayOfMonth: 31 should land on Feb 28 (or 29), not roll into March.
    await addRecurringRule({
      type: 'expense',
      amount: 500,
      categoryId: 1,
      note: 'month-end thing',
      dayOfMonth: 31,
      lastGeneratedMonth: '2026-01', // will generate Feb onward up to current month
    });

    await generateDueRecurringTransactions();
    const all = await getTransactions();
    const febEntry = all.find((t) => t.date.startsWith('2026-02'));

    expect(febEntry).toBeDefined();
    // Should never be March 2 or 3 (what a naive `new Date(2026, 1, 31)` rollover would produce)
    expect(febEntry?.date.startsWith('2026-03')).toBe(false);
  });
});