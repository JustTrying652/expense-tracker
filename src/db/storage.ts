import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, Category, DEFAULT_CATEGORIES } from '../types';

const CATEGORIES_KEY = 'categories';
const TRANSACTIONS_KEY = 'transactions';

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