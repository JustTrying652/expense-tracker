import { Transaction, Category, Budget, SavingsGoal, SavingsContribution } from '../types';
import { MonthlyTotal } from '../db/storage';

export interface Insight {
  emoji: string;
  type: 'warning' | 'positive' | 'neutral';
  text: string;
}

interface InsightParams {
  currentTx: Transaction[];
  prevTx: Transaction[];
  categories: Category[];
  budgets: Budget[];
  monthlyTotals: MonthlyTotal[]; // oldest to newest, includes current month
  goals: SavingsGoal[];
  contributions: SavingsContribution[];
}

function sumByType(txs: Transaction[], type: Transaction['type']): number {
  return txs.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
}

function expenseByCategory(txs: Transaction[]): Record<number, number> {
  const map: Record<number, number> = {};
  txs.filter((t) => t.type === 'expense').forEach((t) => {
    map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
  });
  return map;
}

export function generateInsights(params: InsightParams): Insight[] {
  const { currentTx, prevTx, categories, budgets, monthlyTotals, goals, contributions } = params;
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const insights: Insight[] = [];

  const income = sumByType(currentTx, 'income');
  const expense = sumByType(currentTx, 'expense');
  const net = income - expense;

  // --- Net position this month ---
  if (income > 0 && net < 0) {
    insights.push({
      emoji: '⚠️',
      type: 'warning',
      text: `You've spent KES ${Math.abs(net).toLocaleString()} more than you've earned this month.`,
    });
  } else if (income > 0 && net / income >= 0.2) {
    const pct = Math.round((net / income) * 100);
    insights.push({
      emoji: '✅',
      type: 'positive',
      text: `You've saved ${pct}% of your income this month — keep it up.`,
    });
  }

  // --- Top spending category ---
  const currentByCategory = expenseByCategory(currentTx);
  const topEntry = Object.entries(currentByCategory).sort((a, b) => b[1] - a[1])[0];
  if (topEntry && expense > 0) {
    const [catId, amount] = topEntry;
    const cat = categoryMap[Number(catId)];
    const pct = Math.round((amount / expense) * 100);
    insights.push({
      emoji: '📌',
      type: 'neutral',
      text: `${cat?.name ?? 'Uncategorized'} is your biggest expense this month — KES ${amount.toLocaleString()} (${pct}% of total spending).`,
    });
  }

  // --- Budget alerts (worst offender first, cap at 2 to stay concise) ---
  const budgetAlerts = budgets
    .map((b) => {
      const spent = currentByCategory[b.categoryId] ?? 0;
      return { ...b, spent, pct: spent / b.monthlyLimit };
    })
    .filter((b) => b.pct >= 0.8)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2);

  budgetAlerts.forEach((b) => {
    const cat = categoryMap[b.categoryId];
    if (b.pct >= 1) {
      const over = b.spent - b.monthlyLimit;
      insights.push({
        emoji: '🚨',
        type: 'warning',
        text: `${cat?.name ?? 'This category'} is over budget by KES ${over.toLocaleString()}.`,
      });
    } else {
      insights.push({
        emoji: '⏳',
        type: 'warning',
        text: `${cat?.name ?? 'This category'} is at ${Math.round(b.pct * 100)}% of its budget.`,
      });
    }
  });

  // --- Biggest category mover vs last month ---
  const prevByCategory = expenseByCategory(prevTx);
  const movers = Object.keys(currentByCategory)
    .map((catId) => {
      const id = Number(catId);
      const current = currentByCategory[id];
      const previous = prevByCategory[id] ?? 0;
      if (previous === 0) return null;
      const pctChange = ((current - previous) / previous) * 100;
      return { id, current, previous, pctChange };
    })
    .filter((m): m is { id: number; current: number; previous: number; pctChange: number } => m !== null && Math.abs(m.pctChange) >= 25)
    .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));

  if (movers.length > 0) {
    const m = movers[0];
    const cat = categoryMap[m.id];
    const rounded = Math.round(Math.abs(m.pctChange));
    if (m.pctChange > 0) {
      insights.push({
        emoji: '📈',
        type: 'warning',
        text: `${cat?.name ?? 'This category'} spending jumped ${rounded}% compared to last month.`,
      });
    } else {
      insights.push({
        emoji: '📉',
        type: 'positive',
        text: `${cat?.name ?? 'This category'} spending dropped ${rounded}% compared to last month — nice work.`,
      });
    }
  }

  // --- Consecutive rising expenses (last 3 months, oldest to newest) ---
  if (monthlyTotals.length >= 3) {
    const lastThree = monthlyTotals.slice(-3);
    const rising = lastThree[0].expense < lastThree[1].expense && lastThree[1].expense < lastThree[2].expense;
    if (rising && lastThree[0].expense > 0) {
      insights.push({
        emoji: '📊',
        type: 'warning',
        text: `Your expenses have increased for 3 months in a row.`,
      });
    }
  }

  // --- Savings goal progress ---
  goals.forEach((g) => {
    const saved = contributions.filter((c) => c.goalId === g.id).reduce((s, c) => s + c.amount, 0);
    const pct = saved / g.targetAmount;

    if (pct >= 0.9 && pct < 1) {
      insights.push({
        emoji: '🎯',
        type: 'positive',
        text: `You're ${Math.round(pct * 100)}% of the way to your "${g.name}" goal — almost there.`,
      });
    } else if (g.targetDate) {
      const daysLeft = Math.ceil((new Date(g.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysLeft > 0 && daysLeft <= 30 && pct < 0.8) {
        insights.push({
          emoji: '⏰',
          type: 'warning',
          text: `"${g.name}" is due in ${daysLeft} days but only ${Math.round(pct * 100)}% funded.`,
        });
      }
    }
  });

  // Warnings first, then positive, then neutral — cap at 5 so it stays scannable
  const priority = { warning: 0, positive: 1, neutral: 2 };
  return insights.sort((a, b) => priority[a.type] - priority[b.type]).slice(0, 5);
}