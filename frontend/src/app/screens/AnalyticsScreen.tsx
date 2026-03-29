import React, { useState, useMemo, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { Header } from '../components/layout/Header';
import { useApp } from '../context/AppContext';
import { analyticsApi, ProjectionData } from '../services/analytics.api';
import { MonthlyData } from '../types';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2">
        <p className="text-[#7D8590] text-xs mb-1">{label}</p>
        {payload.map((p: any, i: number) => (
          <p key={i} style={{ color: p.color || p.fill, fontSize: '12px', fontWeight: 600 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const PieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2">
        <p style={{ color: payload[0].payload.color, fontSize: '12px', fontWeight: 600 }}>
          {payload[0].name}: {formatCurrency(payload[0].value)}
        </p>
        <p className="text-[#7D8590] text-xs">{payload[0].payload.percentage?.toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

type AnalyticsTab = 'overview' | 'categories' | 'comparison' | 'projection';

const ANALYTICS_TABS: { id: AnalyticsTab; label: string; emoji: string }[] = [
  { id: 'overview', label: 'Visão Geral', emoji: '📊' },
  { id: 'categories', label: 'Categorias', emoji: '🥧' },
  { id: 'comparison', label: 'Prev. vs Real.', emoji: '⚖️' },
  { id: 'projection', label: 'Projeção', emoji: '📈' },
];

export function AnalyticsScreen() {
  const { period, getFilteredTransactions, cards, categories } = useApp();
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [projectionResult, setProjectionResult] = useState<ProjectionData | null>(null);
  useEffect(() => {
    analyticsApi.monthly(6).then(res => { if (res.data) setMonthlyData(res.data); }).catch(console.error);
    analyticsApi.projection(6).then(res => { if (res.data) setProjectionResult(res.data); }).catch(console.error);
  }, []);
  const projectionData = projectionResult?.projection || [];

  const transactions = getFilteredTransactions(period.month, period.year);

  const categoryData = useMemo(() => {
    const expenses = transactions.filter(t => t.type !== 'entrada' && t.status === 'realizado');
    const total = expenses.reduce((s, t) => s + t.value, 0);
    return categories.map(cat => {
      const catTotal = expenses.filter(t => t.category === cat.id).reduce((s, t) => s + t.value, 0);
      return {
        name: cat.label,
        value: catTotal,
        color: cat.color,
        icon: cat.icon,
        percentage: total > 0 ? (catTotal / total) * 100 : 0,
      };
    }).filter(c => c.value > 0).sort((a, b) => b.value - a.value);
  }, [transactions]);

  const comparisonData = useMemo(() => {
    return monthlyData.slice(-4).map(d => ({
      month: d.month,
      realizado: d.saidas,
      previsto: d.previsto,
    }));
  }, []);

  // Card spending for comparison — usa gastos do período atual (não card.used que é saldo total)
  const cardData = useMemo(() => {
    return cards.map(card => {
      const cardMonthlySpending = transactions
        .filter(t =>
          t.cardId === card.id &&
          ['saida', 'saida_futura'].includes(t.type) &&
          t.status === 'realizado'
        )
        .reduce((s, t) => s + t.value, 0);
      return { name: card.name, value: cardMonthlySpending, color: card.color };
    }).filter(c => c.value > 0);
  }, [cards, transactions]);

  const currentMonthData = monthlyData.find(d => d.monthNum === period.month && d.year === period.year);
  const avgSaidas = monthlyData.reduce((s, d) => s + d.saidas, 0) / monthlyData.length;
  const avgEntradas = monthlyData.reduce((s, d) => s + d.entradas, 0) / monthlyData.length;

  return (
    <div className="flex flex-col">
      <Header title="Análises" subtitle="Inteligência financeira" />

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* Analytics Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {ANALYTICS_TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === tab.id ? '#00D97E20' : '#1C2128',
                border: `1px solid ${activeTab === tab.id ? '#00D97E' : '#30363D'}`,
                color: activeTab === tab.id ? '#00D97E' : '#7D8590',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '12px',
              }}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <p className="text-[#7D8590] mb-1" style={{ fontSize: '11px' }}>Tendência de Gastos</p>
                <p className="text-[#FFA502]" style={{ fontSize: '20px', fontWeight: 700 }}>↑ 866.7%</p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '10px' }}>vs mês anterior</p>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <p className="text-[#7D8590] mb-1" style={{ fontSize: '11px' }}>Maior Categoria</p>
                <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {categoryData[0]?.icon} {categoryData[0]?.name || '—'}
                </p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '10px' }}>
                  {categoryData[0] ? formatCurrency(categoryData[0].value) : 'Sem dados'}
                </p>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <p className="text-[#7D8590] mb-1" style={{ fontSize: '11px' }}>Média Mensal (Entradas)</p>
                <p className="text-[#00D97E]" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {formatCurrency(avgEntradas)}
                </p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '10px' }}>Últimos 6 meses</p>
              </div>
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <p className="text-[#7D8590] mb-1" style={{ fontSize: '11px' }}>Média Mensal (Saídas)</p>
                <p className="text-[#FF4757]" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {formatCurrency(avgSaidas)}
                </p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '10px' }}>Últimos 6 meses</p>
              </div>
            </div>

            {/* Monthly Evolution Bar Chart */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
              <h3 className="text-[#E6EDF3] mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
                Evolução Mensal
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7D8590', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="entradas" name="Entradas" fill="#00D97E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="saidas" name="Saídas" fill="#FF4757" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Gastos por cartão */}
            {cardData.length > 0 && (
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <h3 className="text-[#E6EDF3] mb-3" style={{ fontSize: '14px', fontWeight: 600 }}>
                  Gastos por Cartão
                </h3>
                {cardData.map((c, i) => (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                        <span className="text-[#E6EDF3]" style={{ fontSize: '13px' }}>{c.name}</span>
                      </div>
                      <span className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {formatCurrency(c.value)}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#1C2128] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${Math.min((c.value / 500) * 100, 100)}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <>
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
              <h3 className="text-[#E6EDF3] mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
                Gastos por Categoria
              </h3>
              {categoryData.length > 0 ? (
                <>
                  <div className="flex justify-center mb-4">
                    <ResponsiveContainer width={200} height={200}>
                      <PieChart>
                        <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90}
                          dataKey="value" paddingAngle={3}>
                          {categoryData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<PieTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-3">
                    {categoryData.map((cat, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                            <span className="text-[#E6EDF3]" style={{ fontSize: '13px' }}>{cat.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>
                              {formatCurrency(cat.value)}
                            </span>
                            <span className="text-[#7D8590] ml-2" style={{ fontSize: '11px' }}>
                              ({cat.percentage.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        <div className="h-1.5 bg-[#1C2128] rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${cat.percentage}%`, background: cat.color }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>Nenhuma saída registrada neste período</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Comparison Tab */}
        {activeTab === 'comparison' && (
          <>
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
              <h3 className="text-[#E6EDF3] mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                Previsto vs Realizado
              </h3>
              <p className="text-[#7D8590] mb-4" style={{ fontSize: '11px' }}>Últimos 4 meses</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={comparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7D8590', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="previsto" name="Previsto" fill="#FFA502" radius={[4, 4, 0, 0]} opacity={0.7} />
                  <Bar dataKey="realizado" name="Realizado" fill="#FF4757" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#FFA502] opacity-70" />
                  <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>Previsto</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-[#FF4757]" />
                  <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>Realizado</span>
                </div>
              </div>
            </div>

            {/* Saldo comparison */}
            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
              <h3 className="text-[#E6EDF3] mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
                Evolução do Saldo
              </h3>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4A90D9" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4A90D9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7D8590', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="saldo" name="Saldo" stroke="#4A90D9" strokeWidth={2.5}
                    fill="url(#colorSaldo)" dot={{ fill: '#4A90D9', r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Projection Tab */}
        {activeTab === 'projection' && (
          <>
            <div className="bg-[#161B22] border border-[#30363D]/30 rounded-2xl p-4 border-l-4" style={{ borderLeftColor: '#00D97E' }}>
              <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>Baseado nas suas contas recorrentes</p>
              <p className="text-[#E6EDF3] mt-1" style={{ fontSize: '13px' }}>
                Sobra Mensal Prevista: <span className="text-[#00D97E] font-bold">{formatCurrency(projectionResult?.monthlySavings || 0)}</span>
              </p>
            </div>

            <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
              <h3 className="text-[#E6EDF3] mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
                Projeção Futura
              </h3>
              <p className="text-[#7D8590] mb-4" style={{ fontSize: '11px' }}>Acúmulo patrimonial estimado</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={projectionData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D97E" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00D97E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#7D8590', fontSize: 9 }} axisLine={false} tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="value" name="Projeção" stroke="#00D97E" strokeWidth={2.5}
                    fill="url(#colorProjection)" dot={{ fill: '#00D97E', r: 4, strokeWidth: 2, stroke: '#0D1117' }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly projection cards */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {projectionData.slice(0, 4).map((d, i) => (
                <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-3">
                  <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>{d.month}</p>
                  <p className="text-[#00D97E]" style={{ fontSize: '16px', fontWeight: 700 }}>
                    {formatCurrency(d.value)}
                  </p>
                  <p className="text-[#484F58]" style={{ fontSize: '10px' }}>Projetado</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}