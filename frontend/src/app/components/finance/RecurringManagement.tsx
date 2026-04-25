import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, RefreshCw, Calendar, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PAYMENT_METHODS } from '../../data/mockData';
import { recurringApi, RecurringTemplate, RecurringFrequency, RecurringType, CreateRecurringInput } from '../../services/recurring.api';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function frequencyLabel(t: RecurringTemplate) {
  if (t.frequency === 'daily')   return 'Diariamente';
  if (t.frequency === 'monthly') return `Todo dia ${t.dayOfMonth ?? '?'}`;
  if (t.frequency === 'weekly')  return `Toda ${WEEKDAYS[t.weekday ?? 0]}`;
  return t.frequency;
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const emptyForm = (): CreateRecurringInput => ({
  type:          'saida',
  description:   '',
  category:      '',
  value:         0,
  paymentMethod: 'dinheiro',
  cardId:        null,
  frequency:     'monthly',
  dayOfMonth:    1,
  weekday:       null,
  startDate:     todayStr(),
  endDate:       null,
  active:        true,
});

export function RecurringManagement() {
  const { categories, cards, showToast, refreshData } = useApp();
  const [templates, setTemplates] = useState<RecurringTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CreateRecurringInput>(emptyForm());
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await recurringApi.list();
      const data = (res.data || []).map((t: any) => ({ ...t, value: Number(t.value) }));
      setTemplates(data);
    } catch (err: any) {
      console.error('Erro ao carregar recorrências:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Set default category once categories carregam (form começa vazio)
  useEffect(() => {
    if (!form.category && categories.length > 0) {
      setForm(p => ({ ...p, category: categories[0].id }));
    }
  }, [categories, form.category]);

  const startNew = () => {
    setCreating(true);
    setEditingId(null);
    setForm({ ...emptyForm(), category: categories[0]?.id ?? '' });
    setError('');
  };

  const startEdit = (t: RecurringTemplate) => {
    setEditingId(t.id);
    setCreating(false);
    setError('');
    setForm({
      type: t.type,
      description: t.description,
      category: t.category,
      value: Number(t.value),
      paymentMethod: t.paymentMethod,
      cardId: t.cardId,
      frequency: t.frequency,
      dayOfMonth: t.dayOfMonth,
      weekday: t.weekday,
      startDate: t.startDate.slice(0, 10),
      endDate: t.endDate?.slice(0, 10) ?? null,
      active: t.active,
    });
  };

  const cancelEdit = () => {
    setCreating(false);
    setEditingId(null);
    setError('');
    setForm(emptyForm());
  };

  const validate = (): string | null => {
    if (!form.description.trim()) return 'Descrição é obrigatória';
    if (!form.category) return 'Categoria é obrigatória';
    if (!Number.isFinite(form.value) || form.value <= 0) return 'Valor deve ser maior que zero';
    if (form.frequency === 'monthly' && (form.dayOfMonth == null || form.dayOfMonth < 1 || form.dayOfMonth > 31)) {
      return 'Dia do mês deve ser entre 1 e 31';
    }
    if (form.frequency === 'weekly' && (form.weekday == null || form.weekday < 0 || form.weekday > 6)) {
      return 'Selecione um dia da semana';
    }
    if (form.paymentMethod === 'credito' && !form.cardId) return 'Selecione um cartão';
    return null;
  };

  const save = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    try {
      const payload: CreateRecurringInput = {
        ...form,
        cardId: form.paymentMethod === 'credito' ? form.cardId : null,
        dayOfMonth: form.frequency === 'monthly' ? form.dayOfMonth : null,
        weekday:    form.frequency === 'weekly'  ? form.weekday    : null,
      };
      if (editingId) {
        await recurringApi.update(editingId, payload);
        showToast({ type: 'success', title: 'Recorrência atualizada', message: form.description, icon: '🔁' });
      } else {
        await recurringApi.create(payload);
        showToast({ type: 'success', title: 'Recorrência criada', message: form.description, icon: '🔁' });
      }
      cancelEdit();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Erro ao salvar');
    }
  };

  const remove = async (id: string) => {
    try {
      await recurringApi.delete(id);
      setConfirmDeleteId(null);
      await load();
      showToast({ type: 'success', title: 'Recorrência removida', message: '', icon: '🗑️' });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao remover', message: err.message || '', icon: '❌' });
    }
  };

  const toggleActive = async (t: RecurringTemplate) => {
    try {
      await recurringApi.update(t.id, { active: !t.active });
      await load();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro', message: err.message || '', icon: '❌' });
    }
  };

  const runNow = async () => {
    setRunning(true);
    try {
      const res = await recurringApi.runNow();
      const created = res.data?.transactionsCreated ?? 0;
      showToast({
        type: created > 0 ? 'success' : 'info',
        title: created > 0 ? `${created} transação(ões) gerada(s)` : 'Nada a gerar',
        message: created > 0 ? 'Confirme em Transações.' : 'Nenhum template tinha lançamento pendente.',
        icon: '⚡',
      });
      await load();
      await refreshData();
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao rodar', message: err.message || '', icon: '❌' });
    } finally {
      setRunning(false);
    }
  };

  const isEditing = creating || editingId !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={startNew}
          className="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] transition-all"
          style={{
            background: 'rgba(0,217,126,0.08)',
            border: '1px solid rgba(0,217,126,0.25)',
            color: '#00D97E',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <Plus size={16} /> Nova Recorrência
        </button>
        <button
          onClick={runNow}
          disabled={running}
          className="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50"
          style={{
            background: 'rgba(74,144,217,0.08)',
            border: '1px solid rgba(74,144,217,0.25)',
            color: '#4A90D9',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <RefreshCw size={16} className={running ? 'animate-spin' : ''} />
          Rodar agora
        </button>
      </div>

      {/* Inline editor */}
      {isEditing && (
        <div className="rounded-2xl p-4 flex flex-col gap-3" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
            {editingId ? 'Editar Recorrência' : 'Nova Recorrência'}
          </p>

          {error && (
            <div className="px-3 py-2 rounded-lg" style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}>
              <p style={{ fontSize: '11px', color: '#FF4757' }}>{error}</p>
            </div>
          )}

          {/* Type */}
          <div className="grid grid-cols-2 gap-2">
            {(['saida', 'entrada'] as RecurringType[]).map(t => (
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

          {/* Description */}
          <input
            value={form.description}
            onChange={e => { setForm(p => ({ ...p, description: e.target.value })); setError(''); }}
            placeholder="Descrição (Ex: Aluguel, Salário)"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
          />

          {/* Value */}
          <input
            type="text"
            inputMode="decimal"
            value={form.value === 0 ? '' : String(form.value)}
            onChange={e => {
              const num = parseFloat(e.target.value.replace(',', '.'));
              setForm(p => ({ ...p, value: isNaN(num) ? 0 : num }));
              setError('');
            }}
            placeholder="Valor (R$)"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
          />

          {/* Category */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Categoria</p>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
              ))}
            </select>
          </div>

          {/* Payment method */}
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

          {/* Card (only when payment is credito) */}
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

          {/* Frequency */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Frequência</p>
            <div className="grid grid-cols-3 gap-2">
              {(['monthly', 'weekly', 'daily'] as RecurringFrequency[]).map(f => (
                <button
                  key={f}
                  onClick={() => setForm(p => ({
                    ...p,
                    frequency: f,
                    dayOfMonth: f === 'monthly' ? (p.dayOfMonth ?? 1) : null,
                    weekday:    f === 'weekly'  ? (p.weekday ?? 1)   : null,
                  }))}
                  className="py-2.5 rounded-lg transition-all"
                  style={{
                    background: form.frequency === f ? '#4A90D920' : '#0D1117',
                    border: `1.5px solid ${form.frequency === f ? '#4A90D9' : '#30363D'}`,
                    color: form.frequency === f ? '#4A90D9' : '#7D8590',
                    fontSize: '12px',
                    fontWeight: form.frequency === f ? 600 : 400,
                  }}
                >
                  {f === 'monthly' ? 'Mensal' : f === 'weekly' ? 'Semanal' : 'Diária'}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency-specific */}
          {form.frequency === 'monthly' && (
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Dia do mês</p>
              <input
                type="number"
                min={1}
                max={31}
                value={form.dayOfMonth ?? ''}
                onChange={e => setForm(p => ({ ...p, dayOfMonth: parseInt(e.target.value) || null }))}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              />
            </div>
          )}
          {form.frequency === 'weekly' && (
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Dia da semana</p>
              <select
                value={form.weekday ?? ''}
                onChange={e => setForm(p => ({ ...p, weekday: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              >
                {WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Início</p>
              <input
                type="date"
                value={form.startDate}
                onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-lg outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              />
            </div>
            <div>
              <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Fim (opcional)</p>
              <input
                type="date"
                value={form.endDate ?? ''}
                onChange={e => setForm(p => ({ ...p, endDate: e.target.value || null }))}
                className="w-full px-3 py-2.5 rounded-lg outline-none"
                style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-1">
            <button
              onClick={cancelEdit}
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

      {/* List */}
      {loading ? (
        <p className="text-center text-[#7D8590] py-8" style={{ fontSize: '12px' }}>Carregando…</p>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 rounded-2xl" style={{ background: '#161B22', border: '1px dashed #30363D' }}>
          <Calendar size={28} className="mx-auto mb-2 text-[#484F58]" />
          <p className="text-[#7D8590]" style={{ fontSize: '13px', fontWeight: 600 }}>
            Sem recorrências cadastradas
          </p>
          <p className="text-[#484F58] mt-1" style={{ fontSize: '11px' }}>
            Cadastre suas contas fixas para o sistema lançar sozinho
          </p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          {templates.map((t, i) => {
            const cat = categories.find(c => c.id === t.category);
            const isExpense = t.type === 'saida';
            return (
              <div key={t.id}>
                {i > 0 && <div className="border-t border-[#30363D]/50" />}
                <div className="px-4 py-3 flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: cat ? `${cat.color}15` : '#0D1117',
                      border: cat ? `1px solid ${cat.color}25` : '1px solid #30363D',
                      opacity: t.active ? 1 : 0.4,
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>{cat?.icon ?? '🔁'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: t.active ? '#E6EDF3' : '#7D8590' }}>
                        {t.description}
                      </p>
                      {!t.active && (
                        <span style={{ fontSize: '9px', color: '#7D8590', background: '#21262D', padding: '1px 6px', borderRadius: 4 }}>
                          PAUSADA
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span style={{ fontSize: '12px', fontWeight: 700, color: isExpense ? '#FF4757' : '#00D97E' }}>
                        {isExpense ? '-' : '+'} {formatCurrency(t.value)}
                      </span>
                      <span style={{ fontSize: '10px', color: '#484F58' }}>·</span>
                      <span style={{ fontSize: '10px', color: '#7D8590' }}>{frequencyLabel(t)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(t)}
                      title={t.active ? 'Pausar' : 'Ativar'}
                      className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FFA502]/10 transition-all"
                    >
                      <span style={{ fontSize: '14px' }}>{t.active ? '⏸' : '▶'}</span>
                    </button>
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
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded-md"
                          style={{ background: '#21262D', border: '1px solid #30363D', fontSize: '10px', color: '#7D8590' }}
                        >
                          Não
                        </button>
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
