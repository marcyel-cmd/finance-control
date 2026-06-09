import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Upload, Sparkles, Check, Trash2, ChevronDown,
  AlertTriangle, Brain, ScanLine, CheckCircle2, Loader2,
  CreditCard as CreditCardIcon, Tag, Calendar, Image,
  AlertCircle, Copy, ArrowRight, Camera, FileImage,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { smartImportApi, SmartImportTransaction, SmartImportSavePayload } from '../../services/smartImport.api';

interface Props {
  onClose: () => void;
}

type Step = 'upload' | 'processing' | 'review' | 'success';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

const formatDate = (d: string) =>
  new Date(d + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

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
      <style>{`
        @keyframes float-particle { 0%, 100% { transform: translateY(0px) scale(1); opacity: 0.3; } 50% { transform: translateY(-20px) scale(1.5); opacity: 0.8; } }
        @keyframes scan-line { 0% { top: 10%; opacity: 0; } 10% { opacity: 1; } 90% { opacity: 1; } 100% { top: 85%; opacity: 0; } }
        @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.6; } 50% { transform: scale(1.2); opacity: 0; } 100% { transform: scale(0.8); opacity: 0.6; } }
        @keyframes glow-breathe { 0%, 100% { box-shadow: 0 0 20px rgba(168,85,247,0.2), 0 0 60px rgba(168,85,247,0.1); } 50% { box-shadow: 0 0 30px rgba(168,85,247,0.4), 0 0 80px rgba(168,85,247,0.2); } }
        @keyframes text-shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
      `}</style>

      <div className="absolute inset-0 pointer-events-none">
        {dots.map(dot => (
          <div
            key={dot.id}
            className="absolute rounded-full"
            style={{
              left: `${dot.x}%`, top: `${dot.y}%`,
              width: dot.size, height: dot.size, background: dot.color,
              animation: `float-particle ${2 + dot.delay}s ease-in-out ${dot.delay}s infinite`, opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Main icon */}
      <div className="relative" style={{ width: 120, height: 120 }}>
        <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(74,144,217,0.08))', animation: 'glow-breathe 3s ease-in-out infinite' }} />
        {[0, 1, 2].map(i => (
          <div key={i} className="absolute rounded-3xl border" style={{ inset: -8 - i * 12, borderColor: `rgba(168,85,247,${0.15 - i * 0.04})`, animation: `pulse-ring ${2 + i * 0.5}s ease-in-out ${i * 0.4}s infinite` }} />
        ))}
        <div className="absolute inset-0 rounded-2xl overflow-hidden flex items-center justify-center" style={{ background: '#161B22', border: '1.5px solid rgba(168,85,247,0.3)' }}>
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-8 h-10 rounded bg-[#30363D]/50 flex items-center justify-center" style={{ transform: `rotate(${(i - 1) * 8}deg)` }}>
                <Image size={14} color="#7D8590" />
              </div>
            ))}
          </div>
        </div>
        <div className="absolute -bottom-3 -right-3 w-12 h-12 rounded-xl flex items-center justify-center z-10" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C5CFC 50%, #4A90D9 100%)', boxShadow: '0 4px 20px rgba(168,85,247,0.4)' }}>
          <Brain size={22} color="#FFFFFF" className="animate-pulse" />
        </div>
      </div>

      {/* Stage text */}
      <div className="text-center relative z-10">
        <p style={{ fontSize: '17px', fontWeight: 700, background: 'linear-gradient(90deg, #E6EDF3 0%, #A855F7 25%, #E6EDF3 50%, #4A90D9 75%, #E6EDF3 100%)', backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', animation: 'text-shimmer 3s linear infinite' }}>
          IA Processando
        </p>
        <p className="text-[#7D8590] mt-1.5" style={{ fontSize: '12px' }}>{stage}</p>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[240px] relative z-10">
        <div className="h-1.5 bg-[#1C2128] rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300 relative" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #A855F7, #7C5CFC, #4A90D9, #00D97E)', backgroundSize: '200% 100%' }}>
            <div className="absolute inset-0 rounded-full" style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)', animation: 'text-shimmer 1.5s linear infinite', backgroundSize: '200% 100%' }} />
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{progress}%</span>
          <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{progress < 100 ? 'Analisando...' : 'Concluído!'}</span>
        </div>
      </div>

      {/* Steps pills */}
      <div className="flex flex-wrap justify-center gap-2 relative z-10">
        {[
          { label: 'Leitura', icon: <ScanLine size={10} />, threshold: 20 },
          { label: 'Extração', icon: <Tag size={10} />, threshold: 40 },
          { label: 'Categorias', icon: <Tag size={10} />, threshold: 60 },
          { label: 'Duplicatas', icon: <Copy size={10} />, threshold: 80 },
          { label: 'Validação', icon: <CheckCircle2 size={10} />, threshold: 95 },
        ].map((s, i) => {
          const done = progress >= s.threshold;
          const active = progress >= s.threshold - 20 && progress < s.threshold;
          return (
            <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-500" style={{ background: done ? 'rgba(0,217,126,0.1)' : active ? 'rgba(168,85,247,0.15)' : 'rgba(28,33,40,0.8)', border: `1px solid ${done ? 'rgba(0,217,126,0.3)' : active ? 'rgba(168,85,247,0.4)' : 'rgba(48,54,61,0.5)'}` }}>
              <span style={{ color: done ? '#00D97E' : active ? '#A855F7' : '#484F58' }}>
                {done ? <Check size={10} strokeWidth={3} /> : active ? <Loader2 size={10} className="animate-spin" /> : s.icon}
              </span>
              <span style={{ fontSize: '10px', fontWeight: done || active ? 600 : 400, color: done ? '#00D97E' : active ? '#E6EDF3' : '#484F58' }}>{s.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Transaction Review Item ─────────────────────────────────────────────────

interface ReviewItemProps {
  tx: SmartImportTransaction & { selected: boolean };
  onToggle: () => void;
  onRemove: () => void;
  categories: { id: string; label: string; icon: string; color: string }[];
  cards: { id: string; name: string; lastDigits: string; color: string }[];
  onSetCard: (cardId: string) => void;
  onSetInstallmentAction: (action: 'current' | 'remaining') => void;
}

function ReviewItem({ tx, onToggle, onRemove, categories, cards, onSetCard, onSetInstallmentAction }: ReviewItemProps) {
  const [showInstallmentOptions, setShowInstallmentOptions] = useState(false);
  const catInfo = categories.find(c => c.id === tx.categoryId) || { icon: '📦', label: 'Outros', color: '#7D8590' };

  const statusColors = {
    new: { bg: 'rgba(0,217,126,0.08)', border: 'rgba(0,217,126,0.3)', text: '#00D97E', label: '✅ Nova' },
    duplicate: { bg: 'rgba(255,71,87,0.08)', border: 'rgba(255,71,87,0.3)', text: '#FF4757', label: '⛔ Duplicada' },
    possible_duplicate: { bg: 'rgba(255,165,2,0.08)', border: 'rgba(255,165,2,0.3)', text: '#FFA502', label: '⚠️ Possível duplicata' },
  };

  const status = statusColors[tx.duplicateStatus];

  return (
    <div
      className="bg-[#161B22] border rounded-2xl overflow-hidden transition-all"
      style={{ borderColor: tx.selected ? status.border : '#30363D', opacity: tx.selected ? 1 : 0.5 }}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Checkbox */}
        <button
          onClick={onToggle}
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all"
          style={{ background: tx.selected ? '#00D97E' : '#1C2128', border: tx.selected ? 'none' : '1.5px solid #30363D' }}
        >
          {tx.selected && <Check size={12} color="#000" strokeWidth={3} />}
        </button>

        {/* Category icon */}
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: catInfo.color + '20' }}>
          <span style={{ fontSize: '16px' }}>{catInfo.icon}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-[#E6EDF3] truncate" style={{ fontSize: '13px', fontWeight: 500 }}>{tx.description}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{formatDate(tx.date)}</span>
            <span className="text-[#484F58]">·</span>
            <span style={{ fontSize: '10px', color: catInfo.color }}>{catInfo.label}</span>
            {tx.paymentMethodGuess && (
              <>
                <span className="text-[#484F58]">·</span>
                <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{tx.paymentMethodGuess}</span>
              </>
            )}
          </div>
        </div>

        {/* Value */}
        <p className="shrink-0" style={{ fontSize: '13px', fontWeight: 700, color: tx.type === 'entrada' ? '#00D97E' : '#FF4757' }}>
          {tx.type === 'entrada' ? '+' : '-'}{formatCurrency(tx.value)}
        </p>

        {/* Remove */}
        <button onClick={onRemove} className="w-7 h-7 rounded-lg bg-[#0D1117] flex items-center justify-center text-[#FF4757]/40 active:text-[#FF4757] shrink-0">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Status badge */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <span
          className="px-2.5 py-1 rounded-lg"
          style={{ fontSize: '10px', fontWeight: 600, background: status.bg, border: `1px solid ${status.border}`, color: status.text }}
        >
          {status.label}
        </span>

        {tx.duplicateStatus !== 'new' && tx.duplicateReason && (
          <span className="text-[#7D8590]" style={{ fontSize: '10px' }}>
            {tx.duplicateReason}
          </span>
        )}

        {/* Installment badge */}
        {tx.isInstallment && (
          <button
            onClick={() => setShowInstallmentOptions(!showInstallmentOptions)}
            className="px-2.5 py-1 rounded-lg flex items-center gap-1"
            style={{ fontSize: '10px', fontWeight: 600, background: 'rgba(74,144,217,0.1)', border: '1px solid rgba(74,144,217,0.3)', color: '#4A90D9' }}
          >
            🔵 Parcela {tx.currentInstallment}/{tx.totalInstallments}
            <ChevronDown size={10} />
          </button>
        )}
      </div>

      {/* Installment options */}
      {tx.isInstallment && showInstallmentOptions && (
        <div className="px-4 pb-3 flex flex-col gap-2">
          <div className="bg-[#0D1117] rounded-xl p-3 border border-[#30363D]">
            <p className="text-[#7D8590] mb-2" style={{ fontSize: '11px', fontWeight: 500 }}>Como lançar esta parcela?</p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { onSetInstallmentAction('current'); setShowInstallmentOptions(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-left active:bg-[#1C2128]"
              >
                <span style={{ fontSize: '12px' }}>1️⃣</span>
                <span className="text-[#E6EDF3]" style={{ fontSize: '12px' }}>Só esta parcela ({tx.currentInstallment}/{tx.totalInstallments})</span>
              </button>
              <button
                onClick={() => { onSetInstallmentAction('remaining'); setShowInstallmentOptions(false); }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#161B22] border border-[#30363D] text-left active:bg-[#1C2128]"
              >
                <span style={{ fontSize: '12px' }}>📋</span>
                <span className="text-[#E6EDF3]" style={{ fontSize: '12px' }}>
                  Parcelas restantes ({tx.currentInstallment} até {tx.totalInstallments})
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

export function SmartImportModal({ onClose }: Props) {
  const { cards, categories, showToast, refreshData } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('upload');
  const [files, setFiles] = useState<File[]>([]);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');
  const [parsedTransactions, setParsedTransactions] = useState<(SmartImportTransaction & { selected: boolean; cardId?: string; installmentAction?: 'current' | 'remaining' })[]>([]);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [importing, setImporting] = useState(false);

  // ── Upload handling ──
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ── Processing ──
  const startProcessing = useCallback(async () => {
    if (files.length === 0) return;
    setStep('processing');
    setProgress(0);
    setStage('Enviando imagens para análise...');

    let current = 0;
    const stages = [
      { at: 0, text: 'Enviando imagens para análise...' },
      { at: 15, text: `Lendo ${files.length} ${files.length > 1 ? 'imagens' : 'imagem'}...` },
      { at: 30, text: 'Extraindo transações com IA...' },
      { at: 50, text: 'Identificando parcelas...' },
      { at: 65, text: 'Verificando duplicatas no banco...' },
      { at: 80, text: 'Comparando descrições com Gemini...' },
    ];
    const interval = setInterval(() => {
      current += Math.random() * 1.5 + 0.3;
      if (current > 85) current = 85;
      setProgress(Math.round(current));
      const currentStage = [...stages].reverse().find(s => current >= s.at);
      if (currentStage) setStage(currentStage.text);
    }, 150);

    try {
      const result = await smartImportApi.parse(files);
      clearInterval(interval);
      setProgress(95);
      setStage('Finalizando...');

      if (result.data?.transactions?.length) {
        const mapped = result.data.transactions.map(tx => ({
          ...tx,
          selected: tx.duplicateStatus !== 'duplicate', // Auto-deselect duplicates
        }));
        setTimeout(() => {
          setProgress(100);
          setParsedTransactions(mapped);
          setStep('review');
        }, 400);
      } else {
        clearInterval(interval);
        setStep('upload');
        showToast({ type: 'error', title: 'Nenhuma transação encontrada', message: 'A IA não conseguiu extrair transações das imagens.', icon: '⚠️' });
      }
    } catch (err: any) {
      clearInterval(interval);
      setStep('upload');
      showToast({ type: 'error', title: 'Erro ao processar', message: err.message || 'Tente novamente', icon: '❌' });
    }
  }, [files, showToast]);

  // ── Review actions ──
  const toggleTransaction = (index: number) => {
    setParsedTransactions(prev => prev.map((t, i) => i === index ? { ...t, selected: !t.selected } : t));
  };

  const removeTransaction = (index: number) => {
    setParsedTransactions(prev => prev.filter((_, i) => i !== index));
  };

  const selectAllNew = () => {
    setParsedTransactions(prev => prev.map(t => ({ ...t, selected: t.duplicateStatus === 'new' || t.duplicateStatus === 'possible_duplicate' })));
  };

  const setCardForTransaction = (index: number, cardId: string) => {
    setParsedTransactions(prev => prev.map((t, i) => i === index ? { ...t, cardId } : t));
  };

  const setInstallmentAction = (index: number, action: 'current' | 'remaining') => {
    setParsedTransactions(prev => prev.map((t, i) => i === index ? { ...t, installmentAction: action } : t));
  };

  // ── Import ──
  const handleConfirmImport = async () => {
    if (importing) return;
    const toImport = parsedTransactions.filter(t => t.selected);
    if (toImport.length === 0) return;

    setImporting(true);
    try {
      const payload: SmartImportSavePayload[] = toImport.map(tx => ({
        description: tx.description,
        value: tx.value,
        date: tx.date,
        type: tx.type,
        categoryId: tx.categoryId,
        paymentMethod: tx.paymentMethodGuess || 'pix',
        cardId: tx.cardId || undefined,
        isInstallment: tx.isInstallment && (tx.installmentAction === 'remaining'),
        currentInstallment: tx.currentInstallment,
        totalInstallments: tx.totalInstallments,
        status: 'realizado',
      }));

      const result = await smartImportApi.save(payload);
      setImportResult({ imported: result.data.imported, skipped: result.data.skipped });
      await refreshData();
      setStep('success');
      showToast({
        type: 'success',
        title: 'Importação inteligente concluída',
        message: `${result.data.imported} transações adicionadas`,
        icon: '🤖',
      });
    } catch (err: any) {
      showToast({ type: 'error', title: 'Erro ao importar', message: err.message || 'Tente novamente', icon: '❌' });
    } finally {
      setImporting(false);
    }
  };

  // ── Computed values ──
  const selectedTransactions = parsedTransactions.filter(t => t.selected);
  const selectedTotal = selectedTransactions.reduce((s, t) => s + t.value, 0);
  const newCount = parsedTransactions.filter(t => t.duplicateStatus === 'new').length;
  const dupCount = parsedTransactions.filter(t => t.duplicateStatus === 'duplicate').length;
  const possibleCount = parsedTransactions.filter(t => t.duplicateStatus === 'possible_duplicate').length;

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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #A855F7 0%, #7C5CFC 50%, #4A90D9 100%)' }}>
              {step === 'success' ? <CheckCircle2 size={20} color="#FFFFFF" /> : <Brain size={20} color="#FFFFFF" />}
            </div>
            <div>
              <h3 className="text-[#E6EDF3]" style={{ fontSize: '17px', fontWeight: 700 }}>
                {step === 'upload' ? 'Importação Inteligente' : step === 'processing' ? 'Analisando...' : step === 'review' ? 'Revisar Transações' : 'Importação Concluída'}
              </h3>
              <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                {step === 'upload' ? 'Screenshots do extrato → transações' : step === 'processing' ? `${files.length} ${files.length > 1 ? 'imagens' : 'imagem'}` : step === 'review' ? `${parsedTransactions.length} transações encontradas` : `${importResult?.imported || 0} transações adicionadas`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-[#161B22] flex items-center justify-center text-[#7D8590] active:bg-[#30363D]">
            <X size={16} />
          </button>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto">

          {/* ═══ UPLOAD STEP ═══ */}
          {step === 'upload' && (
            <div className="px-5 py-5 flex flex-col gap-5">
              {/* Upload area */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-4 py-10 rounded-2xl border-2 border-dashed border-[#30363D] bg-[#161B22]/50 active:bg-[#1C2128] active:border-[#A855F7]/50 transition-all"
              >
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(74,144,217,0.15))', border: '1.5px solid rgba(168,85,247,0.3)' }}>
                  <Camera size={28} color="#A855F7" />
                </div>
                <div className="text-center">
                  <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
                    Toque para adicionar imagens
                  </p>
                  <p className="text-[#484F58] mt-1" style={{ fontSize: '12px' }}>
                    Screenshots do extrato, comprovantes, faturas
                  </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#A855F7]/10 border border-[#A855F7]/20">
                  <Sparkles size={12} color="#A855F7" />
                  <span className="text-[#A855F7]" style={{ fontSize: '11px', fontWeight: 600 }}>Até 5 imagens por vez</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.heic,.pdf"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Selected files */}
              {files.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-[#7D8590]" style={{ fontSize: '12px', fontWeight: 500 }}>
                    {files.length} {files.length > 1 ? 'arquivos selecionados' : 'arquivo selecionado'}
                  </p>
                  {files.map((file, i) => (
                    <div key={i} className="flex items-center gap-3 bg-[#161B22] border border-[#30363D] rounded-xl px-4 py-2.5">
                      <FileImage size={16} color="#A855F7" />
                      <span className="flex-1 text-[#E6EDF3] truncate" style={{ fontSize: '12px' }}>{file.name}</span>
                      <span className="text-[#484F58]" style={{ fontSize: '10px' }}>{(file.size / 1024).toFixed(0)} KB</span>
                      <button onClick={() => removeFile(i)} className="text-[#FF4757]/50 active:text-[#FF4757]">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Supported types info */}
              <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#4A90D9]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Brain size={16} color="#4A90D9" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>O que posso enviar?</p>
                    <div className="flex flex-col gap-2 mt-2">
                      {[
                        { text: 'Screenshot do extrato bancário' },
                        { text: 'Screenshot da fatura do cartão' },
                        { text: 'Comprovante PIX / transferência' },
                        { text: 'Foto de cupom fiscal / nota' },
                        { text: 'PDF do extrato' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Check size={10} color="#00D97E" />
                          <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <Copy size={16} color="#FFA502" className="mx-auto mb-1" />
                  <p className="text-[#E6EDF3]" style={{ fontSize: '11px', fontWeight: 600 }}>Detecta duplicatas</p>
                  <p className="text-[#484F58]" style={{ fontSize: '10px' }}>Evita lançar 2x</p>
                </div>
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <Calendar size={16} color="#4A90D9" className="mx-auto mb-1" />
                  <p className="text-[#E6EDF3]" style={{ fontSize: '11px', fontWeight: 600 }}>Identifica parcelas</p>
                  <p className="text-[#484F58]" style={{ fontSize: '10px' }}>Lança automaticamente</p>
                </div>
              </div>

              {/* Start button */}
              {files.length > 0 && (
                <button
                  onClick={startProcessing}
                  className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  style={{ background: 'linear-gradient(135deg, #A855F7 0%, #4A90D9 100%)', fontWeight: 700, fontSize: '14px' }}
                >
                  <Sparkles size={16} />
                  Analisar com IA
                </button>
              )}
            </div>
          )}

          {/* ═══ PROCESSING STEP ═══ */}
          {step === 'processing' && (
            <ProcessingAnimation progress={progress} stage={stage} />
          )}

          {/* ═══ REVIEW STEP ═══ */}
          {step === 'review' && (
            <div className="px-5 py-4 flex flex-col gap-4">
              {/* Summary */}
              <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.12), rgba(74,144,217,0.08))', border: '1px solid rgba(168,85,247,0.2)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} color="#A855F7" />
                  <span className="text-[#A855F7]" style={{ fontSize: '12px', fontWeight: 600 }}>Resultado da IA</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-[#0D1117]/60 rounded-xl p-2 text-center">
                    <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 700 }}>{parsedTransactions.length}</p>
                    <p className="text-[#7D8590]" style={{ fontSize: '9px' }}>Total</p>
                  </div>
                  <div className="bg-[#0D1117]/60 rounded-xl p-2 text-center">
                    <p className="text-[#00D97E]" style={{ fontSize: '16px', fontWeight: 700 }}>{newCount}</p>
                    <p className="text-[#7D8590]" style={{ fontSize: '9px' }}>Novas</p>
                  </div>
                  <div className="bg-[#0D1117]/60 rounded-xl p-2 text-center">
                    <p className="text-[#FFA502]" style={{ fontSize: '16px', fontWeight: 700 }}>{possibleCount}</p>
                    <p className="text-[#7D8590]" style={{ fontSize: '9px' }}>Possíveis dup.</p>
                  </div>
                  <div className="bg-[#0D1117]/60 rounded-xl p-2 text-center">
                    <p className="text-[#FF4757]" style={{ fontSize: '16px', fontWeight: 700 }}>{dupCount}</p>
                    <p className="text-[#7D8590]" style={{ fontSize: '9px' }}>Duplicadas</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <p className="text-[#7D8590]" style={{ fontSize: '12px', fontWeight: 500 }}>Transações</p>
                <button
                  onClick={selectAllNew}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161B22] border border-[#30363D] text-[#7D8590] active:bg-[#1C2128]"
                  style={{ fontSize: '11px' }}
                >
                  <Check size={12} />
                  Selecionar novas
                </button>
              </div>

              {/* Transaction list */}
              <div className="flex flex-col gap-2">
                {parsedTransactions.map((tx, index) => (
                  <ReviewItem
                    key={index}
                    tx={tx}
                    onToggle={() => toggleTransaction(index)}
                    onRemove={() => removeTransaction(index)}
                    categories={categories}
                    cards={cards}
                    onSetCard={(cardId) => setCardForTransaction(index, cardId)}
                    onSetInstallmentAction={(action) => setInstallmentAction(index, action)}
                  />
                ))}
              </div>

              {parsedTransactions.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>Todas as transações foram removidas</p>
                </div>
              )}
            </div>
          )}

          {/* ═══ SUCCESS STEP ═══ */}
          {step === 'success' && (
            <div className="flex flex-col items-center justify-center py-12 px-6 gap-5">
              <div className="w-20 h-20 rounded-3xl flex items-center justify-center" style={{ background: 'rgba(0,217,126,0.15)', border: '2px solid rgba(0,217,126,0.4)' }}>
                <CheckCircle2 size={36} color="#00D97E" />
              </div>
              <div className="text-center">
                <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>Importação Concluída!</p>
                <p className="text-[#7D8590] mt-1" style={{ fontSize: '14px' }}>
                  {importResult?.imported || 0} transações foram adicionadas
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 w-full max-w-[260px]">
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <p className="text-[#00D97E]" style={{ fontSize: '22px', fontWeight: 700 }}>{importResult?.imported || 0}</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Importadas</p>
                </div>
                <div className="bg-[#161B22] border border-[#30363D] rounded-xl p-3 text-center">
                  <p className="text-[#7D8590]" style={{ fontSize: '22px', fontWeight: 700 }}>{importResult?.skipped || 0}</p>
                  <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>Puladas</p>
                </div>
              </div>
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

        {/* Footer */}
        {step === 'review' && parsedTransactions.length > 0 && (
          <div className="px-5 py-4 border-t border-[#30363D] bg-[#0D1117]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                {selectedTransactions.length} de {parsedTransactions.length} selecionadas
              </span>
              <span className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 700 }}>
                {formatCurrency(selectedTotal)}
              </span>
            </div>
            <button
              onClick={handleConfirmImport}
              disabled={selectedTransactions.length === 0 || importing}
              className="w-full py-3.5 rounded-2xl text-white flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #A855F7 0%, #4A90D9 100%)', fontWeight: 700, fontSize: '14px' }}
            >
              <Sparkles size={16} />
              {importing ? 'Importando...' : `Importar ${selectedTransactions.length} Transações`}
            </button>
          </div>
        )}

        <div className="h-6" />
      </div>
    </div>
  );
}
