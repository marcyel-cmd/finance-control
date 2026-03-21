import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, CreditCard } from 'lucide-react';
import { CreditCard as CreditCardType, CardBrand, CardType } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  onClose: () => void;
}

const BRANDS: { id: CardBrand; label: string; color: string }[] = [
  { id: 'nubank', label: 'Nubank', color: '#8B5CF6' },
  { id: 'picpay', label: 'PicPay', color: '#00D97E' },
  { id: 'visa', label: 'Visa', color: '#1A1F71' },
  { id: 'mastercard', label: 'Mastercard', color: '#EB001B' },
  { id: 'elo', label: 'Elo', color: '#F9B800' },
  { id: 'other', label: 'Outro', color: '#6B7280' },
];

const PRESET_COLORS = ['#8B5CF6', '#00D97E', '#3B82F6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F97316'];

function CardForm({ card, onSave, onCancel }: {
  card?: CreditCardType;
  onSave: (c: CreditCardType) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(card?.name || '');
  const [lastDigits, setLastDigits] = useState(card?.lastDigits || '');
  const [brand, setBrand] = useState<CardBrand>(card?.brand || 'nubank');
  const [type, setType] = useState<CardType>(card?.type || 'credito');
  const [dueDay, setDueDay] = useState(card?.dueDay?.toString() || '15');
  const [closingDay, setClosingDay] = useState(card?.closingDay?.toString() || '7');
  const [limit, setLimit] = useState(card?.limit?.toString() || '');
  const [color, setColor] = useState(card?.color || '#8B5CF6');

  const selectedBrand = BRANDS.find(b => b.id === brand);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !lastDigits) return;
    onSave({
      id: card?.id || `card_${Date.now()}`,
      name,
      lastDigits: lastDigits.slice(-4),
      brand,
      type,
      dueDay: parseInt(dueDay) || 15,
      closingDay: parseInt(closingDay) || 7,
      limit: parseFloat(limit) || 0,
      used: card?.used || 0,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Card Preview */}
      <div
        className="rounded-2xl p-5 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)`, height: 130 }}
      >
        <div className="absolute top-[-20px] right-[-20px] w-28 h-28 rounded-full bg-white/10" />
        <div className="relative z-10 flex flex-col justify-between h-full">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-white/60 uppercase text-[9px] tracking-widest">Crédito</p>
              <p className="text-white font-bold" style={{ fontSize: '16px' }}>{name || 'Nome do Cartão'}</p>
            </div>
          </div>
          <div className="flex justify-between items-end">
            <p className="text-white/70 tracking-widest text-sm">•••• •••• •••• {lastDigits || '0000'}</p>
            <div>
              <p className="text-white/60 text-[9px] uppercase">Vencimento</p>
              <p className="text-white text-sm font-semibold">Dia {dueDay}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Nome do Cartão</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Nubank Principal"
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] placeholder-[#484F58] outline-none text-sm focus:border-[#00D97E]/50"
          />
        </div>
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Últimos 4 dígitos</label>
          <input
            value={lastDigits}
            onChange={e => setLastDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="0000"
            maxLength={4}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] placeholder-[#484F58] outline-none text-sm focus:border-[#00D97E]/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Bandeira</label>
          <select
            value={brand}
            onChange={e => {
              setBrand(e.target.value as CardBrand);
              const b = BRANDS.find(b => b.id === e.target.value);
              if (b) setColor(b.color);
            }}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] outline-none text-sm appearance-none"
          >
            {BRANDS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Tipo</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as CardType)}
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] outline-none text-sm appearance-none"
          >
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Dia de Vencimento</label>
          <input
            type="number"
            value={dueDay}
            onChange={e => setDueDay(e.target.value)}
            min="1" max="31"
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] outline-none text-sm"
          />
        </div>
        <div>
          <label className="text-[#7D8590] mb-1 block text-xs">Dia de Fechamento</label>
          <input
            type="number"
            value={closingDay}
            onChange={e => setClosingDay(e.target.value)}
            min="1" max="31"
            className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] outline-none text-sm"
          />
        </div>
      </div>

      <div>
        <label className="text-[#7D8590] mb-1 block text-xs">Limite do Cartão</label>
        <input
          value={limit}
          onChange={e => setLimit(e.target.value)}
          placeholder="0,00"
          inputMode="decimal"
          className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-3 py-2.5 text-[#E6EDF3] placeholder-[#484F58] outline-none text-sm"
        />
      </div>

      <div>
        <label className="text-[#7D8590] mb-2 block text-xs">Cor personalizada</label>
        <div className="flex gap-2 flex-wrap">
          {PRESET_COLORS.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className="w-7 h-7 rounded-lg border-2 transition-all"
              style={{
                background: c,
                borderColor: color === c ? 'white' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-2xl text-[#E6EDF3] border border-[#30363D]"
          style={{ fontSize: '14px', fontWeight: 600 }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="flex-1 py-3 rounded-2xl text-black"
          style={{ background: '#00D97E', fontSize: '14px', fontWeight: 700 }}
        >
          {card ? 'Salvar' : 'Adicionar'}
        </button>
      </div>
    </form>
  );
}

export function ManageCardsModal({ onClose }: Props) {
  const { cards, addCard, updateCard, deleteCard } = useApp();
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingCard, setEditingCard] = useState<CreditCardType | undefined>();

  const handleSave = async (c: CreditCardType) => {
    try {
      if (view === 'edit') {
        await updateCard(c);
      } else {
        await addCard(c);
      }
      setView('list');
      setEditingCard(undefined);
    } catch (err: any) {
      console.error('Erro ao salvar cartão:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D]"
        style={{ maxHeight: '92vh', overflowY: 'auto' }}>

        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <CreditCard size={18} color="#00D97E" />
            <h2 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
              {view === 'list' ? 'Gerenciar Cartões' : view === 'add' ? 'Adicionar Cartão' : 'Editar Cartão'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 pb-8">
          {view === 'list' ? (
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setView('add')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#00D97E]/40 text-[#00D97E] transition-all hover:bg-[#00D97E]/5"
                style={{ fontSize: '14px', fontWeight: 600 }}
              >
                <Plus size={16} />
                Adicionar Novo Cartão
              </button>

              {cards.map(card => (
                <div
                  key={card.id}
                  className="flex items-center gap-3 py-3 px-4 bg-[#1C2128] rounded-2xl border border-[#30363D]"
                >
                  <div className="w-9 h-6 rounded-lg" style={{ background: card.color }} />
                  <div className="flex-1">
                    <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>{card.name}</p>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                      •••• {card.lastDigits} · {card.type === 'credito' ? 'Crédito' : 'Débito'}
                    </p>
                  </div>
                  <button
                    onClick={() => { setEditingCard(card); setView('edit'); }}
                    className="p-2 rounded-lg text-[#7D8590] hover:text-[#E6EDF3] hover:bg-[#30363D]/50 transition-all"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={() => deleteCard(card.id)}
                    className="p-2 rounded-lg text-[#FF4757] hover:bg-[#FF4757]/10 transition-all"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}

              {cards.length === 0 && (
                <div className="text-center py-8">
                  <CreditCard size={32} color="#30363D" className="mx-auto mb-2" />
                  <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>Nenhum cartão cadastrado</p>
                </div>
              )}
            </div>
          ) : (
            <CardForm
              card={editingCard}
              onSave={handleSave}
              onCancel={() => { setView('list'); setEditingCard(undefined); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
