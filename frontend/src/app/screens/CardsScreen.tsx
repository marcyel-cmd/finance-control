import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings2, Sparkles, FileUp, Calendar, CreditCard as CreditCardIcon, CheckCircle2, AlertTriangle, Clock, Lock, X, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Header } from '../components/layout/Header';
import { CreditCardWidget } from '../components/finance/CreditCardWidget';
import { TransactionItem } from '../components/finance/TransactionItem';
import { useApp } from '../context/AppContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { CreditCard } from '../types';
import { ImportInvoiceModal } from '../components/finance/ImportInvoiceModal';
import { cardsApi } from '../services/cards.api';
import { transactionsApi } from '../services/transactions.api';
import { Transaction } from '../types';

// Mapper: converte transação bruta da API para tipo Transaction do frontend
function mapBillTransaction(t: any): Transaction {
  return {
    id: t.id,
    type: t.type,
    description: t.description,
    category: t.category,
    value: Number(t.value),
    date: t.date?.split('T')[0] || t.date,
    paymentMethod: t.paymentMethod || '',
    cardId: t.cardId,
    status: t.status,
    recurring: t.recurring || false,
    month: t.month,
    year: t.year,
    installments: t.installmentTotal,
    installmentValue: Number(t.value),
    currentInstallment: t.installmentNumber,
    totalInstallmentValue: t.totalValue ? Number(t.totalValue) : undefined,
  };
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Card Carousel ───────────────────────────────────────────────────────────

interface CardCarouselProps {
  cards: CreditCard[];
  activeIndex: number;
  onSelect: (i: number) => void;
  onCardClick: (card: CreditCard) => void;
}

function CardCarousel({ cards, activeIndex, onSelect, onCardClick }: CardCarouselProps) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -40 && activeIndex < cards.length - 1) onSelect(activeIndex + 1);
    if (dx > 40 && activeIndex > 0) onSelect(activeIndex - 1);
    touchStartX.current = null;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Carousel track */}
      <div
        className="w-full overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex transition-transform duration-350"
          style={{ transform: `translateX(calc(-${activeIndex * 100}%))` }}
        >
          {cards.map(card => (
            <div key={card.id} className="w-full flex-shrink-0 px-4">
              <CreditCardWidget card={card} size="lg" onClick={() => onCardClick(card)} />
            </div>
          ))}
        </div>
      </div>

      {/* Dots + arrows */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => activeIndex > 0 && onSelect(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{
            background: activeIndex === 0 ? 'transparent' : '#1C2128',
            border: `1px solid ${activeIndex === 0 ? 'transparent' : '#30363D'}`,
            color: activeIndex === 0 ? '#30363D' : '#7D8590',
          }}
        >
          <ChevronLeft size={14} />
        </button>

        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className="rounded-full transition-all"
              style={{
                width: i === activeIndex ? 20 : 6,
                height: 6,
                background: i === activeIndex ? '#00D97E' : '#30363D',
              }}
            />
          ))}
        </div>

        <button
          onClick={() => activeIndex < cards.length - 1 && onSelect(activeIndex + 1)}
          disabled={activeIndex === cards.length - 1}
          className="w-7 h-7 rounded-full flex items-center justify-center transition-all"
          style={{
            background: activeIndex === cards.length - 1 ? 'transparent' : '#1C2128',
            border: `1px solid ${activeIndex === cards.length - 1 ? 'transparent' : '#30363D'}`,
            color: activeIndex === cards.length - 1 ? '#30363D' : '#7D8590',
          }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Card info row */}
      <p className="text-[#484F58]" style={{ fontSize: '11px' }}>
        {activeIndex + 1} de {cards.length} • arraste para navegar
      </p>
    </div>
  );
}

// ─── Usage Meter ──────────────────────────────────────────────────────────────

function UsageMeter({ card }: { card: CreditCard }) {
  const usedPercent = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
  const available = card.limit - card.used;
  const isAlert = usedPercent > 80;
  const isWarning = usedPercent > 60;
  const barColor = isAlert ? '#FF4757' : isWarning ? '#FFA502' : '#00D97E';
  const statusLabel = isAlert ? 'Crítico' : isWarning ? 'Moderado' : 'Saudável';
  const statusColor = isAlert ? '#FF4757' : isWarning ? '#FFA502' : '#00D97E';

  return (
    <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>Uso do Limite — {card.name}</p>
        <span
          className="px-2 py-0.5 rounded-full"
          style={{ fontSize: '10px', fontWeight: 700, color: statusColor, background: `${statusColor}18` }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Main numbers */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1C2128] rounded-xl p-2.5 text-center">
          <p className="text-[#7D8590]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Limite Total</p>
          <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 700 }}>
            {formatCurrency(card.limit)}
          </p>
        </div>
        <div className="bg-[#1C2128] rounded-xl p-2.5 text-center">
          <p className="text-[#7D8590]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Utilizado</p>
          <p style={{ fontSize: '14px', fontWeight: 700, color: barColor }}>
            {formatCurrency(card.used)}
          </p>
        </div>
        <div className="bg-[#1C2128] rounded-xl p-2.5 text-center">
          <p className="text-[#7D8590]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Disponível</p>
          <p className="text-[#00D97E]" style={{ fontSize: '14px', fontWeight: 700 }}>
            {formatCurrency(available)}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between mb-1.5">
          <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>
            {usedPercent.toFixed(1)}% utilizado
          </span>
          <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>
            {(100 - usedPercent).toFixed(1)}% livre
          </span>
        </div>
        <div className="h-3 bg-[#1C2128] rounded-full overflow-hidden relative">
          {/* Background track with subtle grid */}
          <div className="absolute inset-0 rounded-full" style={{ background: '#1C2128' }} />
          {/* Used bar */}
          <div
            className="h-full rounded-full transition-all duration-500 relative"
            style={{
              width: `${Math.min(usedPercent, 100)}%`,
              background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
              boxShadow: `0 0 8px ${barColor}50`,
            }}
          />
        </div>
        {isAlert && (
          <p className="text-[#FF4757] mt-2 flex items-center gap-1" style={{ fontSize: '11px' }}>
            ⚠️ Limite quase esgotado! Considere quitar parte da fatura.
          </p>
        )}
        {isWarning && !isAlert && (
          <p className="text-[#FFA502] mt-2 flex items-center gap-1" style={{ fontSize: '11px' }}>
            ⚡ Uso moderado. Atenção para não ultrapassar 80%.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Invoice Status Logic ─────────────────────────────────────────────────────

type InvoiceStatus = 'futura' | 'aberta' | 'fechada' | 'vencida';

interface InvoiceInfo {
  status: InvoiceStatus;
  label: string;
  color: string;
  bgColor: string;
  iconName: string;
  closingDate: string;
  dueDate: string;
  closingDateObj: Date;
  dueDateObj: Date;
}

function getInvoiceInfo(card: CreditCard, billMonth: { month: number; year: number }): InvoiceInfo {
  const today = new Date();

  // Closing date: closingDay of bill month
  const closingDate = new Date(billMonth.year, billMonth.month - 1, Math.min(card.closingDay, new Date(billMonth.year, billMonth.month, 0).getDate()));

  // Due date: dueDay of bill month. If dueDay < closingDay, it's next month
  let dueMonth = billMonth.month - 1;
  let dueYear = billMonth.year;
  if (card.dueDay <= card.closingDay) {
    dueMonth += 1;
    if (dueMonth > 11) { dueMonth = 0; dueYear += 1; }
  }
  const dueDate = new Date(dueYear, dueMonth, Math.min(card.dueDay, new Date(dueYear, dueMonth + 1, 0).getDate()));

  const formatDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  let status: InvoiceStatus;
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfClosing = new Date(closingDate.getFullYear(), closingDate.getMonth(), closingDate.getDate());
  const startOfDue = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  if (startOfToday < startOfClosing) {
    // Closing hasn't happened yet
    const billStart = new Date(startOfClosing);
    billStart.setMonth(billStart.getMonth() - 1);
    if (startOfToday >= billStart) {
      status = 'aberta';
    } else {
      status = 'futura';
    }
  } else if (startOfToday < startOfDue) {
    status = 'fechada';
  } else {
    status = 'vencida';
  }

  const statusMap: Record<InvoiceStatus, { label: string; color: string; bgColor: string; iconName: string }> = {
    futura: { label: 'Futura', color: '#4A90D9', bgColor: 'rgba(74,144,217,0.15)', iconName: 'clock' },
    aberta: { label: 'Aberta', color: '#FFA502', bgColor: 'rgba(255,165,2,0.15)', iconName: 'alert' },
    fechada: { label: 'Fechada', color: '#A855F7', bgColor: 'rgba(168,85,247,0.15)', iconName: 'lock' },
    vencida: { label: 'Vencida', color: '#FF4757', bgColor: 'rgba(255,71,87,0.15)', iconName: 'alert' },
  };

  return {
    status,
    ...statusMap[status],
    closingDate: formatDate(closingDate),
    dueDate: formatDate(dueDate),
    closingDateObj: closingDate,
    dueDateObj: dueDate,
  };
}

// ─── Pay Invoice Modal ────────────────────────────────────────────────────────

interface PayInvoiceModalProps {
  card: CreditCard;
  billTotal: number;
  billLabel: string;
  invoiceInfo: InvoiceInfo;
  onConfirm: () => void;
  onClose: () => void;
}

function PayInvoiceModal({ card, billTotal, billLabel, invoiceInfo, onConfirm, onClose }: PayInvoiceModalProps) {
  const [step, setStep] = useState<'confirm' | 'success'>('confirm');

  const handlePay = () => {
    onConfirm();
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={step === 'success' ? onClose : undefined} />
      <div
        className="relative w-full max-w-md mx-4 mb-8 rounded-3xl overflow-hidden"
        style={{ background: '#161B22', border: '1.5px solid #30363D' }}
      >
        {step === 'confirm' ? (
          <div className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center"
                  style={{ background: `${card.color}20` }}
                >
                  <CreditCardIcon size={18} color={card.color} />
                </div>
                <div>
                  <p className="text-[#E6EDF3]" style={{ fontSize: '15px', fontWeight: 600 }}>Pagar Fatura</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>{card.name} •••• {card.lastDigits}</p>
                </div>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
                <X size={16} />
              </button>
            </div>

            {/* Bill Info */}
            <div className="bg-[#1C2128] rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Fatura</span>
                <span className="text-[#E6EDF3]" style={{ fontSize: '12px' }}>{billLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Vencimento</span>
                <span className="text-[#E6EDF3]" style={{ fontSize: '12px' }}>{invoiceInfo.dueDate}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Status</span>
                <span
                  className="px-2 py-0.5 rounded-md flex items-center gap-1"
                  style={{ fontSize: '11px', fontWeight: 600, color: invoiceInfo.color, background: invoiceInfo.bgColor }}
                >
                  <div key={invoiceInfo.iconName} className="flex items-center justify-center w-3 h-3">
                    {invoiceInfo.iconName === 'clock' && <Clock size={12} color={invoiceInfo.color} />}
                    {invoiceInfo.iconName === 'lock' && <Lock size={12} color={invoiceInfo.color} />}
                    {invoiceInfo.iconName === 'alert' && <AlertTriangle size={12} color={invoiceInfo.color} />}
                  </div>
                  {invoiceInfo.label}
                </span>
              </div>
              <div className="border-t border-[#30363D] pt-3 flex items-center justify-between">
                <span className="text-[#7D8590]" style={{ fontSize: '13px', fontWeight: 600 }}>Valor Total</span>
                <span className="text-[#FF4757]" style={{ fontSize: '20px', fontWeight: 700 }}>{formatCurrency(billTotal)}</span>
              </div>
            </div>

            {/* Limit recovery info */}
            <div
              className="rounded-xl p-3 flex items-start gap-2.5"
              style={{ background: 'rgba(0,217,126,0.08)', border: '1px solid rgba(0,217,126,0.2)' }}
            >
              <CheckCircle2 size={16} color="#00D97E" className="mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[#00D97E]" style={{ fontSize: '12px', fontWeight: 600 }}>Limite será restaurado</p>
                <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                  {formatCurrency(billTotal)} retornará ao limite disponível do {card.name}.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-3.5 rounded-2xl text-[#7D8590] transition-all"
                style={{ fontSize: '14px', fontWeight: 600, background: '#1C2128', border: '1px solid #30363D' }}
              >
                Cancelar
              </button>
              <button
                onClick={handlePay}
                className="flex-1 py-3.5 rounded-2xl text-black transition-all active:scale-[0.97]"
                style={{ fontSize: '14px', fontWeight: 700, background: '#00D97E' }}
              >
                Confirmar Pagamento
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col items-center gap-4 py-10">
            {/* Success check */}
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,217,126,0.15)' }}
            >
              <Check size={32} color="#00D97E" strokeWidth={3} />
            </div>
            <div className="text-center">
              <p className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>Fatura Paga!</p>
              <p className="text-[#7D8590] mt-1" style={{ fontSize: '13px' }}>
                {formatCurrency(billTotal)} foram devolvidos ao limite do {card.name}.
              </p>
            </div>

            {/* Updated limit info */}
            <div className="bg-[#1C2128] rounded-2xl p-4 w-full flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${card.color}20` }}>
                  <CreditCardIcon size={14} color={card.color} />
                </div>
                <div>
                  <p className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>{card.name}</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Limite atualizado</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[#00D97E]" style={{ fontSize: '14px', fontWeight: 700 }}>
                  {formatCurrency(Math.min(card.limit, card.limit - card.used + billTotal))}
                </p>
                <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>disponível</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl text-black mt-2 active:scale-[0.97] transition-all"
              style={{ fontSize: '14px', fontWeight: 700, background: '#00D97E' }}
            >
              Entendido
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Card Detail ──────────────────────────────────────────────────────────────

function CardDetail({ card, onBack }: { card: CreditCard; onBack: () => void }) {
  const { categories, showToast } = useApp();
  const [billMonth, setBillMonth] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [billDetail, setBillDetail] = useState<{
    total: number;
    transactions: Transaction[];
    paid: boolean;
    status: string;
  } | null>(null);
  const invoiceTouchStartX = useRef<number | null>(null);

  const MONTHS_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const MONTHS_FULL = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  // ── Buscar detalhe da fatura via API ao mudar o mês ──────────────────────
  const fetchBillDetail = useCallback(async (cardId: string, month: number, year: number) => {
    setLoadingBill(true);
    try {
      const res = await transactionsApi.getBillDetail(cardId, month, year);
      if (res.data) {
        setBillDetail({
          total: Number(res.data.total) || 0,
          transactions: (res.data.transactions || []).map(mapBillTransaction),
          paid: !!res.data.paid,
          status: res.data.status || 'aberta',
        });
      } else {
        setBillDetail({ total: 0, transactions: [], paid: false, status: 'aberta' });
      }
    } catch {
      setBillDetail({ total: 0, transactions: [], paid: false, status: 'aberta' });
    } finally {
      setLoadingBill(false);
    }
  }, []);

  useEffect(() => {
    fetchBillDetail(card.id, billMonth.month, billMonth.year);
  }, [card.id, billMonth.month, billMonth.year, fetchBillDetail]);

  const cardTx = billDetail?.transactions || [];
  const billTotal = billDetail?.total || 0;
  const isPaid = billDetail?.paid || false;

  const invoiceInfo = getInvoiceInfo(card, billMonth);

  const prevBill = () => {
    if (billMonth.month === 1) setBillMonth({ month: 12, year: billMonth.year - 1 });
    else setBillMonth({ month: billMonth.month - 1, year: billMonth.year });
  };
  const nextBill = () => {
    if (billMonth.month === 12) setBillMonth({ month: 1, year: billMonth.year + 1 });
    else setBillMonth({ month: billMonth.month + 1, year: billMonth.year });
  };

  const handleInvoiceTouchStart = (e: React.TouchEvent) => {
    invoiceTouchStartX.current = e.touches[0].clientX;
  };

  const handleInvoiceTouchEnd = (e: React.TouchEvent) => {
    if (invoiceTouchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - invoiceTouchStartX.current;
    if (dx < -50) nextBill();
    if (dx > 50) prevBill();
    invoiceTouchStartX.current = null;
  };

  const handlePayInvoice = async () => {
    try {
      await cardsApi.payBill(card.id, billMonth.month, billMonth.year);
      // Recarregar detalhe da fatura para refletir pagamento
      await fetchBillDetail(card.id, billMonth.month, billMonth.year);
      showToast({
        type: 'success',
        title: 'Fatura paga com sucesso!',
        message: `${formatCurrency(billTotal)} devolvidos ao limite do ${card.name}.`,
        icon: '✅',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao pagar fatura',
        message: err.message || 'Tente novamente',
        icon: '❌',
      });
    }
  };

  const catData = categories.map(cat => {
    const catTotal = cardTx.filter(t => t.category === cat.id).reduce((s, t) => s + t.value, 0);
    return { name: cat.label, value: catTotal, color: cat.color, icon: cat.icon };
  }).filter(c => c.value > 0);

  const showPayButton = billTotal > 0 && !isPaid && (invoiceInfo.status === 'fechada' || invoiceInfo.status === 'vencida');
  const billLabel = `${MONTHS_FULL[billMonth.month - 1]} ${billMonth.year}`;

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 pb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#7D8590] hover:text-[#E6EDF3] transition-colors self-start"
        style={{ fontSize: '13px' }}
      >
        <ChevronLeft size={16} />
        Voltar para cartões
      </button>

      <CreditCardWidget card={card} size="lg" />

      {/* Import invoice button */}
      <button
        onClick={() => setShowImportModal(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl active:scale-[0.98] transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(74,144,217,0.15))',
          border: '1.5px solid rgba(168,85,247,0.3)',
        }}
      >
        <Sparkles size={16} color="#A855F7" />
        <span className="text-[#A855F7]" style={{ fontSize: '13px', fontWeight: 600 }}>
          Importar Fatura com IA
        </span>
        <FileUp size={14} color="#A855F7" />
      </button>

      {/* Usage meter */}
      <UsageMeter card={card} />

      {/* ─── Invoice Section ─────────────────────────────────────────────── */}
      <div
        className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden"
        onTouchStart={handleInvoiceTouchStart}
        onTouchEnd={handleInvoiceTouchEnd}
      >
        {/* Invoice Header */}
        <div className="p-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[#E6EDF3]" style={{ fontSize: '15px', fontWeight: 700 }}>
              Fatura
            </h3>
            {/* Month navigator */}
            <div className="flex items-center gap-1.5 bg-[#1C2128] border border-[#30363D] rounded-xl px-2 py-1">
              <button onClick={prevBill} className="text-[#7D8590] hover:text-[#E6EDF3] transition-colors p-0.5">
                <ChevronLeft size={14} />
              </button>
              <span key={`${billMonth.month}-${billMonth.year}`} className="text-[#E6EDF3] min-w-[80px] text-center" style={{ fontSize: '12px', fontWeight: 500 }}>
                {MONTHS_SHORT[billMonth.month - 1]} {billMonth.year}
              </span>
              <button onClick={nextBill} className="text-[#7D8590] hover:text-[#E6EDF3] transition-colors p-0.5">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Invoice Status Card */}
          <div key={`bill-${billMonth.month}-${billMonth.year}-${isPaid}`} className="bg-[#1C2128] rounded-2xl p-4 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#7D8590] mb-1" style={{ fontSize: '11px' }}>Valor da Fatura</p>
                {loadingBill ? (
                  <div className="h-8 w-28 bg-[#30363D] rounded-lg animate-pulse" />
                ) : (
                  <p className={billTotal > 0 ? 'text-[#FF4757]' : 'text-[#7D8590]'} style={{ fontSize: '24px', fontWeight: 700 }}>
                    {formatCurrency(billTotal)}
                  </p>
                )}
              </div>
              {/* Status badge */}
              <span
                className="px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isPaid ? '#00D97E' : invoiceInfo.color,
                  background: isPaid ? 'rgba(0,217,126,0.15)' : invoiceInfo.bgColor,
                }}
              >
                <div key={isPaid ? 'paid' : invoiceInfo.iconName} className="flex items-center justify-center w-3 h-3">
                  {isPaid && <CheckCircle2 size={12} color="#00D97E" />}
                  {!isPaid && invoiceInfo.iconName === 'clock' && <Clock size={12} color={invoiceInfo.color} />}
                  {!isPaid && invoiceInfo.iconName === 'lock' && <Lock size={12} color={invoiceInfo.color} />}
                  {!isPaid && invoiceInfo.iconName === 'alert' && <AlertTriangle size={12} color={invoiceInfo.color} />}
                </div>
                {isPaid ? 'Paga' : invoiceInfo.label}
              </span>
            </div>

            {/* Swipe hint */}
            <div className="mb-3 flex items-center justify-center">
              <p className="text-[#484F58] flex items-center gap-2" style={{ fontSize: '10px' }}>
                <ChevronLeft size={12} />
                arraste para trocar mês
                <ChevronRight size={12} />
              </p>
            </div>

            {/* Dates row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-[#161B22] rounded-xl p-2.5">
                <Calendar size={13} color="#7D8590" />
                <div>
                  <p className="text-[#484F58]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Fechamento</p>
                  <p className="text-[#E6EDF3]" style={{ fontSize: '12px', fontWeight: 600 }}>{invoiceInfo.closingDate}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[#161B22] rounded-xl p-2.5">
                <Calendar size={13} color={invoiceInfo.status === 'vencida' && !isPaid ? '#FF4757' : '#7D8590'} />
                <div>
                  <p className="text-[#484F58]" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vencimento</p>
                  <p
                    style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: invoiceInfo.status === 'vencida' && !isPaid ? '#FF4757' : '#E6EDF3',
                    }}
                  >
                    {invoiceInfo.dueDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Pay button */}
            {showPayButton && (
              <button
                onClick={() => setShowPayModal(true)}
                className="w-full mt-4 py-3 rounded-xl text-black active:scale-[0.97] transition-all flex items-center justify-center gap-2"
                style={{
                  fontSize: '14px',
                  fontWeight: 700,
                  background: invoiceInfo.status === 'vencida'
                    ? 'linear-gradient(135deg, #FF4757, #FF6B6B)'
                    : '#00D97E',
                }}
              >
                <CreditCardIcon size={16} />
                {invoiceInfo.status === 'vencida' ? 'Pagar Fatura Vencida' : 'Pagar Fatura'}
              </button>
            )}

            {isPaid && billTotal > 0 && (
              <div className="mt-3 flex items-center gap-2 bg-[rgba(0,217,126,0.08)] rounded-xl p-2.5">
                <CheckCircle2 size={14} color="#00D97E" />
                <p className="text-[#00D97E]" style={{ fontSize: '11px' }}>
                  Fatura paga — limite restaurado
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions list */}
        <div className="px-4 pb-4">
          <p className="text-[#7D8590] mb-2" style={{ fontSize: '12px', fontWeight: 500 }}>
            {cardTx.length > 0 ? `${cardTx.length} transaç${cardTx.length > 1 ? 'ões' : 'ão'}` : 'Nenhum gasto nesta fatura'}
          </p>
          {cardTx.length > 0 ? (
            cardTx.map(tx => <TransactionItem key={tx.id} transaction={tx} />)
          ) : (
            <div className="py-6 text-center">
              <p className="text-[#484F58]" style={{ fontSize: '32px' }}>👻</p>
              <p className="text-[#484F58] mt-2" style={{ fontSize: '12px' }}>Sem gastos no período</p>
            </div>
          )}
        </div>
      </div>

      {catData.length > 0 && (
        <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
          <h3 className="text-[#E6EDF3] mb-4" style={{ fontSize: '14px', fontWeight: 600 }}>
            Gastos por Categoria
          </h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={catData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                  dataKey="value" paddingAngle={2}>
                  {catData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 flex-1">
              {catData.map((cat, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                  <span className="text-[#7D8590] flex-1" style={{ fontSize: '11px' }}>{cat.name}</span>
                  <span className="text-[#E6EDF3]" style={{ fontSize: '11px', fontWeight: 600 }}>
                    {formatCurrency(cat.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Import Invoice Modal */}
      {showImportModal && (
        <ImportInvoiceModal
          onClose={() => setShowImportModal(false)}
          preselectedCardId={card.id}
        />
      )}

      {/* Pay Invoice Modal */}
      {showPayModal && (
        <PayInvoiceModal
          card={card}
          billTotal={billTotal}
          billLabel={billLabel}
          invoiceInfo={invoiceInfo}
          onConfirm={handlePayInvoice}
          onClose={() => setShowPayModal(false)}
        />
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function CardsScreen() {
  const { cards, setShowManageCards } = useApp();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showImportModal, setShowImportModal] = useState(false);
  // Fatura atual do cartão ativo
  const [currentBillTotal, setCurrentBillTotal] = useState<number | null>(null);
  const [loadingCurrentBill, setLoadingCurrentBill] = useState(false);

  const currentCard = cards[activeIndex] ?? null;

  // Buscar fatura do mês atual do cartão ativo
  useEffect(() => {
    if (!currentCard) { setCurrentBillTotal(null); return; }
    const now = new Date();
    setLoadingCurrentBill(true);
    setCurrentBillTotal(null);
    transactionsApi.getBillDetail(currentCard.id, now.getMonth() + 1, now.getFullYear())
      .then(res => { if (res.data) setCurrentBillTotal(Number(res.data.total) || 0); })
      .catch(() => setCurrentBillTotal(0))
      .finally(() => setLoadingCurrentBill(false));
  }, [currentCard?.id]);

  // Always get fresh card data from context
  const selectedCard = selectedCardId ? cards.find(c => c.id === selectedCardId) || null : null;

  if (selectedCard) {
    return (
      <div className="flex flex-col">
        <Header title="Fatura" subtitle={selectedCard.name} showPeriod={false} />
        <CardDetail card={selectedCard} onBack={() => setSelectedCardId(null)} />
      </div>
    );
  }

  const totalLimit = cards.reduce((s, c) => s + c.limit, 0);
  const totalUsed = cards.reduce((s, c) => s + c.used, 0);
  const totalAvailable = totalLimit - totalUsed;
  const overallPercent = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
  const overallColor = overallPercent > 80 ? '#FF4757' : overallPercent > 60 ? '#FFA502' : '#00D97E';

  return (
    <div className="flex flex-col">
      <Header
        title="Cartões"
        subtitle={`${cards.length} cartão${cards.length !== 1 ? 'ões' : ''}`}
        showPeriod={false}
        rightAction={
          <button
            onClick={() => setShowManageCards(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00D97E]/15 text-[#00D97E] border border-[#00D97E]/30"
            style={{ fontSize: '12px', fontWeight: 600 }}
          >
            <Settings2 size={13} />
            Gerenciar
          </button>
        }
      />

      <div className="pt-4 flex flex-col gap-4 pb-8">
        {cards.length > 0 ? (
          <>
            {/* Carousel */}
            <CardCarousel
              cards={cards}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              onCardClick={(card) => setSelectedCardId(card.id)}
            />

            {/* Usage meter for active card */}
            <div className="px-4">
              {currentCard && <UsageMeter card={currentCard} />}
            </div>

            {/* Fatura atual do cartão ativo */}
            {currentCard && (
              <div className="px-4">
                <div
                  className="rounded-2xl p-4 flex items-center justify-between"
                  style={{ background: '#161B22', border: '1px solid #30363D' }}
                >
                  <div>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px', marginBottom: 2 }}>
                      Fatura Atual — {new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
                    </p>
                    {loadingCurrentBill ? (
                      <div className="h-6 w-24 bg-[#30363D] rounded-md animate-pulse" />
                    ) : (
                      <p
                        style={{
                          fontSize: '22px',
                          fontWeight: 700,
                          color: (currentBillTotal ?? 0) > 0 ? '#FF4757' : '#7D8590',
                        }}
                      >
                        {formatCurrency(currentBillTotal ?? 0)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedCardId(currentCard.id)}
                    className="px-3 py-2 rounded-xl text-[#00D97E] transition-all active:scale-95"
                    style={{ fontSize: '12px', fontWeight: 600, background: 'rgba(0,217,126,0.1)', border: '1px solid rgba(0,217,126,0.25)' }}
                  >
                    Ver detalhe →
                  </button>
                </div>
              </div>
            )}

            {/* View bill button */}
            <div className="px-4 flex flex-col gap-2">
              {currentCard && (
                <>
                  <button
                    onClick={() => setSelectedCardId(currentCard.id)}
                    className="w-full py-3 rounded-2xl border border-[#30363D] text-[#7D8590] hover:text-[#E6EDF3] hover:border-[#E6EDF3]/20 transition-all"
                    style={{ fontSize: '13px', fontWeight: 500 }}
                  >
                    Ver fatura e transações de {currentCard.name} →
                  </button>
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl active:scale-[0.98] transition-all"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(74,144,217,0.08))',
                      border: '1.5px solid rgba(168,85,247,0.25)',
                    }}
                  >
                    <Sparkles size={15} color="#A855F7" />
                    <span className="text-[#A855F7]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Importar Fatura com IA
                    </span>
                  </button>
                </>
              )}
            </div>

            {/* Total Summary */}
            <div className="px-4">
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <p className="text-[#7D8590] mb-3" style={{ fontSize: '12px' }}>Resumo Geral dos Cartões</p>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Limite Total</p>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatCurrency(totalLimit)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Utilizado</p>
                    <p className="text-[#FF4757]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatCurrency(totalUsed)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Disponível</p>
                    <p className="text-[#00D97E]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatCurrency(totalAvailable)}
                    </p>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-[#7D8590]" style={{ fontSize: '10px' }}>Uso total dos cartões</span>
                    <span className="text-[#7D8590]" style={{ fontSize: '10px' }}>
                      {overallPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#1C2128] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(overallPercent, 100)}%`,
                        background: overallColor,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-4 px-4">
            <div className="w-16 h-16 rounded-2xl bg-[#161B22] border border-[#30363D] flex items-center justify-center">
              <span className="text-3xl">💳</span>
            </div>
            <div className="text-center">
              <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 600 }}>Nenhum cartão cadastrado</p>
              <p className="text-[#7D8590] mt-1" style={{ fontSize: '13px' }}>
                Adicione seus cartões para controlar os gastos
              </p>
            </div>
            <button
              onClick={() => setShowManageCards(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl text-black"
              style={{ background: '#00D97E', fontWeight: 700, fontSize: '14px' }}
            >
              <Plus size={16} />
              Adicionar Cartão
            </button>
          </div>
        )}
      </div>

      {/* Import Invoice Modal */}
      {showImportModal && (
        <ImportInvoiceModal
          onClose={() => setShowImportModal(false)}
          preselectedCardId={currentCard?.id}
        />
      )}
    </div>
  );
}