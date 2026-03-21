import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface Props {
  value: string; // YYYY-MM-DD
  onSelect: (date: string) => void;
  onClose: () => void;
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

export function DatePickerModal({ value, onSelect, onClose }: Props) {
  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [selected, setSelected] = useState(value);

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: { day: number; month: number; year: number; isCurrentMonth: boolean }[] = [];

    // Previous month fill
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({ day: d, month: viewMonth, year: viewYear, isCurrentMonth: true });
    }

    // Next month fill
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      days.push({ day: d, month: m, year: y, isCurrentMonth: false });
    }

    return days;
  }, [viewYear, viewMonth]);

  const goToPrev = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNext = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleSelect = (d: { day: number; month: number; year: number }) => {
    const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
    setSelected(dateStr);
  };

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
    onClose();
  };

  const formatSelectedDate = () => {
    if (!selected) return 'Nenhuma data selecionada';
    const [y, m, d] = selected.split('-').map(Number);
    return `${d} de ${MONTHS[m - 1]} de ${y}`;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm px-5">
      <div className="w-full max-w-[360px] bg-[#161B22] border border-[#30363D] rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>Selecionar data</p>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590]">
              <X size={14} />
            </button>
          </div>
          <p className="text-[#E6EDF3]" style={{ fontSize: '20px', fontWeight: 700 }}>
            {formatSelectedDate()}
          </p>
        </div>

        <div className="h-px bg-[#30363D]" />

        {/* Month Navigation */}
        <div className="flex items-center justify-between px-5 py-3">
          <button onClick={goToPrev} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]">
            <ChevronLeft size={16} />
          </button>
          <span className="text-[#E6EDF3]" style={{ fontSize: '15px', fontWeight: 600 }}>
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={goToNext} className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]">
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 px-3">
          {WEEKDAYS.map(w => (
            <div key={w} className="flex items-center justify-center py-1">
              <span className="text-[#484F58]" style={{ fontSize: '11px', fontWeight: 500 }}>{w}</span>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 px-3 pb-3">
          {calendarDays.map((d, i) => {
            const dateStr = `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
            const isSelected = dateStr === selected;
            const isToday = dateStr === todayStr;

            return (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(d)}
                className="relative flex items-center justify-center py-1.5 mx-auto"
                style={{ width: '40px', height: '40px' }}
              >
                {isSelected && (
                  <div className="absolute inset-1 rounded-full bg-[#00D97E]" />
                )}
                {isToday && !isSelected && (
                  <div className="absolute inset-1 rounded-full border border-[#00D97E]/40" />
                )}
                <span
                  className="relative z-10"
                  style={{
                    fontSize: '13px',
                    fontWeight: isSelected || isToday ? 600 : 400,
                    color: isSelected
                      ? '#0D1117'
                      : !d.isCurrentMonth
                        ? '#30363D'
                        : isToday
                          ? '#00D97E'
                          : '#E6EDF3',
                  }}
                >
                  {d.day}
                </span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-[#30363D]" />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-[#7D8590] bg-[#1C2128] border border-[#30363D] active:bg-[#30363D]"
            style={{ fontSize: '13px', fontWeight: 500 }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl text-[#0D1117] active:opacity-90"
            style={{ fontSize: '13px', fontWeight: 600, background: '#00D97E' }}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
