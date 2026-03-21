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
        .reduce((s, t) => s + t.value, 0);
      const saidas = txs
        .filter(t => ['saida', 'saida_futura'].includes(t.type) && t.status === 'realizado')
        .reduce((s, t) => s + t.value, 0);
      const previsto = txs
        .filter(t => t.status === 'previsto')
        .reduce((s, t) => s + t.value, 0);

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
    const total = txs.reduce((s, t) => s + t.value, 0);

    const map = new Map<string, number>();
    txs.forEach(t => map.set(t.category, (map.get(t.category) || 0) + t.value));

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
        if (!m.has(t.description) || t.value > m.get(t.description)!) {
          m.set(t.description, t.value);
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
}

export const analyticsService = new AnalyticsService();
