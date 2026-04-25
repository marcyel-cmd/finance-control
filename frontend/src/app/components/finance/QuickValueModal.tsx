import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { TransactionTemplate } from '../../services/transactionTemplate.api';

interface Props {
  template: TransactionTemplate;
  onConfirm: (value: number) => void;
  onClose: () => void;
  submitting: boolean;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// Modal compacto: só pede o valor pra usar um template que tem valueRequired=true.
export function QuickValueModal({ template, onConfirm, onClose, submitting }: Props) {
  const [raw, setRaw] = useState(template.defaultValue ? String(template.defaultValue).replace('.', ',') : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const parsed = parseFloat(raw.replace(',', '.'));
  const valid = !isNaN(parsed) && parsed > 0;
  const accent = template.color || (template.type === 'entrada' ? '#00D97E' : '#FF4757');

  const submit = () => {
    if (!valid || submitting) return;
    onConfirm(parsed);
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-[400px] bg-[#161B22] rounded-t-3xl sm:rounded-3xl border border-[#30363D] overflow-hidden"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 32 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
            >
              <span style={{ fontSize: '18px' }}>{template.icon || '⚡'}</span>
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#E6EDF3' }}>{template.label}</p>
              <p style={{ fontSize: '11px', color: '#7D8590' }}>
                {template.type === 'entrada' ? 'Entrada' : 'Saída'} · hoje
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-5">
          <label className="text-[#7D8590] mb-2 block" style={{ fontSize: '12px' }}>Valor (R$)</label>
          <input
            ref={inputRef}
            value={raw}
            onChange={e => setRaw(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') submit(); }}
            placeholder="0,00"
            inputMode="decimal"
            className="w-full bg-[#0D1117] border border-[#30363D] rounded-xl px-4 py-4 text-[#E6EDF3] outline-none focus:border-[#00D97E]/50"
            style={{ fontSize: '24px', fontWeight: 700, textAlign: 'center' }}
          />
          {valid && (
            <p className="text-center mt-2" style={{ fontSize: '12px', color: accent, fontWeight: 600 }}>
              {template.type === 'entrada' ? '+ ' : '- '}{formatCurrency(parsed)}
            </p>
          )}

          <motion.button
            onClick={submit}
            disabled={!valid || submitting}
            className="w-full mt-5 py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: accent, color: '#0D1117', fontSize: '14px', fontWeight: 700 }}
            whileTap={valid ? { scale: 0.97 } : {}}
          >
            <Check size={16} strokeWidth={3} />
            Lançar
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
