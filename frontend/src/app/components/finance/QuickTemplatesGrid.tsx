import React, { useEffect, useState } from 'react';
import { Zap, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { transactionTemplateApi, TransactionTemplate } from '../../services/transactionTemplate.api';
import { QuickValueModal } from './QuickValueModal';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// Grid horizontal com os templates mais usados. 1 toque cria a transação.
// Se valueRequired=true, abre QuickValueModal pedindo só o valor.
export function QuickTemplatesGrid() {
  const { showToast, refreshData, categories } = useApp();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [valueModalFor, setValueModalFor] = useState<TransactionTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await transactionTemplateApi.listTop(6);
      const data = (res.data || []).map((t: any) => ({
        ...t,
        defaultValue: t.defaultValue == null ? null : Number(t.defaultValue),
      }));
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const useTemplate = async (tpl: TransactionTemplate, valueOverride?: number) => {
    setSubmitting(true);
    try {
      await transactionTemplateApi.use(tpl.id, valueOverride);
      const v = valueOverride ?? tpl.defaultValue ?? 0;
      showToast({
        type: 'success',
        title: tpl.type === 'entrada' ? 'Entrada lançada' : 'Saída lançada',
        message: `${tpl.label} — ${formatCurrency(v)}`,
        icon: tpl.icon ?? (tpl.type === 'entrada' ? '💰' : '⚡'),
      });
      setValueModalFor(null);
      await Promise.all([load(), refreshData()]);
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao lançar', message: err.message || '', icon: '❌' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClick = (tpl: TransactionTemplate) => {
    if (tpl.valueRequired) {
      setValueModalFor(tpl);
    } else {
      void useTemplate(tpl);
    }
  };

  if (loading || templates.length === 0) {
    // Quando não há templates ainda, mostra um único cartão de "criar primeiro atalho"
    if (!loading && templates.length === 0) {
      return (
        <div className="px-4">
          <button
            onClick={() => navigate('/mais?tab=templates')}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl active:scale-[0.98] transition-all"
            style={{ background: '#161B22', border: '1px dashed #30363D' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(0,217,126,0.1)', border: '1px solid rgba(0,217,126,0.3)' }}
            >
              <Zap size={18} color="#00D97E" />
            </div>
            <div className="flex-1 text-left">
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
                Crie seus atalhos de 1 toque
              </p>
              <p style={{ fontSize: '11px', color: '#7D8590' }}>
                Almoço, Uber, mercado… lance sem preencher tudo de novo
              </p>
            </div>
            <Plus size={16} color="#00D97E" />
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap size={14} color="#00D97E" />
          <p className="text-[#7D8590] uppercase tracking-wider" style={{ fontSize: '10px', fontWeight: 700 }}>
            Atalhos rápidos
          </p>
        </div>
        <button
          onClick={() => navigate('/mais?tab=templates')}
          className="text-[#4A90D9]"
          style={{ fontSize: '11px', fontWeight: 600 }}
        >
          Gerenciar
        </button>
      </div>

      <div className="overflow-x-auto px-4 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        <div className="flex gap-2 px-4">
          {templates.map((tpl) => {
            const cat = categories.find(c => c.id === tpl.category);
            const accent = tpl.color || cat?.color || (tpl.type === 'entrada' ? '#00D97E' : '#FF4757');
            return (
              <button
                key={tpl.id}
                disabled={submitting}
                onClick={() => handleClick(tpl)}
                className="flex-shrink-0 w-[120px] flex flex-col items-center justify-center gap-1 p-3 rounded-2xl active:scale-[0.96] transition-all disabled:opacity-50"
                style={{
                  background: '#161B22',
                  border: `1px solid ${accent}30`,
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                >
                  <span style={{ fontSize: '18px' }}>{tpl.icon || cat?.icon || '⚡'}</span>
                </div>
                <p className="truncate w-full text-center" style={{ fontSize: '12px', fontWeight: 600, color: '#E6EDF3' }}>
                  {tpl.label}
                </p>
                <p style={{ fontSize: '10px', color: accent, fontWeight: 700 }}>
                  {tpl.valueRequired
                    ? '↗ Valor'
                    : tpl.defaultValue
                      ? formatCurrency(tpl.defaultValue)
                      : '—'}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {valueModalFor && (
        <QuickValueModal
          template={valueModalFor}
          onConfirm={(v) => void useTemplate(valueModalFor, v)}
          onClose={() => setValueModalFor(null)}
          submitting={submitting}
        />
      )}
    </div>
  );
}
