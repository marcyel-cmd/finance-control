import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, FileText, Sparkles, Check, Trash2, ChevronDown,
  AlertTriangle, Brain, ScanLine, CheckCircle2, Loader2, FileUp,
  CreditCard as CreditCardIcon, Tag, Calendar, DollarSign
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CreditCard } from '../../types';
import { invoiceApi } from '../../services/invoice.api';

interface Props {
  onClose: () => void;
  preselectedCardId?: string;
  billMonth?: number;
  billYear?: number;
  initialFile?: File;
}

interface ParsedTransaction {
  id: string;
  description: string;
  value: number;
  date: string;
  categoryId: string;
  selected: boolean;
}

type Step = 'upload' | 'processing' | 'review' | 'success';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── AI Invoice Parsing (via backend) ────────────────────────────────────────

// ─── Processing Animation ────────────────────────────────────────────────────

function ProcessingAnimation({ progress, stage }: { progress: number; stage: string }) {
  const [dots, setDots] = useState<{ id: number; x: number; y: number; delay: number; size: number; color: string }[]>([]);

  useEffect(() => {
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 3,
      size: 2 + Math.random() * 4,
      color: ['#A855F7', '#7C5CFC', '#4A90D9', '#00D97E'][Math.floor(Math.random() * 4)],
    }));
    setDots(generated);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-8 px-6 gap-5 relative overflow-hidden">
      {/* Keyframe animations */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; }
        }
        @keyframes scan-line {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 85%; opacity: 0; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.8); opacity: 0.6; }
          50% { transform: scale(1.2); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0.6; }
        }
        @keyframes data-stream {
          0% { transform: translateY(100%) scaleY(0); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(-100%) scaleY(1); opacity: 0; }
        }
        @keyframes glow-breathe {
          0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.2), 0 0 60px rgba(168,85,247,0.1); }
          50% { box-shadow: 0 0 30px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2); }
        }
        @keyframes text-shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>

      {/* Floating background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {dots.map(dot => (
          <div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`,
              top: `${dot.y}%`,
              width: dot.size,
              height: dot.size,
              background: dot.color,
              animation: `float-particle ${2 + dot.delay}s ease-in-out ${dot.delay}s infinite`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Main visual: Document being scanned */}
      <div className="relative" style={{ width: 140, height: 160 }}>
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(74,144,217,0.08))',
            animation: 'glow-breathe 3s ease-in-out infinite',
          }}
        />

        {/* Pulse rings */}
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="absolute rounded-3xl border"
            style={{
              inset: -8 - i * 12,
              borderColor: `rgba(168,85,247,${0.15 - i * 0.04})`,
              animation: `pulse-ring ${2 + i * 0.5}s ease-in-out ${i * 0.4}s infinite`,
            }}
          />
        ))}

        {/* Document card */}
        <div
          className="absolute inset-0 rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: '#161B22',
            border: '1.5px solid rgba(168,85,247,0.3)',
          }}
        >
          {/* Doc header */}
          <div className="px-3 pt-3 pb-2 flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#A855F7]/20 flex items-center justify-center">
              <FileText size={12} color="#A855F7" />
            </div>
            <div className="flex-1">
              <div className="h-1.5 w-14 bg-[#30363D] rounded-full" />
              <div className="h-1 w-8 bg-[#30363D]/50 rounded-full mt-1" />
            </div>
          </div>

          {/* Fake data lines with streaming effect */}
          <div className="flex-1 px-3 py-1 flex flex-col gap-1.5">
            {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
              <div key={i} className="flex items-center gap-1.5">
                <div
                  className="h-1.5 rounded-full"
                  style={{
                    width: `${30 + Math.sin(i * 2.1) * 25}%`,
                    background: progress > (i + 1) * 12
                      ? `rgba(0,217,126,${0.4 + Math.random() * 0.3})`
                      : '#30363D',
                    transition: 'background 0.5s ease',
                  }}
                />
                <div
                  className="h-1.5 rounded-full flex-1"
                  style={{
                    background: progress > (i + 1) * 12
                      ? `rgba(168,85,247,${0.2 + Math.random() * 0.2})`
                      : '#30363D/30',
                    transition: 'background 0.5s ease',
                  }}
                />
              </div>
            ))}
          </div>

          {/* Scan line */}
          <div
            className="absolute left-0 right-0 h-8 pointer-events-none"
            style={{
              animation: 'scan-line 2.5s ease-in-out infinite',
              background: 'linear-gradient(180deg, transparent, rgba(168,85,247,0.15), rgba(0,217,126,0.1), transparent)',
              borderTop: '1px solid rgba(168,85,247,0.5)',
              borderBottom: '1px solid rgba(0,217,126,0.3)',
            }}
          />
        </div>

        {/* AI Brain badge - floating at bottom-right */}
        <div
          className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl flex items-center justify-center z-10"
          style={{
            background: 'linear-gradient(135deg, #A855F7 0%, #7C5CFC 50%, #4A90D9 100%)',
            boxShadow: '0 4px 20px rgba(168,85,247,0.4)',
          }}
        >
          <Brain size={22} color="#FFFFFF" className="animate-pulse" />
        </div>
      </div>

      {/* Stage text with shimmer */}
      <div className="text-center relative z-10">
        <p
          style={{
            fontSize: '17px',
            fontWeight: 700,
            background: 'linear-gradient(90deg, #E6EDF3 0%, #A855F7 25%, #E6EDF3 50%, #4A90D9 75%, #E6EDF3 100%)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: 'text-shimmer 3s linear infinite',
          }}
        >
          IA Processando
        </p>
        <p className="text-[#7D8590] mt-1.5" style={{ fontSize: '12px' }}>
          {stage}
        </p>
      </div>

      {/* Progress bar — redesigned */}
      <div className="w-full max-w-[240px] relative z-10">
        <div className="h-1.5 bg-[#1C2128] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 relative"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #A855F7, #7C5CFC, #4A90D9, #00D97E)',
              backgroundSize: '200% 100%',
            }}
          >
            {/* Shimmer on the bar */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                animation: 'text-shimmer 1.5s linear infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{progress}%</span>
          <span className="text-[#484F58]" style={{ fontSize: '10px' }}>
            {progress < 100 ? 'Analisando...' : 'Concluído!'}
          </span>
        </div>
      </div>

      {/* Steps — horizontal pills */}
      <div className="flex flex-wrap justify-center gap-2 relative z-10">
        {[
          { label: 'Leitura', icon: <ScanLine size={10} />, threshold: 25 },
          { label: 'Extração', icon: <FileText size={10} />, threshold: 50 },
          { label: 'Categorias', icon: <Tag size={10} />, threshold: 75 },
          { label: 'Validação', icon: <CheckCircle2 size={10} />, threshold: 95 },
        ].map((step, i) => {
          const done = progress >= step.threshold;
          const active = progress >= step.threshold - 25 && progress < step.threshold;
          return (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-500"
              style={{
                background: done
                  ? 'rgba(0,217,126,0.1)'
                  : active
                    ? 'rgba(168,85,247,0.15)'
                    : 'rgba(28,33,40,0.8)',
                border: `1px solid ${
                  done
                    ? 'rgba(0,217,126,0.3)'
                    : active
                      ? 'rgba(168,85,247,0.4)'
                      : 'rgba(48,54,61,0.5)'
                }`,
              }}
            >
              <span style={{ color: done ? '#00D97E' : active ? '#A855F7' : '#484F58' }}>
                {done ? <Check size={10} strokeWidth={3} /> : active ? <Loader2 size={10} className="animate-spin" /> : step.icon}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: done || active ? 600 : 400,
                  color: done ? '#00D97E' : active ? '#E6EDF3' : '#484F58',
                }}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function ImportInvoiceModal({ onClose, preselectedCardId, billMonth, billYear, initialFile }: Props) {
  const { cards, categories, showToast, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [selectedCardId, setSelectedCardId] = useState(preselectedCardId || (cards[0]?.id ?? ''));
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [addedCount, setAddedCount] = useState(0);
  // [IMPORT-03] FIX: guard contra duplo clique — desabilita botão enquanto request está em curso
  const [importing, setImporting] = useState(false);

  const selectedCard = cards.find(c => c.id === selectedCardId);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  // Real AI processing via backend
  const startProcessing = useCallback(async (file: File) => {
    setStep('processing');
    setProgress(0);
    setStage('Enviando arquivo para análise...');

    // Animate progress while waiting for API
    let current = 0;
    const stages = [
      { at: 0, text: 'Enviando arquivo para análise...' },
      { at: 20, text: 'Extraindo dados de transações...' },
      { at: 40, text: 'Classificando categorias com IA...' },
      { at: 60, text: 'Verificando duplicatas e validando...' },
    ];
    const interval = setInterval(() => {
      current += Math.random() * 2 + 0.5;
      if (current > 80) current = 80; // Cap at 80% until API responds
      setProgress(Math.round(current));
      const currentStage = [...stages].reverse().find(s => current >= s.at);
      if (currentStage) setStage(currentStage.text);
    }, 100);

    try {
      const result = await invoiceApi.parse(file, selectedCardId);
      clearInterval(interval);
      setProgress(95);
      setStage('Finalizando análise...');

      if (result.data?.transactions?.length) {
        const mapped: ParsedTransaction[] = result.data.transactions.map((t: any, i: number) => ({
          id: `parsed_${Date.now()}_${i}`,
          description: t.description,
          value: t.value,
          date: t.date,
          categoryId: t.categoryId,
          selected: true,
        }));
        setTimeout(() => {
          setProgress(100);
          setParsedTransactions(mapped);
          setStep('review');
        }, 300);
      } else {
        clearInterval(interval);
        setStep('upload');
        showToast({
          type: 'error',
          title: 'Nenhuma transação encontrada',
          message: 'A IA não conseguiu extrair transações deste arquivo.',
          icon: '⚠️',
        });
      }
    } catch (err: any) {
      clearInterval(interval);
      setStep('upload');
      showToast({
        type: 'error',
        title: 'Erro ao processar fatura',
        message: err.message || 'Tente novamente',
        icon: '❌',
      });
    }
  }, [selectedCardId, showToast]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploadedFile(file);
      startProcessing(file);
    }
  };

  // Dispara processamento automático quando um arquivo é entregue via prop
  // (caso de uso: Web Share Target da PWA). Só roda se já houver cartão selecionado.
  const initialFileHandled = useRef(false);
  useEffect(() => {
    if (!initialFile || initialFileHandled.current) return;
    if (!selectedCardId) return;
    initialFileHandled.current = true;
    setFileName(initialFile.name);
    setUploadedFile(initialFile);
    startProcessing(initialFile);
  }, [initialFile, selectedCardId, startProcessing]);

  const toggleTransaction = (id: string) => {
    setParsedTransactions(prev =>
      prev.map(t => t.id === id ? { ...t, selected: !t.selected } : t)
    );
  };

  const selectAll = () => {
    const allSelected = parsedTransactions.every(t => t.selected);
    setParsedTransactions(prev =>
      prev.map(t => ({ ...t, selected: !allSelected }))
    );
  };

  const removeTransaction = (id: string) => {
    setParsedTransactions(prev => prev.filter(t => t.id !== id));
  };

  const selectedTotal = parsedTransactions
    .filter(t => t.selected)
    .reduce((s, t) => s + t.value, 0);

  const selectedCount = parsedTransactions.filter(t => t.selected).length;

  const handleConfirmImport = async () => {
    // [IMPORT-03] FIX: evitar duplo clique que causaria importação duplicada
    if (importing) return;
    const toImport = parsedTransactions.filter(t => t.selected);
    setImporting(true);
    try {
      const result = await invoiceApi.importTransactions(
        selectedCardId,
        toImport.map(t => ({
          description: t.description,
          value: t.value,
          date: t.date,
          categoryId: t.categoryId,
        })),
        billMonth,
        billYear,
      );
      const importedCount = result.data?.imported || toImport.length;
      setAddedCount(importedCount);
      // [IMPORT-02] FIX: aguardar refreshData antes de avançar para step 'success',
      // para que cartões e transações reflitam os valores atualizados na tela de confirmação
      await refreshData();
      setStep('success');
      showToast({
        type: 'success',
        title: 'Fatura importada com IA',
        message: `${importedCount} transações adicionadas ao ${selectedCard?.name || 'cartão'}`,
        icon: '🤖',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Erro ao importar',
        message: err.message || 'Tente novamente',
        icon: '❌',
      });
    } finally {
      setImporting(false);
    }
  };

  const getCategoryInfo = (catId: string) => {
    return categories.find(c => c.id === catId) || { icon: '📦', label: 'Outros', color: '#7D8590' };
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="w-full max-w-[430px] bg-[#0D1117] rounded-t-3xl border-t border-[#30363D] overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #4A90D9 100%)',
              }}
            >
              {step === 'success' ? (
                <CheckCircle2 size={20} color="#FFFFFF" />
              ) : (
                <Sparkles size={20} color="#FFFFFF" />
              )}
            </div>
            <div key={step}>
              <h3 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
                {step === 'upload' ? 'Importar Fatura' : step === 'processing' ? 'Analisando...' : step === 'review' ? 'Revisar Transações' : 'Importação Concluída'}
              </h3>
              <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                {step === 'upload' ? 'IA detecta transações automaticamente' : step === 'processing' ? fileName : step === 'review' ? `${parsedTransactions.length} transações detectadas` : `${addedCount} transações adicionadas`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#161B22] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* ═══ UPLOAD STEP ═══ */}
          {step === 'upload' && (
            <div className="px-5 py-5 flex flex-col gap-5">
              {/* Card selector */}
              <div>
                <label className="text-[#7D8590] mb-2 block" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Cartão de destino
                </label>
                <button
                  onClick={() => setShowCardPicker(!showCardPicker)}
                  className="w-full flex items-center gap-3 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-3 text-left active:bg-[#1C2128]"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: selectedCard ? selectedCard.color + '25' : '#1C2128' }}
                  >
                    <CreditCardIcon size={16} color={selectedCard?.color || '#7D8590'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[#E6EDF3] truncate" style={{ fontSize: '14px', fontWeight: 500 }}>
                      {selectedCard?.name || 'Selecione um cartão'}
                    </p>
                    {selectedCard && (
                      <p className="text-[#484F58]" style={{ fontSize: '11px' }}>
                        •••• {selectedCard.lastDigits} · {selectedCard.brand.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <ChevronDown
                    size={16}
                    color="#484F58"
                    style={{
                      transform: showCardPicker ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                  />
                </button>

                {/* Dropdown */}
                {showCardPicker && (
                  <div className="mt-2 bg-[#161B22] border border-[#30363D] rounded-xl overflow-hidden">
                    {cards.map(card => (
                      <button
                        key={card.id}
                        onClick={() => {
                          setSelectedCardId(card.id);
                          setShowCardPicker(false);
                        }}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-[#1C2128] transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(48,54,61,0.5)',
                          background: card.id === selectedCardId ? '#1C2128' : 'transparent',
                        }}
                      >
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ background: card.color + '25' }}
                        >
                          <CreditCardIcon size={14} color={card.color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[#E6EDF3] truncate" style={{ fontSize: '13px', fontWeight: 500 }}>
                            {card.name}
                          </p>
                          <p className="text-[#484F58]" style={{ fontSize: '10px' }}>
                            •••• {card.lastDigits}
                          </p>
                        </div>
                        {card.id === selectedCardId && (
                          <Check size={14} color="#00D97E" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload area */}
              <div>
                <label className="text-[#7D8590] mb-2 block" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Arquivo da fatura
                </label>
                {cards.length === 0 && (
                  <div
                    className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
                    style={{ background: 'rgba(255,165,2,0.08)', border: '1px solid rgba(255,165,2,0.25)' }}
                  >
                    <AlertTriangle size={16} color="#FFA502" />
                    <p style={{ fontSize: '12px', color: '#FFA502' }}>
                      Nenhum cartão cadastrado. Cadastre um cartão antes de importar uma fatura.
                    </p>
                  </div>
                )}
                <button
                  onClick={() => cards.length > 0 && fileInputRef.current?.click()}
                  disabled={cards.length === 0}
                  className="w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 border-dashed border-[#30363D] bg-[#161B22]/50 active:bg-[#1C2128] active:border-[#A855F7]/50 transition-all"
                  style={{ opacity: cards.length === 0 ? 0.4 : 1, cursor: cards.length === 0 ? 'not-allowed' : 'pointer' }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(74,144,217,0.15))',
                      border: '1.5px solid rgba(168,85,247,0.3)',
                    }}
                  >
                    <FileUp size={28} color="#A855F7" />
                  </div>
                  <div className="text-center">
                    <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
                      Toque para selecionar arquivo
                    </p>
                    <p className="text-[#484F58] mt-1" style={{ fontSize: '12px' }}>
                      PDF, CSV, OFX ou imagem da fatura
                    </p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20">
                    <Sparkles size={12} color="#A855F7" />
                    <span className="text-[#A855F7]" style={{ fontSize: '11px', fontWeight: 600 }}>
                      IA identifica automaticamente
                    </span>
                  </div>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.csv,.ofx,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* Info box */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4A90D9]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain size={16} color="#4A90D9" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Como funciona?
                    </p>
                    <div className="flex flex-col gap-2 mt-2">
                      {[
                        { icon: <ScanLine size={12} />, text: 'A IA lê e interpreta o arquivo' },
                        { icon: <Tag size={12} />, text: 'Classifica categorias automaticamente' },
                        { icon: <AlertTriangle size={12} />, text: 'Você revisa antes de confirmar' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-[#484F58]">{item.icon}</span>
                          <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Supported formats */}
              <div className="flex flex-wrap gap-2 justify-center">
                {['PDF', 'CSV', 'OFX', 'JPG', 'PNG'].map(fmt => (
                  <span
                    key={fmt}
                    className="px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#30363D] text-[#484F58]"
                    style={{ fontSize: '10px', fontWeight: 600, letterSpacing: 0.5 }}
                  >
                    .{fmt}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ═══ PROCESSING STEP ═══ */}
          {step === 'processing' && (
            <ProcessingAnimation progress={progress} stage={stage} />
          )}

          {/* ═══ REVIEW STEP ═══ */}
          {step === 'review' && (
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Summary bar */}
              <div
                className="rounded-2xl p-4"
                style={{
                  background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(74,144,217,0.08))',
                  border: '1px solid rgba(168,85,247,0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} color="#A855F7" />
                    <span className="text-[#A855F7]" style={{ fontSize: '12px', fontWeight: 600 }}>
                      Resultado da IA
                    </span>
                  </div>
                  <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                    {fileName}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-[#0D1117]/60 rounded-xl p-2.5 text-center">
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {parsedTransactions.length}
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Detectadas</p>
                  </div>
                  <div className="bg-[#0D1117]/60 rounded-xl p-2.5 text-center">
                    <p className="text-[#00D97E]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      {selectedCount}
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Selecionadas</p>
                  </div>
                  <div className="bg-[#0D1117]/60 rounded-xl p-2.5 text-center">
                    <p className="text-[#FF4757]" style={{ fontSize: '14px', fontWeight: 700 }}>
                      {formatCurrency(selectedTotal)}
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Total</p>
                  </div>
                </div>
              </div>

              {/* Card destination */}
              {selectedCard && (
                <div className="flex items-center gap-3 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-2.5">
                  <CreditCardIcon size={14} color={selectedCard.color} />
                  <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>Cartão:</span>
                  <span className="text-[#E6EDF3]" style={{ fontSize: '12px', fontWeight: 600 }}>
                    {selectedCard.name} •••• {selectedCard.lastDigits}
                  </span>
                </div>
              )}

              {/* Select all */}
              <div className="flex items-center justify-between">
                <p className="text-[#7D8590]" style={{ fontSize: '12px', fontWeight: 500 }}>
                  Transações detectadas
                </p>
                <button
                  onClick={selectAll}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#30363D] text-[#7D8590] active:bg-[#1C2128]"
                  style={{ fontSize: '11px' }}
                >
                  <Check size={12} />
                  {parsedTransactions.every(t => t.selected) ? 'Desmarcar tudo' : 'Selecionar tudo'}
                </button>
              </div>

              {/* Transaction list */}
              <div className="flex flex-col gap-2">
                {parsedTransactions.map(tx => {
                  const catInfo = getCategoryInfo(tx.categoryId);
                  return (
                    <div
                      key={tx.id}
                      className="flex items-center gap-3 bg-[#161B22] border rounded-2xl px-4 py-3 transition-all"
                      style={{
                        borderColor: tx.selected ? 'rgba(0,217,126,0.3)' : '#30363D',
                        opacity: tx.selected ? 1 : 0.5,
                      }}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTransaction(tx.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
                        style={{
                          background: tx.selected ? '#00D97E' : '#1C2128',
                          border: tx.selected ? 'none' : '1.5px solid #30363D',
                        }}
                      >
                        {tx.selected && <Check size={12} color="#000" strokeWidth={3} />}
                      </button>

                      {/* Category icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: catInfo.color + '20' }}
                      >
                        <span style={{ fontSize: '16px' }}>{catInfo.icon}</span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E6EDF3] truncate" style={{ fontSize: '13px', fontWeight: 500 }}>
                          {tx.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[#484F58]" style={{ fontSize: '10px' }}>
                            {new Date(tx.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                          </span>
                          <span className="text-[#484F58]">·</span>
                          <span style={{ fontSize: '10px', color: catInfo.color }}>{catInfo.label}</span>
                        </div>
                      </div>

                      {/* Value */}
                      <p className="text-[#FF4757] shrink-0" style={{ fontSize: '13px', fontWeight: 700 }}>
                        -{formatCurrency(tx.value)}
                      </p>

                      {/* Remove */}
                      <button
                        onClick={() => removeTransaction(tx.id)}
                        className="w-7 h-7 rounded-lg bg-[#0D1117] flex items-center justify-center text-[#FF4757]/40 active:text-[#FF4757] shrink-0"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {parsedTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>
                    Todas as transações foram removidas
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ═══ SUCCESS STEP ═══ */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 px-6 gap-5">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center"
                style={{
                  background: 'rgba(0,217,126,0.15)',
                  border: '2px solid rgba(0,217,126,0.4)',
                }}
              >
                <CheckCircle2 size={36} color="#00D97E" />
              </div>

              <div className="text-center">
                <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                  Importação Concluída!
                </p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '14px' }}>
                  {addedCount} transações foram adicionadas
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <p className="text-[#00D97E]" style={{ fontSize: '22px', fontWeight: 700 }}>{addedCount}</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Lançadas</p>
                </div>
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <p className="text-[#FF4757]" style={{ fontSize: '16px', fontWeight: 700 }}>
                    {formatCurrency(selectedTotal)}
                  </p>
                  <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Total</p>
                </div>
              </div>

              {selectedCard && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#161B22] border border-[#30363D]">
                  <CreditCardIcon size={14} color={selectedCard.color} />
                  <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                    Lançado em {selectedCard.name} •••• {selectedCard.lastDigits}
                  </span>
                </div>
              )}

              <button
                onClick={onClose}
                className="w-full max-w-[260px] py-3.5 rounded-2xl bg-[#00D97E] text-black active:scale-[0.98] transition-all"
                style={{ fontWeight: 700, fontSize: '14px' }}
              >
                Concluído
              </button>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step === 'review' && parsedTransactions.length > 0 && (
          <div className="px-5 py-4 border-t border-[#30363D] bg-[#0D1117]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                {selectedCount} de {parsedTransactions.length} selecionadas
              </span>
              <span className="text-[#FF4757]" style={{ fontSize: '14px', fontWeight: 700 }}>
                {formatCurrency(selectedTotal)}
              </span>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={selectedCount === 0 || importing}
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
              style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #4A90D9 100%)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              <Sparkles size={16} />
              {importing ? 'Processando...' : `Importar ${selectedCount} Transações`}
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}