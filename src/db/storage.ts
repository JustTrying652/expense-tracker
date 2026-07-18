import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, Budget, DEFAULT_CATEGORIES } from '../types';

const CATEGORIES_KEY = 'categories';
const TRANSACTIONS_KEY = 'transactions';
const BUDGETS_KEY = 'budgets';
const ONBOARDING_KEY = 'hasOnboarded';

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

export async function getHasOnboarded(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(ONBOARDING_KEY);
  return raw === 'true';
}

export async function setHasOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
}