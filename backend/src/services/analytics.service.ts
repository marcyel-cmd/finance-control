import { prisma } from '../lib/prisma';

const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export class AnalyticsService {

  async monthly(userId: string, months = 6) {
    const now = new Date();
    const result = [];

    for (let i = months - 1; i >= 0; i--) {
      let m = now.getMonth() + 1 - i;
      let y = now.getFullYear();
      while (m <= 0) { m += 12; y -= 1; }

      const txs = await prisma.transaction.findMany({ where: { userId, month: m, year: y } });

      const entradas = txs
        .filter(t => t.type === 'entrada' && t.status === 'realizado')
        .reduce((s, t) => s + Number(t.value), 0);
      const saidas = txs
        .filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
        .reduce((s, t) => s + Number(t.value), 0);
      const previsto = txs
        .filter(t => t.status === 'previsto')
        .reduce((s, t) => s + Number(t.value), 0);

      result.push({
        month: MONTH_SHORT[m - 1], monthNum: m, year: y,
        entradas, saidas, saldo: entradas - saidas, previsto,
      });
    }

    return result;
  }

  async categories(userId: string, month: number, year: number) {
    const txs = await prisma.transaction.findMany({
      where: { userId, month, year, type: { in: ['saida', 'saida_futura'] }, status: 'realizado' },
    });
    const cats  = await prisma.category.findMany();
    const total = txs.reduce((s, t) => s + Number(t.value), 0);

    const map = new Map<string, number>();
    txs.forEach(t => map.set(t.category, (map.get(t.category) || 0) + Number(t.value)));

    const result = cats
      .map(c => ({
        category: c.id, label: c.label, icon: c.icon, color: c.color,
        value: map.get(c.id) || 0,
        percentage: total > 0 ? ((map.get(c.id) || 0) / total) * 100 : 0,
      }))
      .filter(c => c.value > 0)
      .sort((a, b) => b.value - a.value);

    return { categories: result, total };
  }

  async projection(userId: string, months = 6) {
    const income = await prisma.transaction.findMany({
      where: { userId, type: 'entrada', recurring: true, status: 'realizado' },
    });
    const expense = await prisma.transaction.findMany({
      where: { userId, type: { in: ['saida', 'saida_futura'] }, recurring: true, status: 'realizado' },
    });

    const byDesc = (arr: any[]) => {
      const m = new Map<string, number>();
      arr.forEach(t => {
        const v = Number(t.value);
        if (!m.has(t.description) || v > m.get(t.description)!) {
          m.set(t.description, v);
        }
      });
      return Array.from(m.values()).reduce((s, v) => s + v, 0);
    };

    const monthlyIncome  = byDesc(income);
    const monthlyExpense = byDesc(expense);
    const monthlySavings = monthlyIncome - monthlyExpense;

    const now = new Date();
    let m = now.getMonth() + 2;
    let y = now.getFullYear();
    if (m > 12) { m -= 12; y += 1; }

    let accumulated = 0;
    const projection = [];
    for (let i = 0; i < months; i++) {
      let pm = m + i, py = y;
      while (pm > 12) { pm -= 12; py += 1; }
      accumulated += monthlySavings;
      projection.push({
        month: MONTH_SHORT[pm - 1], monthNum: pm, year: py,
        value: Math.max(0, accumulated),
      });
    }

    return { monthlyIncome, monthlyExpense, monthlySavings, projection };
  }

  async comparison(userId: string, months = 4) {
    const data = await this.monthly(userId, months);
    return data.map(d => ({
      month: d.month, monthNum: d.monthNum, year: d.year,
      realizado: d.saidas, previsto: d.previsto,
    }));
  }

  // ── Insights financeiros com IA (token-otimizado) ─────────────────────────
  async insights(userId: string, month: number, year: number, userName: string) {
    // Resumo do mês atual
    const txs = await prisma.transaction.findMany({ where: { userId, month, year } });
    const entradas = txs
      .filter(t => t.type === 'entrada' && t.status === 'realizado')
      .reduce((s, t) => s + Number(t.value), 0);
    const saidas = txs
      .filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
      .reduce((s, t) => s + Number(t.value), 0);
    const previsto = txs
      .filter(t => t.status === 'previsto' || t.type === 'previsto')
      .reduce((s, t) => s + Number(t.value), 0);

    // Top 3 categorias de gastos com labels legíveis
    const userCategories = await prisma.category.findMany();
    const catLabelMap = new Map(userCategories.map(c => [c.id, c.label]));

    const catMap = new Map<string, number>();
    txs.filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
      .forEach(t => catMap.set(t.category, (catMap.get(t.category) || 0) + Number(t.value)));

    const sortedCats = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1]);
    const topCats = sortedCats.slice(0, 3)
      .map(([cat, val]) => {
        const label = catLabelMap.get(cat) || cat;
        const pct = saidas > 0 ? ((val / saidas) * 100).toFixed(0) : '0';
        return `${label} R$${val.toFixed(2)} (${pct}%)`;
      }).join(', ');

    const topExpense = sortedCats.length > 0
      ? `${catLabelMap.get(sortedCats[0][0]) || sortedCats[0][0]} R$${sortedCats[0][1].toFixed(2)}`
      : 'sem dados';

    // Variação vs mês anterior
    let pm = month - 1, py = year;
    if (pm <= 0) { pm = 12; py -= 1; }
    const prevTxs = await prisma.transaction.findMany({ where: { userId, month: pm, year: py } });
    const prevSaidas = prevTxs
      .filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
      .reduce((s, t) => s + Number(t.value), 0);
    const saidaChange = prevSaidas > 0
      ? `${saidas >= prevSaidas ? '+' : ''}${((saidas - prevSaidas) / prevSaidas * 100).toFixed(0)}%`
      : 'sem dados';

    const { generateFinancialInsights } = await import('../lib/gemini');
    const insights = await generateFinancialInsights(userName, {
      month: `${MONTH_SHORT[month - 1]}/${year}`,
      entradas, saidas, previsto,
      topCategories: topCats || 'sem dados',
      saidaChange,
      topExpense,
    });

    return { insights, generatedAt: new Date().toISOString() };
  }
}

export const analyticsService = new AnalyticsService();
