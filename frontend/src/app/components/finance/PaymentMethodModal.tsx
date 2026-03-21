import React, { useState } from 'react';
import { X, Banknote, CreditCard, Receipt, ArrowRightLeft, Check, ChevronDown } from 'lucide-react';

interface PaymentMethod {
  id: string;
  label: string;
}

interface CardOption {
  id: string;
  name: string;
  lastDigits: string;
  color: string;
  limit: number;
  used: number;
}

interface Props {
  methods: PaymentMethod[];
  selected: string;
  selectedCardId: string;
  cards: CardOption[];
  onSelect: (methodId: string, cardId?: string) => void;
  onClose: () => void;
}

const METHOD_META: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  dinheiro: {
    icon: <Banknote size={20} />,
    color: '#00D97E',
    description: 'Pagamento em espécie ou via PIX',
  },
  debito: {
    icon: <CreditCard size={20} />,
    color: '#4A90D9',
    description: 'Débito direto da conta bancária',
  },
  credito: {
    icon: <CreditCard size={20} />,
    color: '#A855F7',
    description: 'Parcelado ou à vista no cartão',
  },
  boleto: {
    icon: <Receipt size={20} />,
    color: '#FFA502',
    description: 'Boleto bancário ou código de barras',
  },
  transferencia: {
    icon: <ArrowRightLeft size={20} />,
    color: '#6B7280',
    description: 'TED, DOC ou transferência bancária',
  },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function PaymentMethodModal({ methods, selected, selectedCardId, cards, onSelect, onClose }: Props) {
  const [expandedCredit, setExpandedCredit] = useState(selected === 'credito');
  const [tempCardId, setTempCardId] = useState(selectedCardId);

  const handleMethodClick = (id: string) => {
    if (id === 'credito') {
      setExpandedCredit(!expandedCredit);
      return;
    }
    // Non-credit: select and close
    onSelect(id);
    onClose();
  };

  const handleCardSelect = (cardId: string) => {
    setTempCardId(cardId);
  };

  const handleConfirmCard = () => {
    if (tempCardId) {
      onSelect('credito', tempCardId);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-[430px] bg-[#161B22] rounded-t-3xl border-t border-[#30363D] overflow-hidden"
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
              Método de Pagamento
            </h3>
            <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
              Selecione como deseja pagar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1C2128] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* Scrollable content */}
        <div className="px-5 py-4 flex flex-col gap-2" style={{ overflowY: 'auto', maxHeight: '65vh' }}>
          {methods.map((m) => {
            const meta = METHOD_META[m.id] || {
              icon: <Banknote size={20} />,
              color: '#7D8590',
              description: '',
            };
            const isCredit = m.id === 'credito';
            const isSelected = isCredit
              ? selected === 'credito' && !expandedCredit
              : selected === m.id && !expandedCredit;
            const isCreditActive = isCredit && expandedCredit;

            return (
              <div key={m.id}>
                {/* Method row */}
                <button
                  type="button"
                  onClick={() => handleMethodClick(m.id)}
                  className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border transition-all text-left active:scale-[0.98]"
                  style={{
                    background: isCreditActive
                      ? meta.color + '12'
                      : isSelected
                        ? meta.color + '12'
                        : '#1C2128',
                    borderColor: isCreditActive
                      ? meta.color
                      : isSelected
                        ? meta.color
                        : '#30363D',
                    ...(isCreditActive ? { borderBottomLeftRadius: 0, borderBottomRightRadius: 0 } : {}),
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: (isCreditActive || isSelected) ? meta.color + '25' : '#0D1117',
                      color: (isCreditActive || isSelected) ? meta.color : '#7D8590',
                    }}
                  >
                    {meta.icon}
                  </div>

                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{
                        fontSize: '14px',
                        fontWeight: (isCreditActive || isSelected) ? 600 : 500,
                        color: (isCreditActive || isSelected) ? '#E6EDF3' : '#C9D1D9',
                      }}
                    >
                      {m.label}
                    </p>
                    <p className="text-[#484F58] truncate" style={{ fontSize: '11px' }}>
                      {isCredit && expandedCredit
                        ? `${cards.length} cartão(ões) cadastrado(s)`
                        : meta.description}
                    </p>
                  </div>

                  {/* Right side */}
                  {isCredit ? (
                    <ChevronDown
                      size={16}
                      className="shrink-0 transition-transform"
                      style={{
                        color: isCreditActive ? meta.color : '#484F58',
                        transform: expandedCredit ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}
                    />
                  ) : (
                    isSelected && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: meta.color }}
                      >
                        <Check size={14} color="#FFFFFF" strokeWidth={2.5} />
                      </div>
                    )
                  )}
                </button>

                {/* Expanded card list */}
                {isCredit && expandedCredit && (
                  <div
                    className="border border-t-0 rounded-b-2xl overflow-hidden"
                    style={{ borderColor: meta.color, background: '#0D1117' }}
                  >
                    <div className="p-3 flex flex-col gap-2">
                      <p className="text-[#7D8590] px-1" style={{ fontSize: '11px', fontWeight: 500 }}>
                        Selecione o cartão
                      </p>

                      {cards.map(card => {
                        const isCardSelected = tempCardId === card.id;
                        const available = card.limit - card.used;

                        return (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => handleCardSelect(card.id)}
                            className="flex items-center gap-3 px-3.5 py-3 rounded-xl border transition-all text-left active:scale-[0.98]"
                            style={{
                              background: isCardSelected ? card.color + '15' : '#161B22',
                              borderColor: isCardSelected ? card.color : '#1C2128',
                            }}
                          >
                            {/* Card color dot */}
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                background: isCardSelected ? card.color + '30' : '#1C2128',
                              }}
                            >
                              <CreditCard size={18} style={{ color: card.color }} />
                            </div>

                            {/* Card info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p
                                  className="truncate"
                                  style={{
                                    fontSize: '13px',
                                    fontWeight: isCardSelected ? 600 : 500,
                                    color: isCardSelected ? '#E6EDF3' : '#C9D1D9',
                                  }}
                                >
                                  {card.name}
                                </p>
                                <span className="text-[#484F58]" style={{ fontSize: '11px' }}>
                                  •••• {card.lastDigits}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[#484F58]" style={{ fontSize: '10px' }}>
                                  Disponível:
                                </span>
                                <span
                                  style={{
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    color: available > 0 ? '#00D97E' : '#FF4757',
                                  }}
                                >
                                  {formatCurrency(available)}
                                </span>
                              </div>
                            </div>

                            {/* Check */}
                            {isCardSelected && (
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: card.color }}
                              >
                                <Check size={12} color="#FFFFFF" strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}

                      {cards.length === 0 && (
                        <p className="text-[#484F58] text-center py-4" style={{ fontSize: '12px' }}>
                          Nenhum cartão cadastrado
                        </p>
                      )}
                    </div>

                    {/* Confirm button */}
                    {tempCardId && (
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={handleConfirmCard}
                          className="w-full py-3 rounded-xl text-white transition-all active:scale-[0.98]"
                          style={{
                            background: meta.color,
                            fontSize: '13px',
                            fontWeight: 600,
                          }}
                        >
                          Confirmar {cards.find(c => c.id === tempCardId)?.name || 'cartão'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Safe area bottom padding */}
        <div className="h-6" />
      </div>
    </div>
  );
}
