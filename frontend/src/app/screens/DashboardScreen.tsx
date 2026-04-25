import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChevronRight, ChevronLeft, TrendingUp, AlertTriangle, Settings2, CreditCard as CardIcon } from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { Header } from '../components/layout/Header';
import { ResponsiveDashboard } from '../components/layout/ResponsiveDashboard';
import { QuickTemplatesGrid } from '../components/finance/QuickTemplatesGrid';
import { SummaryCard } from '../components/finance/SummaryCard';
import { TransactionItem } from '../components/finance/TransactionItem';
import { PredictedExpenseItem } from '../components/finance/PredictedExpenseItem';
import { useApp } from '../context/AppContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { analyticsApi } from '../services/analytics.api';
import { CreditCard, MonthlyData } from '../types';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2">
        <p className="text-[#7D8590] text-xs mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color, fontSize: '12px', fontWeight: 600 }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// ─── Section Wrapper ────────────────────────────────────────────────────
function AnimatedSection({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

// ─── Home Card Carousel ────────────────────────────────────────────────────────

function HomeCardCarousel({ cards, onNavigate }: { cards: CreditCard[]; onNavigate: () => void }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && activeIndex < cards.length - 1) setActiveIndex(i => i + 1);
    if (dx > 40 && activeIndex > 0) setActiveIndex(i => i - 1);
    touchStartX.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="flex flex-col gap-2"
    >
      {/* Slide track */}
      <div className="overflow-hidden">
        <motion.div
          className="flex"
          animate={{ x: `-${activeIndex * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {cards.map((c) => {
            const up = c.limit > 0 ? (c.used / c.limit) * 100 : 0;
            const av = c.limit - c.used;
            const bc = up > 80 ? '#FF4757' : up > 60 ? '#FFA502' : '#00D97E';

            return (
              <motion.div
                key={c.id}
                className="w-full flex-shrink-0 cursor-pointer"
                onClick={onNavigate}
                whileTap={{ scale: 0.97 }}
              >
                {/* Card face */}
                <div
                  className="relative rounded-2xl p-4 overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${c.color}ee 0%, ${c.color}88 100%)`,
                    minHeight: 160,
                  }}
                >
                  {/* Decorative circles */}
                  <div className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-full opacity-20 bg-white" />
                  <div className="absolute bottom-[-30px] left-[10px] w-32 h-32 rounded-full opacity-10 bg-white" />

                  <div className="relative z-10 flex flex-col gap-3 h-full">
                    {/* Top row */}
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white/60 uppercase" style={{ fontSize: '9px', letterSpacing: 1 }}>
                          Cartão {c.type}
                        </p>
                        <p className="text-white" style={{ fontSize: '17px', fontWeight: 700 }}>{c.name}</p>
                      </div>
                      <CardIcon size={20} color="white" opacity={0.5} />
                    </div>

                    {/* Card number */}
                    <p className="text-white/70 tracking-widest" style={{ fontSize: '13px', fontWeight: 300 }}>
                      •••• •••• •••• {c.lastDigits}
                    </p>

                    {/* Limit block */}
                    <div>
                      <div className="flex items-end justify-between mb-2">
                        <div>
                          <p className="text-white/60" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Disponível
                          </p>
                          <p className="text-white" style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1.1 }}>
                            {formatCurrency(av)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-white/60" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            Utilizado
                          </p>
                          <p className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>
                            {formatCurrency(c.used)}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full rounded-full"
                          style={{ background: bc, boxShadow: `0 0 6px ${bc}80` }}
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.min(up, 100)}%` }}
                          transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                        />
                      </div>

                      {/* Limit row */}
                      <div className="flex justify-between mt-1">
                        <span className="text-white/50" style={{ fontSize: '9px' }}>
                          Limite: {formatCurrency(c.limit)}
                        </span>
                        <span style={{ fontSize: '9px', color: bc, fontWeight: 700 }}>
                          {up.toFixed(0)}% usado
                        </span>
                      </div>
                    </div>

                    {/* Bottom row: dates */}
                    <div className="flex gap-4">
                      <span className="text-white/50" style={{ fontSize: '9px' }}>
                        Fecha dia {c.closingDay}
                      </span>
                      <span className="text-white/50" style={{ fontSize: '9px' }}>
                        Vence dia {c.dueDay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Alert below card */}
                {up > 80 && (
                  <motion.div
                    className="flex items-center gap-1 mt-1.5 px-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <AlertTriangle size={10} color="#FFA502" />
                    <span className="text-[#FFA502]" style={{ fontSize: '10px' }}>Limite quase esgotado</span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Dots + arrows */}
      {cards.length > 1 && (
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            onClick={() => setActiveIndex(i => Math.max(0, i - 1))}
            disabled={activeIndex === 0}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ color: activeIndex === 0 ? '#30363D' : '#7D8590' }}
          >
            <ChevronLeft size={13} />
          </button>

          <div className="flex items-center gap-1.5">
            {cards.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setActiveIndex(i)}
                className="rounded-full"
                animate={{
                  width: i === activeIndex ? 18 : 6,
                  background: i === activeIndex ? '#00D97E' : '#30363D',
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                style={{ height: 6 }}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveIndex(i => Math.min(cards.length - 1, i + 1))}
            disabled={activeIndex === cards.length - 1}
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ color: activeIndex === cards.length - 1 ? '#30363D' : '#7D8590' }}
          >
            <ChevronRight size={13} />
          </button>
        </div>
      )}

      {cards.length > 1 && (
        <p className="text-center text-[#484F58]" style={{ fontSize: '10px' }}>
          {activeIndex + 1} de {cards.length} • arraste para navegar
        </p>
      )}
    </div>
  );
}

// ─── Dashboard Screen ─────────────────────────────────────────────────────────

// ── AI Insights Widget ────────────────────────────────────────────────────────
function AIInsightsWidget({ month, year }: { month: number; year: number }) {
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  // [D-04] FIX: dismissed por período, não por sessão inteira
  const [dismissed, setDismissed] = useState(false);
  const [lastDismissedKey, setLastDismissedKey] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // [D-04] FIX: resetar dismissed ao trocar mês/ano; mostrar em meses passados sem restrição de dia
    const today = new Date();
    const isCurrentMonth = today.getMonth() + 1 === month && today.getFullYear() === year;
    const tooEarly = isCurrentMonth && today.getDate() < 5;
    if (tooEarly || dismissed) { setVisible(false); return; }
    setVisible(true);

    // Usar cache simples por sessão para não chamar Gemini repetidamente
    const cacheKey = `ai_insights_v2_${month}_${year}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try { setInsights(JSON.parse(cached)); return; } catch {}
    }

    setLoading(true);
    analyticsApi.insights(month, year)
      .then(res => {
        if (res.data?.insights?.length) {
          setInsights(res.data.insights);
          sessionStorage.setItem(cacheKey, JSON.stringify(res.data.insights));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [month, year, dismissed]);

  // [AN-01] FIX: useEffect extraído para o nível raiz — estava ilegalmente aninhado dentro do outro useEffect
  // ao mudar período, resetar dismissed se o período mudou
  useEffect(() => {
    const key = `${month}_${year}`;
    if (key !== lastDismissedKey) {
      setDismissed(false);
    }
  }, [month, year, lastDismissedKey]);

  if (!visible || dismissed) return null;
  if (loading) {
    return (
      <div className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(74,144,217,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(168,85,247,0.15)' }}>
          <span style={{ fontSize: '16px' }}>✨</span>
        </div>
        <div className="flex-1">
          <div className="h-3 w-3/4 bg-[#30363D] rounded animate-pulse mb-2" />
          <div className="h-3 w-1/2 bg-[#30363D] rounded animate-pulse" />
        </div>
      </div>
    );
  }
  if (!insights.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(74,144,217,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(168,85,247,0.15)' }}>
            <span style={{ fontSize: '14px' }}>✨</span>
          </div>
          <span className="text-[#A855F7]" style={{ fontSize: '12px', fontWeight: 600 }}>IA Financeira</span>
        </div>
        <button
          onClick={() => { setDismissed(true); setLastDismissedKey(`${month}_${year}`); }}
          className="text-[#484F58] hover:text-[#7D8590] transition-colors"
          style={{ fontSize: '16px', lineHeight: 1 }}
        >
          ×
        </button>
      </div>

      {/* Bubbles */}
      <div className="flex flex-col gap-2">
        {insights.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.12, duration: 0.35 }}
            className="flex items-start gap-2"
          >
            {/* Avatar bolha */}
            <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(168,85,247,0.2)', fontSize: '11px' }}>
              🤖
            </div>
            {/* Mensagem bolha */}
            <div
              className="rounded-2xl rounded-tl-sm px-3 py-2 flex-1"
              style={{
                background: 'rgba(168,85,247,0.12)',
                border: '1px solid rgba(168,85,247,0.15)',
                fontSize: '12px',
                color: '#C9D1D9',
                lineHeight: 1.45,
              }}
            >
              {msg}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

export function DashboardScreen() {
  const { period, summary: ctxSummary, getFilteredTransactions, cards, setShowManageCards } = useApp();
  const summary = ctxSummary || { entradas: 0, saidas: 0, saldo: 0, previsto: 0 };
  const navigate = useNavigate();
  const deviceType = useDeviceType();

  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  // [D-05] FIX: gráfico "Últimos 6 meses" é fixo a partir de hoje — não depende do período selecionado
  useEffect(() => {
    analyticsApi.monthly(6).then(res => {
      if (res.data) setMonthlyData(res.data);
    }).catch(console.error);
  }, []); // sem dependência de period — só carrega uma vez

  const transactions = getFilteredTransactions(period.month, period.year);
  const recent = transactions.filter(t => t.status === 'realizado').slice(0, 4);
  const previstos = transactions.filter(t => t.status === 'previsto' || t.type === 'previsto');

  const prevMonthNum = period.month === 1 ? 12 : period.month - 1;
  const prevYear = period.month === 1 ? period.year - 1 : period.year;
  // Compute trend from monthlyData (last 2 months)
  // [DASH-02] FIX: retornar undefined (não 0) quando dados insuficientes —
  // SummaryCard usa `trend !== undefined` para decidir se renderiza o indicador,
  // então `0` causaria "↑ +0.0% vs anterior" em branco durante o fetch inicial.
  const saidasTrend = useMemo((): number | undefined => {
    if (monthlyData.length < 2) return undefined;
    const current = monthlyData.find(d => d.monthNum === period.month && d.year === period.year);
    const prev = monthlyData.find(d => d.monthNum === prevMonthNum && d.year === prevYear);
    if (!prev?.saidas || !current) return undefined;
    return ((current.saidas - prev.saidas) / prev.saidas) * 100;
  }, [monthlyData, period.month, period.year, prevMonthNum, prevYear]);

  // Saldo Projetado = Entradas - Saídas realizadas - Previsto restante
  const saldoProjetado = summary.entradas - summary.saidas - summary.previsto;

  // Summary Cards
  const summaryCards = (
    <>
      <SummaryCard title="Entradas do Mês" value={summary.entradas} type="entrada" index={0} />
      <SummaryCard title="Saídas Mês" value={summary.saidas} type="saida" trend={saidasTrend} index={1} />
      <SummaryCard title="Saldo Projetado" value={saldoProjetado} type="saldo" index={2} />
      <SummaryCard title="Previsto" value={summary.previsto} type="previsto" index={3} />
    </>
  );

  // Chart
  const chart = (
    <AnimatedSection delay={0.25}>
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>Evolução Mensal</h3>
            <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>Últimos 6 meses</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#00D97E]" />
              <span className="text-[#7D8590]" style={{ fontSize: '10px' }}>Entradas</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-[#FF4757]" />
              <span className="text-[#7D8590]" style={{ fontSize: '10px' }}>Saídas</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={deviceType === 'desktop' ? 200 : 140}>
          <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorEntradasDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00D97E" stopOpacity={0.3} key="entrada-start" />
                <stop offset="95%" stopColor="#00D97E" stopOpacity={0} key="entrada-end" />
              </linearGradient>
              <linearGradient id="colorSaidasDash" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF4757" stopOpacity={0.3} key="saida-start" />
                <stop offset="95%" stopColor="#FF4757" stopOpacity={0} key="saida-end" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363D" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#7D8590', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#7D8590', fontSize: 9 }} axisLine={false} tickLine={false}
              tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="entradas" 
              name="Entradas" 
              stroke="#00D97E" 
              strokeWidth={2}
              fill="url(#colorEntradasDash)" 
              dot={false} 
            />
            <Area 
              type="monotone" 
              dataKey="saidas" 
              name="Saídas" 
              stroke="#FF4757" 
              strokeWidth={2}
              fill="url(#colorSaidasDash)" 
              dot={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </AnimatedSection>
  );

  // Credit Cards
  const creditCardsWidget = (
    <AnimatedSection delay={0.35}>
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#00D97E]/15 flex items-center justify-center">
              <span style={{ fontSize: '12px' }}>💳</span>
            </div>
            {/* [AN-05] FIX: typo "Meus Cartoes" → "Meus Cartões" */}
            <h3 className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>Meus Cartões</h3>
          </div>
          <button
            onClick={() => setShowManageCards(true)}
            className="flex items-center gap-1 text-[#7D8590] hover:text-[#E6EDF3] transition-colors"
            style={{ fontSize: '12px' }}
          >
            <Settings2 size={13} />
            Gerenciar
          </button>
        </div>

        {cards.length > 0 ? (
          <HomeCardCarousel cards={cards} onNavigate={() => navigate('/cartoes')} />
        ) : (
          <motion.button
            onClick={() => setShowManageCards(true)}
            className="w-full py-6 border border-dashed border-[#30363D] rounded-xl text-[#7D8590] text-sm"
            whileTap={{ scale: 0.97 }}
            whileHover={{ borderColor: '#00D97E', color: '#00D97E' }}
          >
            + Adicionar cartão
          </motion.button>
        )}
      </div>
    </AnimatedSection>
  );

  // Predicted Expenses
  const predictedExpensesWidget = previstos.length > 0 ? (
    <AnimatedSection delay={0.45}>
      <div className="bg-[#161B22] border border-[#FFA502]/30 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-lg bg-[#FFA502]/15 flex items-center justify-center">
            <span style={{ fontSize: '12px' }}>⏱</span>
          </div>
          <h3 className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>Gastos Previstos</h3>
          <motion.span
            className="ml-auto px-2 py-0.5 rounded-full bg-[#FFA502]/15 text-[#FFA502]"
            style={{ fontSize: '11px' }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.55 }}
          >
            {previstos.length}
          </motion.span>
        </div>
        <div className="flex flex-col">
          <AnimatePresence>
            {previstos.map((tx, i) => (
              <PredictedExpenseItem key={tx.id} transaction={tx} index={i} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </AnimatedSection>
  ) : null;

  // Recent Transactions
  const recentTransactionsWidget = (
    <AnimatedSection delay={0.5}>
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp size={15} color="#00D97E" />
            <h3 className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Transações Recentes
            </h3>
          </div>
          <motion.button
            onClick={() => navigate('/transacoes')}
            className="flex items-center gap-1 text-[#00D97E]"
            style={{ fontSize: '12px' }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ x: 3 }}
          >
            Ver todas
            <ChevronRight size={14} />
          </motion.button>
        </div>

        {recent.length > 0 ? (
          <div>
            <AnimatePresence>
              {recent.map((tx, i) => (
                <TransactionItem key={tx.id} transaction={tx} index={i} />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            className="py-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>
              Nenhuma transação neste período
            </p>
            <p className="text-[#484F58] mt-1" style={{ fontSize: '12px' }}>
              Toque em + para adicionar
            </p>
          </motion.div>
        )}
      </div>
    </AnimatedSection>
  );

  const aiInsightsWidget = (
    <AIInsightsWidget month={period.month} year={period.year} />
  );

  return (
    <div className="flex flex-col">
      <Header title="FinanceControl" subtitle="Controle Financeiro Pessoal" />

      {/* Atalhos rápidos — grid de templates 1-toque com os mais usados */}
      <div className="pt-3 pb-1">
        <QuickTemplatesGrid />
      </div>

      <div className="px-4 md:px-6 lg:px-8 pt-3 pb-4">
        <ResponsiveDashboard
          summaryCards={summaryCards}
          chart={chart}
          creditCards={creditCardsWidget}
          predictedExpenses={predictedExpensesWidget}
          recentTransactions={recentTransactionsWidget}
          aiInsights={aiInsightsWidget}
        />
      </div>
    </div>
  );
}