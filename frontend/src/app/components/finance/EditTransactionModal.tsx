import React, { useState, useMemo } from 'react';
import { X, ChevronRight, Calendar } from 'lucide-react';
import { Transaction, TransactionType } from '../../types';
import { PAYMENT_METHODS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { DatePickerModal } from './DatePickerModal';
import { PaymentMethodModal } from './PaymentMethodModal';
import { CategoryPickerModal } from './CategoryPickerModal';

interface Props {
  transaction: Transaction;
  onClose: () => void;
}

type TabType = 'entrada' | 'saida' | 'previsto';

const TABS: { id: TabType; label: string; color: string }[] = [
  { id: 'entrada', label: '↑ Entrada', color: '#00D97E' },
  { id: 'saida', label: '↓ Saída', color: '#FF4757' },
  { id: 'previsto', label: '⏱ Previsto', color: '#FFA502' },
];

export function EditTransactionModal({ transaction: tx, onClose }: Props) {
  const { updateTransaction, cards, categories, showToast } = useApp();

  // [T-04] FIX: saida_futura é mapeada para a aba 'saida', mas preservamos o tipo original
  const initialTab: TabType = tx.type === 'saida_futura' ? 'saida' : tx.type;
  const originalType = tx.type; // guardamos o tipo original para enviar corretamente
  const [tab, setTab] = useState<TabType>(initialTab);
  const [description, setDescription] = useState(tx.description);
  const [value, setValue] = useState(tx.value.toString().replace('.', ','));
  const [category, setCategory] = useState(tx.category);
  const [paymentMethod, setPaymentMethod] = useState(tx.paymentMethod || 'dinheiro');
  const [cardId, setCardId] = useState(tx.cardId || '');
  const [date, setDate] = useState(tx.date);
  const [installment, setInstallment] = useState(!!(tx.installments && tx.installments > 1));
  const [installmentCount, setInstallmentCount] = useState(tx.installments || 2);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const INSTALLMENT_OPTIONS = [2, 3, 4, 5, 6, 8, 10, 12];

  const showCardSelect = paymentMethod === 'credito';
  const showPayment = tab === 'saida';
  const showInstallment = showPayment && showCardSelect && !!cardId;

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
    const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} de ${MONTHS[m - 1]} de ${y}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !value) return;

    const numValue = parseFloat(value.replace(',', '.'));
    if (isNaN(numValue) || numValue <= 0) return;

    try {
      // [T-04] FIX: preservar saida_futura se o usuário não mudou de aba explicitamente
      const resolvedType = (tab === 'saida' && originalType === 'saida_futura') ? 'saida_futura' : tab;
      await updateTransaction(tx.id, {
        type: resolvedType,
        description: description.toUpperCase(),
        category,
        value: installment && showInstallment ? parsedValue : numValue,
        date,
        paymentMethod: showPayment ? paymentMethod : 'transferencia',
        cardId: showCardSelect && cardId ? cardId : null,
        status: tab === 'previsto' || resolvedType === 'saida_futura' ? 'previsto' : 'realizado',
      });
      showToast({
        type: 'success',
        title: 'Transação atualizada',
        message: `${description.toUpperCase()} — ${formatCurrency(numValue)}`,
        icon: '✏️',
      });
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao atualizar',
        message: err.message || 'Tente novamente',
        icon: '❌',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D] overflow-hidden"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
            Editar Transação
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
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Descricao</label>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ex: Aluguel, Salario..."
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#4A90D9]/50"
              style={{ fontSize: '14px' }}
            />
          </div>

          {/* Value */}
          <div>
            <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>
              {showInstallment && installment ? 'Valor da Parcela (R$)' : 'Valor (R$)'}
            </label>
            <input
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#4A90D9]/50"
              style={{ fontSize: '14px' }}
            />
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

          {/* Payment Method */}
          {showPayment && (
            <div>
              <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Metodo de Pagamento</label>
              <button
                type="button"
                onClick={() => setShowPaymentMethodModal(true)}
                className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-left flex items-center justify-between active:border-[#4A90D9]/50 transition-colors"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[#E6EDF3] truncate" style={{ fontSize: '14px' }}>
                    {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label || 'Selecionar'}
                  </span>
                  {paymentMethod === 'credito' && selectedCard && (
                    <span className="truncate" style={{ fontSize: '11px', color: selectedCard.color }}>
                      {selectedCard.name} **** {selectedCard.lastDigits}
                    </span>
                  )}
                </div>
                <ChevronRight size={16} className="text-[#7D8590] shrink-0" />
              </button>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>Parcelado?</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>Dividir em parcelas no cartao</p>
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

              {installment && (
                <div className="mt-4 flex flex-col gap-3">
                  <div>
                    <p className="text-[#7D8590] mb-2" style={{ fontSize: '12px' }}>Numero de Parcelas</p>
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

                  <div className="border-t border-[#30363D] pt-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Valor da parcela</span>
                      <span className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>{formatCurrency(parsedValue)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>No de parcelas</span>
                      <span className="text-[#4A90D9]" style={{ fontSize: '13px', fontWeight: 600 }}>{installmentCount} x</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Valor total</span>
                      <span className="text-[#FF4757]" style={{ fontSize: '14px', fontWeight: 700 }}>{formatCurrency(totalInstallmentValue)}</span>
                    </div>
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
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-left flex items-center justify-between active:border-[#4A90D9]/50 transition-colors"
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
          <button
            type="submit"
            className="w-full py-4 rounded-2xl text-black transition-all active:scale-[0.98]"
            style={{ background: '#4A90D9', fontWeight: 700, fontSize: '15px', color: '#FFFFFF' }}
          >
            Salvar Alteracoes
          </button>
        </form>
      </div>
    </div>
  );
}
