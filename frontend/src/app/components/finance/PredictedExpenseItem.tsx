import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../../types';
import { useApp } from '../../context/AppContext';
import { useReactiveData } from '../../hooks/useReactiveData';

interface Props {
  transaction: Transaction;
  index?: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PredictedExpenseItem({ transaction, index = 0 }: Props) {
  const { transactions, categories } = useApp();
  const [forceUpdate, setForceUpdate] = React.useState(0);

  // ========== CORREÇÃO PROBLEMA 1 ==========
  useReactiveData(() => {
    setForceUpdate(v => v + 1);
  }, [transactions]);
  // ==========================================

  // ========== CORREÇÃO PROBLEMA 2 ==========
  // Usar linkedPreviewId em vez de linkedBudgetId
  const spent = useMemo(() => {
    return transactions
      .filter(t => t.linkedPreviewId === transaction.id && t.type === 'saida')
      .reduce((sum, t) => sum + t.value, 0);
  }, [transactions, transaction.id, forceUpdate]);
  // ==========================================

  const remaining = useMemo(() => transaction.value - spent, [transaction.value, spent]);
  const percentage = useMemo(() => (spent / transaction.value) * 100, [spent, transaction.value]);
  const hasSpent = spent > 0;

  const category = useMemo(() => 
    categories.find(c => c.id === transaction.category),
    [categories, transaction.category]
  );

  // [PRED-01] FIX: usar verde para gasto baixo (< 70%) — antes retornava laranja
  // em todos os casos abaixo de 90%, dando falsa impressão de alerta.
  const getStatusColor = () => {
    if (percentage >= 90) return '#FF4757'; // vermelho: crítico
    if (percentage >= 70) return '#FFA502'; // laranja: atenção
    return '#00D97E';                       // verde: saudável
  };

  const statusColor = getStatusColor();

  return (
    <motion.div
      className="border-b border-[#21262D] last:border-0 px-4 py-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <div className="flex items-start gap-3">
        {category && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: `${category.color}20` }}
          >
            <span style={{ fontSize: '16px' }}>{category.icon}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-[#E6EDF3] truncate mb-1" style={{ fontSize: '14px', fontWeight: 600 }}>
            {transaction.description}
          </p>

          {hasSpent ? (
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="text-[#7D8590] line-through" 
                style={{ fontSize: '12px', fontWeight: 400 }}
              >
                {formatCurrency(transaction.value)}
              </span>
              
              <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>→</span>
              
              <span 
                className="text-[#E6EDF3]" 
                style={{ fontSize: '13px', fontWeight: 700 }}
              >
                {formatCurrency(remaining)}
              </span>
              
              <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>restante</span>
            </div>
          ) : (
            <p className="text-[#FFA502] mb-2" style={{ fontSize: '13px', fontWeight: 600 }}>
              {formatCurrency(transaction.value)}
            </p>
          )}

          {hasSpent && (
            <>
              <div className="w-full h-1.5 bg-[#21262D] rounded-full overflow-hidden mb-1.5">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: statusColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span style={{ fontSize: '10px', color: '#7D8590' }}>
                  {formatCurrency(spent)} gasto
                </span>
                <span 
                  style={{ 
                    fontSize: '10px', 
                    fontWeight: 600,
                    color: percentage >= 90 ? '#FF4757' : '#7D8590'
                  }}
                >
                  {percentage.toFixed(0)}%
                </span>
              </div>
            </>
          )}

          {!hasSpent && (
            <p className="text-[#484F58]" style={{ fontSize: '11px' }}>
              Nenhum gasto vinculado ainda
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}