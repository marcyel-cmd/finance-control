import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PAYMENT_METHODS } from '../../data/mockData';
import {
  transactionTemplateApi, TransactionTemplate, TemplateType, CreateTransactionTemplateInput,
} from '../../services/transactionTemplate.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const ICONS = ['⚡', '🍔', '🛒', '🚗', '☕', '💼', '🏠', '🍕', '🚌', '⛽', '🎬', '💊', '📱', '✈️', '🎵', '💰'];

const emptyForm = (): CreateTransactionTemplateInput => ({
  label: '',
  type: 'saida',
  defaultValue: null,
  valueRequired: true,
  category: '',
  paymentMethod: 'dinheiro',
  cardId: null,
  icon: '⚡',
  color: null,
});

export function TransactionTemplatesManagement() {
  const { categories, cards, showToast } = useApp();
  const [templates, setTemplates] = useState<TransactionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateTransactionTemplateInput>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await transactionTemplateApi.list();
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

  useEffect(() => {
    if (!form.category && categories.length > 0) setForm(p => ({ ...p, category: categories[0].id }));
  }, [categories, form.category]);

  const startNew = () => {
    setCreating(true);
    setEditingId(null);
    setForm({ ...emptyForm(), category: categories[0]?.id ?? '' });
    setError('');
  };

  const startEdit = (t: TransactionTemplate) => {
    setEditingId(t.id);
    setCreating(false);
    setError('');
    setForm({
      label: t.label,
      type: t.type,
      defaultValue: t.defaultValue,
      valueRequired: t.valueRequired,
      category: t.category,
      paymentMethod: t.paymentMethod,
      cardId: t.cardId,
      icon: t.icon,
      color: t.color,
    });
  };

  const cancel = () => {
    setCreating(false);
    setEditingId(null);
    setError('');
    setForm(emptyForm());
  };

  const save = async () => {
    if (!form.label.trim()) { setError('Nome é obrigatório'); return; }
    if (!form.category) { setError('Categoria é obrigatória'); return; }
    if (!form.valueRequired && (!form.defaultValue || form.defaultValue <= 0)) {
      setError('Defina um valor padrão ou marque "Pedir valor a cada uso"');
      return;
    }
    if (form.paymentMethod === 'credito' && !form.cardId) { setError('Selecione um cartão'); return; }
    try {
      const payload: CreateTransactionTemplateInput = {
        ...form,
        cardId: form.paymentMethod === 'credito' ? form.cardId : null,
        defaultValue: form.valueRequired ? null : form.defaultValue,
      };
      if (editingId) {
        await transactionTemplateApi.update(editingId, payload);
        showToast({ type: 'success', title: 'Atalho atualizado', message: form.label, icon: '⚡' });
      } else {
        await transactionTemplateApi.create(payload);
        showToast({ type: 'success', title: 'Atalho criado', message: form.label, icon: '⚡' });
      }
      cancel();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar');
    }
  };

  const remove = async (id: string) => {
    try {
      await transactionTemplateApi.delete(id);
      setConfirmDeleteId(null);
      await load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao remover', message: err.message || '', icon: '❌' });
    }
  };

  const isEditing = creating || editingId !== null;

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={startNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] transition-all"
        style={{
          background: 'rgba(0,217,126,0.08)',
          border: '1px solid rgba(0,217,126,0.25)',
          color: '#00D97E',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <Plus size={16} /> Novo Atalho
      </button>

      {isEditing && (
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
            {editingId ? 'Editar Atalho' : 'Novo Atalho'}
          </p>

          {error && (
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
              <p style={{ fontSize: '11px', color: '#FF4757' }}>{error}</p>
            </div>
          )}

          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {(['saida', 'entrada'] as TemplateType[]).map(t => (
              <button
                key={t}
                onClick={() => setForm(p => ({ ...p, type: t }))}
                className="py-2.5 rounded-lg transition-all"
                style={{
                  background: form.type === t ? (t === 'entrada' ? '#00D97E20' : '#FF475720') : '#0D1117',
                  border: `1.5px solid ${form.type === t ? (t === 'entrada' ? '#00D97E' : '#FF4757') : '#30363D'}`,
                  color: form.type === t ? (t === 'entrada' ? '#00D97E' : '#FF4757') : '#7D8590',
                  fontSize: '12px',
                  fontWeight: form.type === t ? 600 : 400,
                }}
              >
                {t === 'entrada' ? '↑ Entrada' : '↓ Saída'}
              </button>
            ))}
          </div>

          {/* Label */}
          <input
            value={form.label}
            onChange={e => { setForm(p => ({ ...p, label: e.target.value })); setError(''); }}
            placeholder="Nome (Ex: Almoço, Uber casa)"
            maxLength={40}
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
          />

          {/* Icon */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Ícone</p>
            <div className="flex flex-wrap gap-2">
              {ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: form.icon === icon ? '#21262D' : 'transparent',
                    border: form.icon === icon ? '1.5px solid #4A90D9' : '1.5px solid #30363D',
                    fontSize: '16px',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          {/* Value behavior */}
          <div
            className="rounded-xl p-3 flex items-center justify-between"
            style={{ background: '#0D1117', border: '1px solid #30363D' }}
          >
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#E6EDF3' }}>Pedir valor a cada uso</p>
              <p style={{ fontSize: '11px', color: '#7D8590' }}>
                {form.valueRequired
                  ? 'Mostra modal com input ao tocar no botão'
                  : 'Cria direto com o valor padrão'}
              </p>
            </div>
            <button
              onClick={() => setForm(p => ({ ...p, valueRequired: !p.valueRequired }))}
              className="relative w-11 h-6 rounded-full transition-all"
              style={{ background: form.valueRequired ? '#00D97E' : '#30363D' }}
            >
              <div
                className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                style={{ left: form.valueRequired ? '23px' : '4px' }}
              />
            </button>
          </div>

          {/* Default value (only when not required) */}
          {!form.valueRequired && (
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Valor padrão (R$)</p>
              <input
                type="text"
                inputMode="decimal"
                value={form.defaultValue == null ? '' : String(form.defaultValue)}
                onChange={e => {
                  const num = parseFloat(e.target.value.replace(',', '.'));
                  setForm(p => ({ ...p, defaultValue: isNaN(num) ? null : num }));
                }}
                placeholder="Ex: 35.00"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              />
            </div>
          )}

          {/* Category */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Categoria</p>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
            >
              {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>
          </div>

          {/* Payment */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Método de pagamento</p>
            <select
              value={form.paymentMethod}
              onChange={e => {
                const v = e.target.value;
                setForm(p => ({ ...p, paymentMethod: v, cardId: v === 'credito' ? p.cardId : null }));
              }}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
            >
              {PAYMENT_METHODS.map((m: any) => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>

          {form.paymentMethod === 'credito' && (
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Cartão</p>
              <select
                value={form.cardId ?? ''}
                onChange={e => setForm(p => ({ ...p, cardId: e.target.value || null }))}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              >
                <option value="">Selecione</option>
                {cards.map(c => <option key={c.id} value={c.id}>{c.name} •••• {c.lastDigits}</option>)}
              </select>
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button
              onClick={cancel}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center"
              style={{ background: '#21262D', border: '1px solid #30363D', color: '#7D8590', fontSize: '13px', fontWeight: 600 }}
            >
              <X size={14} className="mr-1" /> Cancelar
            </button>
            <button
              onClick={save}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1"
              style={{ background: 'rgba(0,217,126,0.15)', border: '1px solid rgba(0,217,126,0.3)', color: '#00D97E', fontSize: '13px', fontWeight: 600 }}
            >
              <Check size={14} /> Salvar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p className="text-center text-[#7D8590] py-8" style={{ fontSize: '12px' }}>Carregando…</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: '#161B22', border: '1px dashed #30363D' }}>
          <Zap size={28} className="mx-auto mb-2 text-[#484F58]" />
          <p className="text-[#7D8590]" style={{ fontSize: '13px', fontWeight: 600 }}>Sem atalhos cadastrados</p>
          <p className="text-[#484F58] mt-1" style={{ fontSize: '11px' }}>
            Cadastre suas transações repetitivas pra lançar com 1 toque
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          {templates.map((t, i) => {
            const cat = categories.find(c => c.id === t.category);
            const accent = t.color || cat?.color || (t.type === 'entrada' ? '#00D97E' : '#FF4757');
            return (
              <div key={t.id}>
                {i > 0 && <div className="border-t border-[#30363D]/50" />}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${accent}18`, border: `1px solid ${accent}30` }}
                  >
                    <span style={{ fontSize: '16px' }}>{t.icon || cat?.icon || '⚡'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>{t.label}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontSize: '11px', color: accent, fontWeight: 600 }}>
                        {t.valueRequired ? '↗ Pede valor' : t.defaultValue ? formatCurrency(t.defaultValue) : '—'}
                      </span>
                      <span style={{ fontSize: '10px', color: '#484F58' }}>·</span>
                      <span style={{ fontSize: '10px', color: '#7D8590' }}>{t.useCount}× usado</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => startEdit(t)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#4A90D9]/10 transition-all"
                    >
                      <Pencil size={13} color="#4A90D9" />
                    </button>
                    {confirmDeleteId === t.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => remove(t.id)}
                          className="px-2 py-1 rounded-md"
                          style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', fontSize: '10px', fontWeight: 600, color: '#FF4757' }}
                        >Excluir</button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-md"
                          style={{ background: '#21262D', border: '1px solid #30363D', fontSize: '10px', color: '#7D8590' }}
                        >Não</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(t.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FF4757]/10 transition-all"
                      >
                        <Trash2 size={13} color="#FF4757" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
