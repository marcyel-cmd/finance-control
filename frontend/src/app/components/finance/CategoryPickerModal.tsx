import React, { useState } from 'react';
import { X, Check, Search } from 'lucide-react';
import { Category } from '../../types';

interface Props {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function CategoryPickerModal({ categories, selected, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? categories.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
      )
    : categories;

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D] overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div>
            <h3 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
              Categoria
            </h3>
            <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
              {categories.length} categorias disponíveis
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pb-3">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#484F58]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar categoria..."
              className="w-full bg-[#1C2128] border border-[#30363D] rounded-xl pl-10 pr-4 py-2.5 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#4A90D9]/50"
              style={{ fontSize: '13px' }}
            />
          </div>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-2">
            {filtered.map(cat => {
              const isSelected = selected === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelect(cat.id)}
                  className="flex items-center gap-3 px-3.5 py-3 rounded-2xl border transition-all text-left active:scale-[0.97]"
                  style={{
                    background: isSelected ? cat.color + '15' : '#1C2128',
                    borderColor: isSelected ? cat.color : '#30363D',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: isSelected ? cat.color + '30' : '#0D1117',
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                  </div>

                  {/* Label */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? '#E6EDF3' : '#C9D1D9',
                      }}
                    >
                      {cat.label}
                    </p>
                  </div>

                  {/* Check */}
                  {isSelected && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: cat.color }}
                    >
                      <Check size={12} color="#FFFFFF" strokeWidth={3} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10">
              <p className="text-[#484F58]" style={{ fontSize: '14px' }}>Nenhuma categoria encontrada</p>
              <p className="text-[#30363D] mt-1" style={{ fontSize: '12px' }}>Tente outro termo de busca</p>
            </div>
          )}
        </div>

        <div className="h-6" />
      </div>
    </div>
  );
}
