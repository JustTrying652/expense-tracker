import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget, RecurringRule, SavingsGoal, SavingsContribution, DEFAULT_CATEGORIES } from '../types';

const CATEGORIES_KEY = 'categories';
const TRANSACTIONS_KEY = 'transactions';
const BUDGETS_KEY = 'budgets';
const ONBOARDING_KEY = 'hasOnboarded';
const RECURRING_KEY = 'recurring';
const GOALS_KEY = 'savingsGoals';
const CONTRIBUTIONS_KEY = 'savingsContributions';
const DISMISSED_SUGGESTIONS_KEY = 'dismissedRecurringSuggestions';

async function readJson<T>(key: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function seedCategoriesIfEmpty(): Promise<void> {
  const existing = await readJson<Category[]>(CATEGORIES_KEY, []);
  if (existing.length === 0) {
    const seeded: Category[] = DEFAULT_CATEGORIES.map((c, i) => ({ ...c, id: i + 1 }));
    await writeJson(CATEGORIES_KEY, seeded);
  }
}

export async function getCategories(): Promise<Category[]> {
  return readJson<Category[]>(CATEGORIES_KEY, []);
}

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<void> {
  const all = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  const nextId = all.length > 0 ? Math.max(...all.map((t) => t.id)) + 1 : 1;
  all.push({ ...tx, id: nextId });
  await writeJson(TRANSACTIONS_KEY, all);
}

export async function getTransactions(): Promise<Transaction[]> {
  const all = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  const all = await getTransactions();
  const monthStr = String(month).padStart(2, '0');
  return all.filter((t) => t.date.startsWith(`${year}-${monthStr}`));
}

export async function deleteTransaction(id: number): Promise<void> {
  const all = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  await writeJson(TRANSACTIONS_KEY, all.filter((t) => t.id !== id));
}

export async function getBudgets(): Promise<Budget[]> {
  return readJson<Budget[]>(BUDGETS_KEY, []);
}

export async function setBudget(categoryId: number, monthlyLimit: number): Promise<void> {
  const all = await readJson<Budget[]>(BUDGETS_KEY, []);
  const existingIndex = all.findIndex((b) => b.categoryId === categoryId);
  if (existingIndex >= 0) {
    all[existingIndex].monthlyLimit = monthlyLimit;
  } else {
    all.push({ categoryId, monthlyLimit });
  }
  await writeJson(BUDGETS_KEY, all);
}

export async function deleteBudget(categoryId: number): Promise<void> {
  const all = await readJson<Budget[]>(BUDGETS_KEY, []);
  await writeJson(BUDGETS_KEY, all.filter((b) => b.categoryId !== categoryId));
}

export interface MonthlyTotal {
  year: number;
  month: number; // 1-12
  income: number;
  expense: number;
}

export async function getMonthlyTotals(monthsBack: number): Promise<MonthlyTotal[]> {
  const all = await getTransactions();
  const now = new Date();
  const results: MonthlyTotal[] = [];

  for (let i = monthsBack - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const monthTx = all.filter((t) => t.date.startsWith(`${year}-${monthStr}`));

    results.push({
      year,
      month,
      income: monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    });
  }

  return results;
}

export async function updateTransaction(id: number, updates: Omit<Transaction, 'id'>): Promise<void> {
  const all = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  const index = all.findIndex((t) => t.id === id);
  if (index >= 0) {
    all[index] = { ...updates, id };
    await writeJson(TRANSACTIONS_KEY, all);
  }
}

export async function getTransactionById(id: number): Promise<Transaction | null> {
  const all = await readJson<Transaction[]>(TRANSACTIONS_KEY, []);
  return all.find((t) => t.id === id) ?? null;
}

export async function getHasOnboarded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
  return raw === 'true';
}

export async function setHasOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}

function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate(); // last day of the given 1-12 month
}

export async function getRecurringRules(): Promise<RecurringRule[]> {
  return readJson<RecurringRule[]>(RECURRING_KEY, []);
}

export async function addRecurringRule(rule: Omit<RecurringRule, 'id'>): Promise<void> {
  const all = await readJson<RecurringRule[]>(RECURRING_KEY, []);
  const nextId = all.length > 0 ? Math.max(...all.map((r) => r.id)) + 1 : 1;
  all.push({ ...rule, id: nextId });
  await writeJson(RECURRING_KEY, all);
}
export async function deleteRecurringRule(id: number): Promise<void> {
  const all = await readJson<RecurringRule[]>(RECURRING_KEY, []);
  await writeJson(RECURRING_KEY, all.filter((r) => r.id !== id));
}

/**
 * Generates any transactions that are "due" for each recurring rule,
 * catching up on missed months (capped at 24 to avoid runaway generation).
 * Returns how many transactions were created, so the caller can notify the user.
 */
export async function generateDueRecurringTransactions(): Promise<number> {
  const rules = await getRecurringRules();
  if (rules.length === 0) return 0;

  const now = new Date();
  const currentKey = monthKey(now.getFullYear(), now.getMonth() + 1);
  let generatedCount = 0;
  const updatedRules: RecurringRule[] = [];

  for (const rule of rules) {
    const [lastYearStr, lastMonthStr] = rule.lastGeneratedMonth.split('-');
    let cursorYear = parseInt(lastYearStr, 10);
    let cursorMonth = parseInt(lastMonthStr, 10);
    let newLastGenerated = rule.lastGeneratedMonth;
    let safetyCounter = 0;

    while (safetyCounter < 24) {
      cursorMonth += 1;
      if (cursorMonth > 12) {
        cursorMonth = 1;
        cursorYear += 1;
      }
      const key = monthKey(cursorYear, cursorMonth);
      if (key > currentKey) break; // never generate into the future

      const day = Math.min(rule.dayOfMonth, daysInMonth(cursorYear, cursorMonth));
      const date = new Date(cursorYear, cursorMonth - 1, day).toISOString();

      await addTransaction({
        type: rule.type,
        amount: rule.amount,
        categoryId: rule.categoryId,
        note: rule.note,
        date,
      });

      generatedCount += 1;
      newLastGenerated = key;
      safetyCounter += 1;

      if (key === currentKey) break;
    }

    updatedRules.push({ ...rule, lastGeneratedMonth: newLastGenerated });
  }

  await writeJson(RECURRING_KEY, updatedRules);
  return generatedCount;
}

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  return readJson<SavingsGoal[]>(GOALS_KEY, []);
}

export async function addSavingsGoal(goal: Omit<SavingsGoal, 'id'>): Promise<void> {
  const all = await readJson<SavingsGoal[]>(GOALS_KEY, []);
  const nextId = all.length > 0 ? Math.max(...all.map((g) => g.id)) + 1 : 1;
  all.push({ ...goal, id: nextId });
  await writeJson(GOALS_KEY, all);
}

export async function deleteSavingsGoal(id: number): Promise<void> {
  const goals = await readJson<SavingsGoal[]>(GOALS_KEY, []);
  await writeJson(GOALS_KEY, goals.filter((g) => g.id !== id));

  // Contributions tied to a deleted goal are meaningless orphans — clean them up too.
  const contributions = await readJson<SavingsContribution[]>(CONTRIBUTIONS_KEY, []);
  await writeJson(CONTRIBUTIONS_KEY, contributions.filter((c) => c.goalId !== id));
}

export async function getSavingsContributions(): Promise<SavingsContribution[]> {
  return readJson<SavingsContribution[]>(CONTRIBUTIONS_KEY, []);
}

export async function addSavingsContribution(contribution: Omit<SavingsContribution, 'id'>): Promise<void> {
  const all = await readJson<SavingsContribution[]>(CONTRIBUTIONS_KEY, []);
  const nextId = all.length > 0 ? Math.max(...all.map((c) => c.id)) + 1 : 1;
  all.push({ ...contribution, id: nextId });
  await writeJson(CONTRIBUTIONS_KEY, all);
}