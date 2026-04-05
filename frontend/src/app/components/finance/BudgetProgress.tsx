import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingDown, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useReactiveData } from '../../hooks/useReactiveData';

export function BudgetProgress() {
  const { transactions, categories, period } = useApp();
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // ========== CORREÇÃO PROBLEMA 1 ==========
  useReactiveData(() => {
    setForceUpdate(v => v + 1);
  }, [transactions]);
  // ==========================================

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const budgets = useMemo(() => {
    return transactions.filter(t =>
      t.type === 'previsto' &&
      t.month === period.month &&
      t.year === period.year &&
      t.description.toLowerCase().includes('orçamento')
    );
  }, [transactions, period, forceUpdate]);

  // ========== CORREÇÃO PROBLEMA 2 ==========
  // Usar linkedPreviewId em vez de linkedBudgetId
  const budgetsWithProgress = useMemo(() => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.linkedPreviewId === budget.id && t.type === 'saida')
        .reduce((sum, t) => sum + t.value, 0);

      const remaining = budget.value - spent;
      const percentage = (spent / budget.value) * 100;
      const category = categories.find(c => c.id === budget.category);

      return {
        ...budget,
        spent,
        remaining,
        percentage,
        category,
      };
    });
  }, [budgets, transactions, categories, forceUpdate]);
  // ==========================================

  const activeBudgets = useMemo(() => {
    return budgetsWithProgress.filter(b => b.spent > 0);
  }, [budgetsWithProgress, forceUpdate]);

  if (activeBudgets.length === 0) return null;

  return (
    <motion.div
      className="px-5 pb-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#E6EDF3' }}>
          📊 Orçamentos
        </h3>
        <span style={{ fontSize: '11px', color: '#7D8590' }}>
          {activeBudgets.length} em andamento
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {activeBudgets.map((budget, index) => {
          const isOverBudget = budget.percentage > 100;
          const isWarning = budget.percentage > 80;
          
          return (
            <motion.div
              key={budget.id}
              className="bg-[#161B22] rounded-2xl border overflow-hidden"
              style={{ borderColor: isOverBudget ? '#FF4757' : '#21262D' }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {budget.category && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${budget.category.color}20` }}
                    >
                      <span style={{ fontSize: '14px' }}>{budget.category.icon}</span>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
                      {budget.category?.label}
                    </p>
                    <p style={{ fontSize: '10px', color: '#7D8590' }}>
                      {budget.description}
                    </p>
                  </div>
                </div>

                {(isOverBudget || isWarning) && (
                  <div className="flex items-center gap-1">
                    {isOverBudget && (
                      <AlertTriangle size={14} color="#FF4757" />
                    )}
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isOverBudget ? '#FF4757' : '#FFA502',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {isOverBudget ? 'Excedido' : 'Atenção'}
                    </span>
                  </div>
                )}
              </div>

              <div className="px-4 pb-3">
                <div className="w-full h-2 bg-[#0D1117] rounded-full overflow-hidden mb-2">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background: isOverBudget
                        ? '#FF4757'
                        : budget.percentage > 90
                        ? '#FFA502'
                        : budget.percentage > 70
                        ? '#FFA502'
                        : '#00D97E',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 + 0.2 }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* [BP-01] FIX: cor dinâmica — era sempre vermelho; agora verde/laranja/vermelho conforme uso */}
                    <span style={{ fontSize: '14px', fontWeight: 700, color: isOverBudget ? '#FF4757' : isWarning ? '#FFA502' : '#00D97E' }}>
                      {formatCurrency(budget.spent)}
                    </span>
                    <span style={{ fontSize: '11px', color: '#7D8590' }}>
                      de {formatCurrency(budget.value)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {!isOverBudget && (
                      <>
                        <TrendingDown size={11} color="#00D97E" />
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#00D97E' }}>
                          {formatCurrency(budget.remaining)} restante
                        </span>
                      </>
                    )}
                    {isOverBudget && (
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#FF4757' }}>
                        +{formatCurrency(Math.abs(budget.remaining))} acima
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end mt-1.5">
                  <div
                    className="px-2 py-0.5 rounded-md"
                    style={{
                      background: isOverBudget ? '#FF475715' : '#FFA50215',
                      border: `1px solid ${isOverBudget ? '#FF475730' : '#FFA50230'}`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: isOverBudget ? '#FF4757' : '#FFA502',
                      }}
                    >
                      {budget.percentage.toFixed(0)}% utilizado
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}