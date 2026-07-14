export type TransactionType = 'income' | 'expense';

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: number;
  type: TransactionType;
  amount: number;
  categoryId: number;
  note?: string;
  date: string; // ISO string
}

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Salary', type: 'income', color: '#22c55e' },
  { name: 'Business', type: 'income', color: '#16a34a' },
  { name: 'Food', type: 'expense', color: '#ef4444' },
  { name: 'Transport', type: 'expense', color: '#f97316' },
  { name: 'Rent', type: 'expense', color: '#8b5cf6' },
  { name: 'Airtime & Data', type: 'expense', color: '#3b82f6' },
  { name: 'Shopping', type: 'expense', color: '#ec4899' },
  { name: 'Other', type: 'expense', color: '#6b7280' },
];