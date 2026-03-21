import React, { useState } from 'react';
import { X, Plus, Pencil, Trash2, Check, ChevronLeft } from 'lucide-react';
import { Category } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  onClose: () => void;
}

const ICON_OPTIONS = [
  '🏠', '🍽️', '🚗', '❤️', '🎮', '📚', '📄', '💰', '💼', '📈',
  '📦', '🛒', '👕', '💊', '🐾', '✈️', '🎬', '🎵', '💇', '⚽',
  '🍕', '☕', '🎁', '🏋️', '🔧', '📱', '💻', '🏦', '🚌', '⛽',
  '🧾', '🎓', '👶', '🏥', '🪥', '🧹',
];

const COLOR_OPTIONS = [
  '#FF6B6B', '#FF4757', '#FFA502', '#F59E0B', '#00D97E', '#10B981',
  '#3B82F6', '#4A90D9', '#A855F7', '#7C5CFC', '#EC4899', '#F472B6',
  '#6B7280', '#9CA3AF', '#14B8A6', '#06B6D4',
];

type ScreenMode = 'list' | 'add' | 'edit';

export function ManageCategoriesModal({ onClose }: Props) {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [mode, setMode] = useState<ScreenMode>('list');
  const [editId, setEditId] = useState('');
  const [label, setLabel] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#4A90D9');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const resetForm = () => {
    setLabel('');
    setIcon('📦');
    setColor('#4A90D9');
    setEditId('');
  };

  const openAdd = () => {
    resetForm();
    setMode('add');
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setLabel(cat.label);
    setIcon(cat.icon);
    setColor(cat.color);
    setMode('edit');
  };

  const handleSave = async () => {
    if (!label.trim()) return;

    try {
      if (mode === 'add') {
        const slug = label.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        await addCategory({
          id: slug || `cat_${Date.now()}`,
          label: label.trim(),
          icon,
          color,
        });
      } else if (mode === 'edit' && editId) {
        await updateCategory({ id: editId, label: label.trim(), icon, color });
      }
      setMode('list');
      resetForm();
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
    } catch (err: any) {
      console.error('Erro ao deletar categoria:', err);
    }
    setConfirmDeleteId(null);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D] overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {mode !== 'list' && (
              <button
                onClick={() => { setMode('list'); resetForm(); }}
                className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <div>
              <h3 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
                {mode === 'list' ? 'Categorias' : mode === 'add' ? 'Nova Categoria' : 'Editar Categoria'}
              </h3>
              <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                {mode === 'list'
                  ? `${categories.length} categorias cadastradas`
                  : mode === 'add'
                    ? 'Defina ícone, nome e cor'
                    : 'Alterar dados da categoria'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {mode === 'list' ? (
            <div className="px-5 py-4 flex flex-col gap-2">
              {/* Add button */}
              <button
                type="button"
                onClick={openAdd}
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border border-dashed border-[#30363D] text-left active:scale-[0.98] transition-all hover:border-[#4A90D9]/50"
                style={{ background: '#1C2128' }}
              >
                <div className="w-10 h-10 rounded-xl bg-[#4A90D9]/15 flex items-center justify-center shrink-0">
                  <Plus size={18} color="#4A90D9" />
                </div>
                <div>
                  <p className="text-[#4A90D9]" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Nova Categoria
                  </p>
                  <p className="text-[#484F58]" style={{ fontSize: '11px' }}>
                    Adicionar categoria personalizada
                  </p>
                </div>
              </button>

              {/* List */}
              {categories.map(cat => (
                <div key={cat.id} className="relative">
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-[#30363D] bg-[#1C2128] transition-all"
                  >
                    {/* Icon */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: cat.color + '20' }}
                    >
                      <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E6EDF3] truncate" style={{ fontSize: '14px', fontWeight: 500 }}>
                        {cat.label}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: cat.color }} />
                        <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{cat.color}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(cat)}
                        className="w-8 h-8 rounded-lg bg-[#0D1117] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(cat.id)}
                        className="w-8 h-8 rounded-lg bg-[#0D1117] flex items-center justify-center text-[#FF4757]/60 active:bg-[#30363D]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Delete confirmation */}
                  {confirmDeleteId === cat.id && (
                    <div className="absolute inset-0 bg-[#161B22]/95 rounded-2xl flex items-center justify-center gap-3 px-4 border border-[#FF4757]/30">
                      <p className="text-[#FF4757] flex-1" style={{ fontSize: '12px', fontWeight: 500 }}>
                        Excluir "{cat.label}"?
                      </p>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="px-3 py-1.5 rounded-lg bg-[#FF4757] text-white active:scale-95"
                        style={{ fontSize: '12px', fontWeight: 600 }}
                      >
                        Excluir
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-3 py-1.5 rounded-lg bg-[#30363D] text-[#7D8590] active:scale-95"
                        style={{ fontSize: '12px', fontWeight: 500 }}
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Add / Edit form */
            <div className="px-5 py-4 flex flex-col gap-5">
              {/* Preview */}
              <div className="flex justify-center py-2">
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: color + '25', border: `2px solid ${color}` }}
                >
                  <span style={{ fontSize: '36px' }}>{icon}</span>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-[#7D8590] mb-1.5 block" style={{ fontSize: '12px' }}>Nome da Categoria</label>
                <input
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Ex: Assinatura, Pet, Viagem..."
                  className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl px-4 py-3 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#4A90D9]/50"
                  style={{ fontSize: '14px' }}
                />
              </div>

              {/* Icon picker */}
              <div>
                <label className="text-[#7D8590] mb-2 block" style={{ fontSize: '12px' }}>Ícone</label>
                <div className="flex flex-wrap gap-1.5">
                  {ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: icon === ic ? color + '25' : '#1C2128',
                        border: `1.5px solid ${icon === ic ? color : '#30363D'}`,
                      }}
                    >
                      <span style={{ fontSize: '18px' }}>{ic}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Color picker */}
              <div>
                <label className="text-[#7D8590] mb-2 block" style={{ fontSize: '12px' }}>Cor</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90"
                      style={{
                        background: c,
                        border: color === c ? '2.5px solid #FFFFFF' : '2.5px solid transparent',
                        opacity: color === c ? 1 : 0.6,
                      }}
                    >
                      {color === c && <Check size={16} color="#FFFFFF" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save */}
              <button
                type="button"
                onClick={handleSave}
                disabled={!label.trim()}
                className="w-full py-3.5 rounded-2xl text-white transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ background: color, fontWeight: 700, fontSize: '14px' }}
              >
                {mode === 'add' ? 'Criar Categoria' : 'Salvar Alterações'}
              </button>
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
