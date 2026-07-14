import { Transaction, Category } from '../types';

interface ExportParams {
  transactions: Transaction[];
  categories: Category[];
  monthLabel: string;
}

export function buildReportHtml({ transactions, categories, monthLabel }: ExportParams): string {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIncome - totalExpense;

  const rows = transactions
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((t) => {
      const cat = categoryMap[t.categoryId];
      const sign = t.type === 'income' ? '+' : '-';
      const color = t.type === 'income' ? '#16a34a' : '#dc2626';
      const dateStr = new Date(t.date).toLocaleDateString();
      return `
        <tr>
          <td>${dateStr}</td>
          <td>${cat?.name ?? 'Uncategorized'}</td>
          <td>${t.note ?? ''}</td>
          <td style="text-align:right; color:${color}; font-weight:600;">
            ${sign} KES ${t.amount.toLocaleString()}
          </td>
        </tr>`;
    })
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 24px; }
          h1 { font-size: 20px; margin-bottom: 4px; }
          .subtitle { color: #666; font-size: 12px; margin-bottom: 20px; }
          .summary { display: flex; gap: 12px; margin-bottom: 24px; }
          .card { flex: 1; border-radius: 8px; padding: 12px; }
          .card.income { background: #dcfce7; }
          .card.expense { background: #fee2e2; }
          .card.net { background: #e0e7ff; }
          .card-label { font-size: 11px; color: #444; }
          .card-value { font-size: 16px; font-weight: 700; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { text-align: left; font-size: 11px; color: #666; border-bottom: 1px solid #ddd; padding: 6px 4px; }
          td { font-size: 12px; padding: 6px 4px; border-bottom: 1px solid #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Expense Report — ${monthLabel}</h1>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>

        <div class="summary">
          <div class="card income">
            <div class="card-label">Total Income</div>
            <div class="card-value">KES ${totalIncome.toLocaleString()}</div>
          </div>
          <div class="card expense">
            <div class="card-label">Total Expenses</div>
            <div class="card-value">KES ${totalExpense.toLocaleString()}</div>
          </div>
          <div class="card net">
            <div class="card-label">Net</div>
            <div class="card-value">KES ${net.toLocaleString()}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Date</th><th>Category</th><th>Note</th><th style="text-align:right;">Amount</th></tr>
          </thead>
          <tbody>
            ${rows || '<tr><td colspan="4" style="text-align:center; color:#999; padding:16px;">No transactions this month</td></tr>'}
          </tbody>
        </table>
      </body>
    </html>
  `;
}