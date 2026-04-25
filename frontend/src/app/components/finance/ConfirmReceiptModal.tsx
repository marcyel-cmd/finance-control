import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Check, Loader2, AlertTriangle, Sparkles, Receipt } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { invoiceApi, ParsedReceipt } from '../../services/invoice.api';
import { PAYMENT_METHODS } from '../../data/mockData';

interface Props {
  file: File;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// Modal compacto pra cupom fiscal: chama Gemini, mostra sugestão (descrição,
// valor, data, categoria, método), usuário ajusta e confirma → cria transação.
// Diferente do ImportInvoiceModal (que importa várias transações de fatura),
// aqui é UMA transação só, sem cartão obrigatório.
export function ConfirmReceiptModal({ file, onClose }: Props) {
  const { categories, cards, addTransaction, showToast } = useApp();

  const [step, setStep] = useState<'analyzing' | 'review' | 'submitting' | 'error'>('analyzing');
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<ParsedReceipt | null>(null);

  // Form state — pré-preenchido com a sugestão do Gemini, editável
  const [description, setDescription] = useState('');
  const [valueStr, setValueStr] = useState('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [category, setCategory] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [cardId, setCardId] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  // Dispara análise no mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await invoiceApi.parseReceipt(file);
        if (cancelled) return;
        const sug = res.data;
        setSuggestion(sug);
        setDescription(sug.description.toUpperCase());
        setValueStr(String(sug.value).replace('.', ','));
        setDate(sug.date);
        setCategory(sug.categoryId);
        if (sug.paymentMethodGuess) setPaymentMethod(sug.paymentMethodGuess);
        setStep('review');
      } catch (err: any) {
        if (cancelled) return;
        setError(err?.message || 'Erro ao processar cupom');
        setStep('error');
      }
    })();
    return () => { cancelled = true; };
  }, [file]);

  const submit = async () => {
    const num = parseFloat(valueStr.replace(',', '.'));
    if (!description.trim() || !category || isNaN(num) || num <= 0) {
      showToast({ type: 'error', title: 'Dados inválidos', message: 'Confira descrição, valor e categoria.', icon: '⚠️' });
      return;
    }
    if (paymentMethod === 'credito' && !cardId) {
      showToast({ type: 'error', title: 'Cartão obrigatório', message: 'Selecione um cartão pra crédito.', icon: '⚠️' });
      return;
    }
    setStep('submitting');
    try {
      await addTransaction({
        type: 'saida',
        description: description.toUpperCase(),
        category,
        value: num,
        date,
        paymentMethod,
        cardId: paymentMethod === 'credito' ? cardId : null,
        status: 'realizado',
        recurring: false,
      });
      showToast({
        type: 'success',
        title: 'Transação criada',
        message: `${description.toUpperCase()} — ${formatCurrency(num)}`,
        icon: '🧾',
      });
      onClose();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao salvar', message: err.message || '', icon: '❌' });
      setStep('review');
    }
  };

  const selectedCategory = categories.find(c => c.id === category);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={step === 'analyzing' ? undefined : onClose}
    >
      <motion.div
        className="w-full max-w-[460px] bg-[#161B22] rounded-t-3xl sm:rounded-3xl border border-[#30363D] overflow-hidden"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#30363D]/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#A855F718', border: '1px solid #A855F730' }}>
              <Receipt size={18} color="#A855F7" />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3' }}>Cupom de compra</p>
              <p style={{ fontSize: '11px', color: '#7D8590' }}>
                {step === 'analyzing' ? 'Lendo com IA…' : step === 'review' ? 'Confira e confirme' : step === 'submitting' ? 'Salvando…' : 'Erro'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
            <X size={16} />
          </button>
        </div>

        {/* Image preview */}
        {previewUrl && (
          <div className="px-5 pt-4 pb-1">
            <div className="rounded-xl overflow-hidden flex items-center justify-center" style={{ background: '#0D1117', border: '1px solid #30363D', maxHeight: 180 }}>
              <img src={previewUrl} alt="Cupom" className="object-contain" style={{ maxHeight: 180, width: '100%' }} />
            </div>
          </div>
        )}

        {/* Body */}
        <div className="px-5 py-4">
          {step === 'analyzing' && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 size={28} className="animate-spin text-[#A855F7]" />
              <p style={{ fontSize: '13px', color: '#7D8590' }}>
                Identificando estabelecimento, total e categoria…
              </p>
            </div>
          )}

          {step === 'error' && (
            <div className="flex flex-col items-center gap-3 py-6">
              <AlertTriangle size={28} color="#FFA502" />
              <p className="text-center" style={{ fontSize: '13px', color: '#E6EDF3', fontWeight: 600 }}>
                Não consegui ler o cupom
              </p>
              <p className="text-center" style={{ fontSize: '11px', color: '#7D8590' }}>{error}</p>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2.5 rounded-xl bg-[#21262D] border border-[#30363D]"
                style={{ fontSize: '12px', color: '#E6EDF3', fontWeight: 600 }}
              >
                Fechar
              </button>
            </div>
          )}

          {(step === 'review' || step === 'submitting') && (
            <div className="flex flex-col gap-3">
              {suggestion && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: '#A855F710', border: '1px solid #A855F725' }}>
                  <Sparkles size={12} color="#A855F7" />
                  <p style={{ fontSize: '11px', color: '#A855F7', fontWeight: 600 }}>
                    Sugerido pela IA · confiança {(suggestion.confidence * 100).toFixed(0)}%
                    {suggestion.notes ? ` · ${suggestion.notes}` : ''}
                  </p>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Descrição</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              {/* Value + Date row */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Valor (R$)</label>
                  <input
                    inputMode="decimal"
                    value={valueStr}
                    onChange={e => setValueStr(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '16px', fontWeight: 700, textAlign: 'right' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full px-3 py-3 rounded-xl outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Categoria</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                >
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
                </select>
                {selectedCategory && (
                  <p style={{ fontSize: '10px', color: selectedCategory.color, marginTop: 4 }}>
                    {selectedCategory.icon} {selectedCategory.label}
                  </p>
                )}
              </div>

              {/* Payment method */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Método de pagamento</label>
                <select
                  value={paymentMethod}
                  onChange={e => {
                    const v = e.target.value;
                    setPaymentMethod(v);
                    if (v !== 'credito') setCardId('');
                  }}
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                >
                  {PAYMENT_METHODS.map((m: any) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>

              {paymentMethod === 'credito' && (
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Cartão</label>
                  <select
                    value={cardId}
                    onChange={e => setCardId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                  >
                    <option value="">Selecione</option>
                    {cards.map(c => <option key={c.id} value={c.id}>{c.name} •••• {c.lastDigits}</option>)}
                  </select>
                </div>
              )}

              {/* Submit */}
              <motion.button
                onClick={submit}
                disabled={step === 'submitting'}
                className="w-full mt-2 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: '#00D97E', color: '#0D1117', fontSize: '14px', fontWeight: 700 }}
                whileTap={{ scale: 0.97 }}
              >
                {step === 'submitting' ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} strokeWidth={3} />
                )}
                Salvar transação
              </motion.button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
