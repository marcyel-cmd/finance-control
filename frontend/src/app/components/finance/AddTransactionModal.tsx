import React, { useState, useMemo, useEffect } from 'react';
import { X, ChevronDown, Check, Calendar, ChevronRight, CreditCard as CreditCardIcon, AlertTriangle, ArrowRight, Receipt } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction, TransactionType, CreditCard } from '../../types';
import { PAYMENT_METHODS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { DatePickerModal } from './DatePickerModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { CategoryPickerModal } from './CategoryPickerModal';

interface Props {
  onClose: () => void;
}

type TabType = 'entrada' | 'saida' | 'previsto';

const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'entrada', label: '↑ Entrada', color: '#00D97E' },
  { id: 'saida', label: '↓ Saída', color: '#FF4757' },
  { id: 'previsto', label: '⏱ Previsto', color: '#FFA502' },
];

export function AddTransactionModal({ onClose }: Props) {
  const { addTransaction, cards, categories, showToast, period, transactions } = useApp();
  const [tab, setTab] = useState<TabType>('saida');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');
  // [ADD-01] FIX: 'alimentacao' pode não existir em contas com categorias personalizadas.
  // Inicializa com 'alimentacao' e, assim que a lista de categorias carregar, faz fallback
  // para a primeira categoria disponível caso 'alimentacao' não exista.
  const [category, setCategory] = useState('alimentacao');
  useEffect(() => {
    if (categories.length > 0 && !categories.find(c => c.id === category)) {
      setCategory(categories[0].id);
    }
  }, [categories]);
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [cardId, setCardId] = useState('');
  // [D-01] FIX: usar data de hoje como padrão, não dia 21 hardcoded
  const todayStr = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  })();
  const [date, setDate] = useState(todayStr);
  const [installment, setInstallment] = useState(false);
  const [installmentCount, setInstallmentCount] = useState(2);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [linkedBudgetId, setLinkedBudgetId] = useState<string>('');
  const [errors, setErrors] = useState<{ description?: string; value?: string; card?: string }>({});

  const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12];
  const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const showCardSelect = paymentMethod === 'credito';
  const showPayment = tab === 'saida';
  const showInstallment = showPayment && showCardSelect && !!cardId;

  // Get predicted expenses (previstos) for current period and category
  const availablePredictedExpenses = useMemo(() => {
    if (tab !== 'saida' || !category) return [];
    
    return transactions.filter(t => 
      t.type === 'previsto' &&
      t.category === category &&
      t.month === period.month &&
      t.year === period.year
    );
  }, [transactions, tab, category, period]);

  // Calculate spent amount for a predicted expense
  const getPredictedExpenseSpent = (predictedExpenseId: string) => {
    return transactions
      .filter(t => t.linkedPreviewId === predictedExpenseId && t.type === 'saida')
      .reduce((sum, t) => sum + t.value, 0);
  };

  const parsedValue = useMemo(() => {
    const num = parseFloat((value || '0').replace(',', '.'));
    return isNaN(num) ? 0 : num;
  }, [value]);

  const totalInstallmentValue = installment ? parsedValue * installmentCount : parsedValue;

  const selectedCard = useMemo(() => cards.find(c => c.id === cardId), [cards, cardId]);
  const selectedCategory = useMemo(() => categories.find(c => c.id === category), [categories, category]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const formatDisplayDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} de ${MONTH_SHORT[m - 1]} de ${y}`;
  };

  // ── Invoice calculation logic ──
  // [C-02] FIX: calcular o mês de vencimento corretamente quando dueDay < closingDay
  const getInvoiceInfo = (card: CreditCard, txDate: string) => {
    const [year, month, day] = txDate.split('-').map(Number);
    let invoiceMonth: number;
    let invoiceYear: number;

    if (day <= card.closingDay) {
      // Transaction is before/on closing day → current month invoice
      invoiceMonth = month;
      invoiceYear = year;
    } else {
      // Transaction is after closing day → next month invoice
      invoiceMonth = month + 1;
      invoiceYear = year;
      if (invoiceMonth > 12) {
        invoiceMonth = 1;
        invoiceYear++;
      }
    }

    // [C-02] FIX: o vencimento pode ser no mês seguinte ao fechamento
    // ex: fecha dia 10, vence dia 5 → fatura de janeiro vence em 5 de FEVEREIRO
    let dueMonth = invoiceMonth;
    let dueYear = invoiceYear;
    if (card.dueDay <= card.closingDay) {
      dueMonth += 1;
      if (dueMonth > 12) { dueMonth = 1; dueYear += 1; }
    }

    const dueDate = `${card.dueDay} de ${MONTH_NAMES[dueMonth - 1]} de ${dueYear}`;
    return { invoiceMonth, invoiceYear, dueDate };
  };

  const getLastInstallmentInfo = (invoiceMonth: number, invoiceYear: number, count: number) => {
    let m = invoiceMonth + (count - 1);
    let y = invoiceYear;
    while (m > 12) { m -= 12; y++; }
    return { month: m, year: y, label: `${MONTH_NAMES[m - 1]} de ${y}` };
  };

  const invoiceInfo = useMemo(() => {
    if (!selectedCard) return null;
    return getInvoiceInfo(selectedCard, date);
  }, [selectedCard, date]);

  const lastInstallment = useMemo(() => {
    if (!invoiceInfo || !installment) return null;
    return getLastInstallmentInfo(invoiceInfo.invoiceMonth, invoiceInfo.invoiceYear, installmentCount);
  }, [invoiceInfo, installment, installmentCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { description?: string; value?: string; card?: string } = {};
    
    if (!description) {
      newErrors.description = 'Descrição é obrigatória';
    }
    if (!value) {
      newErrors.value = 'Valor é obrigatório';
    } else {
      const numValue = parseFloat(value.replace(',', '.'));
      if (isNaN(numValue) || numValue <= 0) {
        newErrors.value = 'Valor deve ser maior que zero';
      }
    }
    if (paymentMethod === 'credito' && !cardId) {
      newErrors.card = 'Selecione um cartão de crédito';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    // If credit card payment, show confirmation first
    if (paymentMethod === 'credito' && cardId && selectedCard) {
      setShowConfirmation(true);
      return;
    }

    doAddTransaction();
  };

  const doAddTransaction = async () => {
    const numValue = parseFloat(value.replace(',', '.'));
    try {
      await addTransaction({
        type: tab,
        description: description.toUpperCase(),
        category,
        value: installment && showInstallment ? parsedValue : numValue,
        date,
        paymentMethod: showPayment ? paymentMethod : 'transferencia',
        cardId: showCardSelect && cardId ? cardId : null,
        status: tab === 'previsto' ? 'previsto' : 'realizado',
        recurring: false,
        linkedPreviewId: linkedBudgetId || null,
        installment: !!(installment && showInstallment),
        installmentTotal: installment && showInstallment ? installmentCount : null,
      });
      showToast({
        type: 'success',
        title: tab === 'entrada' ? 'Entrada registrada' : tab === 'previsto' ? 'Previsão adicionada' : 'Saída registrada',
        message: `${description.toUpperCase()} — ${formatCurrency(parseFloat(value.replace(',', '.')))}`,
        icon: tab === 'entrada' ? '💰' : tab === 'previsto' ? '⏱' : '💸',
      });
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao salvar',
        message: err.message || 'Tente novamente',
        icon: '❌',
      });
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D] overflow-hidden"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 350, damping: 32 }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
            Adicionar Transação
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-3 gap-2 px-5 pb-4">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="py-2.5 rounded-xl text-sm transition-all"
              style={{
                background: tab === t.id ? t.color + '20' : '#1C2128',
                border: `1px solid ${tab === t.id ? t.color : '#30363D'}`,
                color: tab === t.id ? t.color : '#7D8590',
                fontWeight: tab === t.id ? 600 : 400,
                fontSize: '13px',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="px-5 pb-8 flex flex-col gap-4">
          {/* Description */}
          <div>
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Descrição</label>
            <input
              value={description}
              onChange={e => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: undefined });
              }}
              placeholder="Ex: Aluguel, Salário..."
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#00D97E]/50"
              style={{ fontSize: '14px' }}
            />
            {errors.description && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                style={{ background: '#FF475710', border: '1px solid #FF475720' }}
              >
                <AlertTriangle size={14} color="#FF4757" />
                <p style={{ fontSize: '11px', color: '#FF4757', fontWeight: 500 }}>
                  {errors.description}
                </p>
              </motion.div>
            )}
          </div>

          {/* Value */}
          <div>
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>
              {showInstallment && installment ? 'Valor da Parcela (R$)' : 'Valor (R$)'}
            </label>
            <input
              value={value}
              onChange={e => {
                setValue(e.target.value);
                if (errors.value) setErrors({ ...errors, value: undefined });
              }}
              placeholder="0,00"
              inputMode="decimal"
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#00D97E]/50"
              style={{ fontSize: '14px' }}
            />
            {errors.value && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                style={{ background: '#FF475710', border: '1px solid #FF475720' }}
              >
                <AlertTriangle size={14} color="#FF4757" />
                <p style={{ fontSize: '11px', color: '#FF4757', fontWeight: 500 }}>
                  {errors.value}
                </p>
              </motion.div>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Categoria</label>
            <button
              type="button"
              onClick={() => setShowCategoryPicker(true)}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-left flex items-center gap-3 active:border-[#4A90D9]/50 transition-colors"
            >
              {selectedCategory ? (
                <>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: selectedCategory.color + '20' }}
                  >
                    <span style={{ fontSize: '16px' }}>{selectedCategory.icon}</span>
                  </div>
                  <span className="text-[#E6EDF3] flex-1 truncate" style={{ fontSize: '14px' }}>
                    {selectedCategory.label}
                  </span>
                </>
              ) : (
                <span className="text-[#484F58] flex-1" style={{ fontSize: '14px' }}>
                  Selecionar categoria
                </span>
              )}
              <ChevronRight size={16} className="text-[#7D8590] shrink-0" />
            </button>
          </div>

          {showCategoryPicker && (
            <CategoryPickerModal
              categories={categories}
              selected={category}
              onSelect={(id) => setCategory(id)}
              onClose={() => setShowCategoryPicker(false)}
            />
          )}

          {/* Budget Selection (only for saidas with available budgets) */}
          {tab === 'saida' && availablePredictedExpenses.length > 0 && (
            <div>
              <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Vincular a Gasto Previsto</label>
              <div className="flex flex-col gap-2">
                {availablePredictedExpenses.map(budget => {
                  const spent = getPredictedExpenseSpent(budget.id);
                  const remaining = budget.value - spent;
                  const percentage = (spent / budget.value) * 100;
                  const isSelected = linkedBudgetId === budget.id;
                  
                  return (
                    <button
                      key={budget.id}
                      type="button"
                      onClick={() => setLinkedBudgetId(isSelected ? '' : budget.id)}
                      className="rounded-xl p-3.5 text-left transition-all relative overflow-hidden"
                      style={{
                        background: isSelected 
                          ? 'linear-gradient(135deg, #FFA50215, #FFD60A10)'
                          : '#1C2128',
                        border: isSelected ? '1.5px solid #FFA502' : '1px solid #30363D',
                      }}
                    >
                      {/* Checkmark indicator */}
                      {isSelected && (
                        <div 
                          className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                          style={{ background: '#FFA502' }}
                        >
                          <Check size={12} color="#000" strokeWidth={3} />
                        </div>
                      )}
                      
                      {/* Header */}
                      <div className="flex items-start gap-2.5 mb-2.5">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 shrink-0"
                          style={{ 
                            background: isSelected ? '#FFA50225' : '#FFA50215',
                            border: `1px solid ${isSelected ? '#FFA50240' : '#FFA50220'}`,
                          }}
                        >
                          <span style={{ fontSize: '14px' }}>⏱</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#E6EDF3] truncate mb-0.5" style={{ fontSize: '13px', fontWeight: 600 }}>
                            {budget.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <span style={{ fontSize: '12px', color: '#FFA502', fontWeight: 700 }}>
                              {formatCurrency(remaining)}
                            </span>
                            <span style={{ fontSize: '11px', color: '#7D8590' }}>
                              restante
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full overflow-hidden mb-1.5" style={{ background: '#21262D' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${Math.min(percentage, 100)}%`,
                            background: percentage > 90 
                              ? 'linear-gradient(90deg, #FF4757, #FF6B7A)'
                              : percentage > 70 
                              ? 'linear-gradient(90deg, #FFA502, #FFD60A)'
                              : 'linear-gradient(90deg, #00D97E, #4A90D9)',
                          }}
                        />
                      </div>
                      
                      {/* Footer stats */}
                      <div className="flex items-center justify-between">
                        <span style={{ fontSize: '10px', color: '#7D8590' }}>
                          {formatCurrency(spent)} de {formatCurrency(budget.value)}
                        </span>
                        <span 
                          style={{ 
                            fontSize: '10px', 
                            fontWeight: 700,
                            color: percentage > 90 ? '#FF4757' : percentage > 70 ? '#FFA502' : '#00D97E',
                          }}
                        >
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Payment Method */}
          {showPayment && (
            <div>
              <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Método de Pagamento</label>
              <button
                type="button"
                onClick={() => setShowPaymentMethodModal(true)}
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-left flex items-center justify-between active:border-[#00D97E]/50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[#E6EDF3] truncate" style={{ fontSize: '14px' }}>
                    {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || 'Selecionar'}
                  </span>
                  {paymentMethod === 'credito' && selectedCard && (
                    <span className="truncate" style={{ fontSize: '11px', color: selectedCard.color }}>
                      {selectedCard.name} •••• {selectedCard.lastDigits}
                    </span>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#7D8590] shrink-0" />
              </button>
              {errors.card && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg"
                  style={{ background: '#FF475710', border: '1px solid #FF475720' }}
                >
                  <AlertTriangle size={14} color="#FF4757" />
                  <p style={{ fontSize: '11px', color: '#FF4757', fontWeight: 500 }}>
                    {errors.card}
                  </p>
                </motion.div>
              )}
            </div>
          )}

          {showPaymentMethodModal && (
            <PaymentMethodModal
              methods={PAYMENT_METHODS}
              selected={paymentMethod}
              selectedCardId={cardId}
              cards={cards}
              onSelect={(id, selectedCard) => {
                setPaymentMethod(id);
                if (id === 'credito' && selectedCard) {
                  setCardId(selectedCard);
                } else {
                  setCardId('');
                  setInstallment(false);
                }
              }}
              onClose={() => setShowPaymentMethodModal(false)}
            />
          )}

          {/* Installment */}
          {showInstallment && (
            <div className="bg-[#1C2128] border border-[#30363D] rounded-2xl p-4">
              {/* Toggle row */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>Parcelado?</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>Dividir em parcelas no cartão</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInstallment(!installment)}
                  className="relative w-12 h-6 rounded-full transition-all"
                  style={{ background: installment ? '#7C5CFC' : '#30363D' }}
                >
                  <div
                    className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: installment ? '26px' : '4px' }}
                  />
                </button>
              </div>

              {/* Installment details */}
              {installment && (
                <div className="mt-4 flex flex-col gap-3">
                  {/* Chip selector */}
                  <div>
                    <p className="text-[#7D8590] mb-2" style={{ fontSize: '12px' }}>Número de Parcelas</p>
                    <div className="flex flex-wrap gap-2">
                      {INSTALLMENT_OPTIONS.map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setInstallmentCount(n)}
                          className="px-3 py-1.5 rounded-lg transition-all"
                          style={{
                            fontSize: '13px',
                            fontWeight: installmentCount === n ? 600 : 400,
                            background: installmentCount === n ? '#4A90D9' : 'transparent',
                            border: `1px solid ${installmentCount === n ? '#4A90D9' : '#30363D'}`,
                            color: installmentCount === n ? '#FFFFFF' : '#7D8590',
                          }}
                        >
                          {n} x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="border-t border-[#30363D] pt-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Valor da parcela</span>
                      <span className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(parsedValue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Nº de parcelas</span>
                      <span className="text-[#4A90D9]" style={{ fontSize: '13px', fontWeight: 600 }}>{installmentCount} x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Valor total</span>
                      <span className="text-[#FF4757]" style={{ fontSize: '14px', fontWeight: 700 }}>{formatCurrency(totalInstallmentValue)}</span>
                    </div>
                    {selectedCard && (
                      <p className="text-[#484F58] mt-1" style={{ fontSize: '10px' }}>
                        Comprometerá {formatCurrency(totalInstallmentValue)} do limite do cartão
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Date */}
          <div>
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Data</label>
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-left flex items-center justify-between active:border-[#00D97E]/50 transition-colors"
            >
              <span className="text-[#E6EDF3]" style={{ fontSize: '14px' }}>
                {formatDisplayDate(date)}
              </span>
              <Calendar size={16} className="text-[#7D8590]" />
            </button>
          </div>

          {showDatePicker && (
            <DatePickerModal
              value={date}
              onSelect={(d) => {
                setDate(d);
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}

          {/* Submit */}
          <motion.button
            type="submit"
            className="w-full py-4 rounded-2xl text-black transition-all"
            style={{ background: '#00D97E', fontWeight: 700, fontSize: '15px' }}
            whileTap={{ scale: 0.96 }}
            whileHover={{ boxShadow: '0 0 20px rgba(0, 217, 126, 0.3)' }}
          >
            Adicionar
          </motion.button>
        </form>
      </motion.div>

      {/* ── Credit Card Confirmation Modal ── */}
      <AnimatePresence>
        {showConfirmation && selectedCard && invoiceInfo && (
          <CardConfirmationModal
            card={selectedCard}
            description={description}
            value={parsedValue}
            date={date}
            installment={installment && showInstallment}
            installmentCount={installmentCount}
            totalValue={totalInstallmentValue}
            invoiceInfo={invoiceInfo}
            lastInstallment={lastInstallment}
            category={selectedCategory}
            formatCurrency={formatCurrency}
            monthNames={MONTH_NAMES}
            onConfirm={doAddTransaction}
            onCancel={() => setShowConfirmation(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Card Confirmation Modal ─────────────────────────────────────────────────

interface CardConfirmationProps {
  card: CreditCard;
  description: string;
  value: number;
  date: string;
  installment: boolean;
  installmentCount: number;
  totalValue: number;
  invoiceInfo: { invoiceMonth: number; invoiceYear: number; dueDate: string };
  lastInstallment: { month: number; year: number; label: string } | null;
  category: { id: string; label: string; color: string; icon: string } | undefined;
  formatCurrency: (v: number) => string;
  monthNames: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

function CardConfirmationModal({
  card, description, value, date, installment, installmentCount,
  totalValue, invoiceInfo, lastInstallment, category, formatCurrency,
  monthNames, onConfirm, onCancel,
}: CardConfirmationProps) {
  const [y, m, d] = date.split('-').map(Number);
  const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center px-5"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onCancel}
    >
      <motion.div
        className="w-full max-w-[360px] rounded-3xl overflow-hidden"
        style={{ background: '#0D1117' }}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `${card.color}15` }}
            >
              <CreditCardIcon size={18} color={card.color} />
            </div>
            <div className="flex-1 min-w-0">
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#E6EDF3' }}>
                {card.name} •••• {card.lastDigits}
              </p>
              <p style={{ fontSize: '11px', color: '#7D8590' }}>
                Confirmar lançamento
              </p>
            </div>
          </div>
        </div>

        {/* Transaction Card - Main Focus */}
        <div className="px-6 pb-5">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ background: '#161B22', border: '1px solid #21262D' }}
          >
            {/* Value - Big and centered */}
            <div className="px-5 pt-6 pb-4 flex flex-col items-center border-b border-[#21262D]">
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: '6px' }}>
                {installment ? `${installmentCount}x de` : 'Valor'}
              </p>
              <p style={{ fontSize: '32px', fontWeight: 800, color: '#FF4757', letterSpacing: '-0.5px' }}>
                {formatCurrency(value)}
              </p>
              {installment && (
                <p style={{ fontSize: '12px', color: '#7D8590', marginTop: '4px' }}>
                  Total: {formatCurrency(totalValue)}
                </p>
              )}
            </div>

            {/* Description + Date */}
            <div className="px-5 py-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {category && (
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{category.icon}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
                    {description.toUpperCase() || 'Transação'}
                  </p>
                  <p style={{ fontSize: '11px', color: '#7D8590' }}>
                    {d} {MONTH_SHORT[m - 1]} {y}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Info - Compact */}
          <div className="mt-4 flex items-center justify-between px-4 py-3 rounded-xl" style={{ background: '#161B2280' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#7D8590', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                Fatura
              </p>
              <p style={{ fontSize: '13px', fontWeight: 700, color: card.color }}>
                {monthNames[invoiceInfo.invoiceMonth - 1]}/{invoiceInfo.invoiceYear}
              </p>
            </div>
            {installment && lastInstallment && (
              <>
                <div className="flex-1 mx-4 flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: card.color }} />
                  <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${card.color}, #7D859050)` }} />
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#7D8590' }} />
                </div>
                <div className="text-right">
                  <p style={{ fontSize: '10px', color: '#7D8590', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                    Até
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#7D8590' }}>
                    {monthNames[lastInstallment.month - 1]}/{lastInstallment.year}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          <motion.button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center"
            style={{
              background: '#161B22',
              border: '1px solid #21262D',
              color: '#7D8590',
              fontSize: '13px',
              fontWeight: 600,
            }}
            whileTap={{ scale: 0.95 }}
          >
            Voltar
          </motion.button>
          <motion.button
            onClick={onConfirm}
            className="flex-[1.6] py-3.5 rounded-2xl flex items-center justify-center gap-2"
            style={{
              background: card.color,
              color: '#FFF',
              fontSize: '13px',
              fontWeight: 700,
            }}
            whileTap={{ scale: 0.95 }}
            whileHover={{ boxShadow: `0 0 24px ${card.color}40` }}
          >
            <Check size={16} strokeWidth={3} />
            Confirmar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}