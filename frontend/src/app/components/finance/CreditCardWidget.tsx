import React from 'react';
import { CreditCard as CardIcon, Wifi } from 'lucide-react';
import { CreditCard } from '../../types';

interface CreditCardWidgetProps {
  card: CreditCard;
  onClick?: () => void;
  size?: 'sm' | 'lg';
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const BRAND_LOGOS: Record<string, string> = {
  nubank: 'N',
  picpay: 'P',
  visa: 'V',
  mastercard: 'M',
  elo: 'E',
  other: '?',
};

export function CreditCardWidget({ card, onClick, size = 'sm' }: CreditCardWidgetProps) {
  const usedPercent = card.limit > 0 ? (card.used / card.limit) * 100 : 0;
  const isAlertZone = usedPercent > 80;
  const isWarningZone = usedPercent > 60;
  const barColor = isAlertZone ? '#FF4757' : isWarningZone ? '#FFA502' : '#00D97E';

  if (size === 'lg') {
    return (
      <div
        onClick={onClick}
        className="relative rounded-3xl p-5 cursor-pointer overflow-hidden select-none active:scale-[0.98] transition-transform"
        style={{
          background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color}88 100%)`,
          minHeight: 190,
        }}
      >
        {/* Background decoration */}
        <div className="absolute top-[-30px] right-[-30px] w-32 h-32 rounded-full opacity-20"
          style={{ background: 'white' }} />
        <div className="absolute bottom-[-40px] left-[20px] w-40 h-40 rounded-full opacity-10"
          style={{ background: 'white' }} />

        <div className="relative z-10 flex flex-col h-full gap-3">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/70 uppercase tracking-widest" style={{ fontSize: '10px' }}>Cartão {card.type}</p>
              <p className="text-white" style={{ fontSize: '18px', fontWeight: 700 }}>{card.name}</p>
            </div>
            <Wifi size={20} color="white" className="rotate-90 opacity-80" />
          </div>

          {/* Card number */}
          <p className="text-white/80 tracking-widest" style={{ fontSize: '14px', fontWeight: 300 }}>
            •••• •••• •••• {card.lastDigits}
          </p>

          {/* Vencimento */}
          <div className="flex items-center gap-4">
            <div>
              <p className="text-white/60 uppercase" style={{ fontSize: '9px' }}>Vencimento</p>
              <p className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Dia {card.dueDay}</p>
            </div>
            <div>
              <p className="text-white/60 uppercase" style={{ fontSize: '9px' }}>Fechamento</p>
              <p className="text-white" style={{ fontSize: '13px', fontWeight: 600 }}>Dia {card.closingDay}</p>
            </div>
            <div className="ml-auto">
              <CardIcon size={28} color="white" opacity={0.6} />
            </div>
          </div>

          {/* Limit info */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <p className="text-white/60" style={{ fontSize: '10px' }}>Saldo Disponível</p>
                <p className="text-white" style={{ fontSize: '20px', fontWeight: 700 }}>
                  {formatCurrency(card.limit - card.used)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60" style={{ fontSize: '10px' }}>Utilizado</p>
                <p className="text-white" style={{ fontSize: '16px', fontWeight: 700 }}>
                  {formatCurrency(card.used)}
                </p>
                <p className="text-white/50" style={{ fontSize: '9px' }}>
                  {usedPercent.toFixed(0)}% do limite
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(usedPercent, 100)}%`, backgroundColor: barColor }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-white/50" style={{ fontSize: '9px' }}>
                Limite total: {formatCurrency(card.limit)}
              </span>
              <span style={{ fontSize: '9px', color: barColor, fontWeight: 600 }}>
                {usedPercent.toFixed(0)}% usado
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Small version
  return (
    <div
      onClick={onClick}
      className="relative rounded-2xl p-4 cursor-pointer overflow-hidden active:scale-[0.98] transition-transform flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${card.color}dd 0%, ${card.color}88 100%)`,
        width: 165,
        minHeight: 110,
      }}
    >
      <div className="absolute top-[-15px] right-[-15px] w-20 h-20 rounded-full opacity-20 bg-white" />

      <div className="relative z-10 flex flex-col gap-2 h-full">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 uppercase" style={{ fontSize: '8px', letterSpacing: 1 }}>Cartão</p>
            <p className="text-white" style={{ fontSize: '14px', fontWeight: 700 }}>{card.name}</p>
          </div>
          <CardIcon size={16} color="white" opacity={0.6} />
        </div>

        <p className="text-white" style={{ fontSize: '15px', fontWeight: 700 }}>
          {formatCurrency(card.limit - card.used)}
        </p>
        <p className="text-white/60" style={{ fontSize: '10px' }}>Disponível</p>

        <div className="h-1 bg-white/20 rounded-full overflow-hidden mt-auto">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(usedPercent, 100)}%`, backgroundColor: barColor }}
          />
        </div>

        <div className="flex justify-between">
          <span className="text-white/50" style={{ fontSize: '9px' }}>
            Fecha dia {card.closingDay}
          </span>
          <span className="text-white/50" style={{ fontSize: '9px' }}>
            Vence dia {card.dueDay}
          </span>
        </div>
      </div>
    </div>
  );
}