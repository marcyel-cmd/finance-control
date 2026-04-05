import React, { useState, useRef } from 'react';
import { Trash2, Pencil, CreditCard, Wallet, Banknote, RotateCcw, Clock, AlertTriangle, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../../types';
import { useApp } from '../../context/AppContext';
import { EditTransactionModal } from './EditTransactionModal';

interface TransactionItemProps {
  transaction: Transaction;
  showDelete?: boolean;
  index?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
};

export function TransactionItem({ transaction: tx, showDelete = false, index = 0 }: TransactionItemProps) {
  const { deleteTransaction, categories } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'confirm' | 'success'>('confirm');
  const [isOpen, setIsOpen] = useState(false);
  const [swipeX, setSwipeX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const hasDraggedRef = useRef(false);

  const cat = categories.find(c => c.id === tx.category);
  const isIncome = tx.type === 'entrada';
  const isPrevisto = tx.type === 'previsto' || tx.status === 'previsto';
  const hasInstallments = tx.installments && tx.installments > 1;
  // [T-05] FIX: detectar se é a parcela mãe (sem parentId implícito = currentInstallment === 1 e installments > 1)
  const isInstallmentParent = !!(hasInstallments && tx.currentInstallment === 1);

  const valueColor = isIncome ? '#00D97E' : isPrevisto ? '#FFA502' : '#FF4757';

  const PayIcon = tx.paymentMethod === 'credito'
    ? CreditCard
    : tx.paymentMethod === 'dinheiro'
      ? Banknote
      : Wallet;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!showDelete) return;
    startXRef.current = e.touches[0].clientX;
    hasDraggedRef.current = false;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !showDelete) return;
    const dx = e.touches[0].clientX - startXRef.current;
    if (Math.abs(dx) > 3) hasDraggedRef.current = true;
    const clamped = Math.min(0, Math.max(-80, isOpen ? dx - 80 : dx));
    setSwipeX(clamped);
  };

  const handleTouchEnd = () => {
    if (!isDragging || !showDelete) return;
    setIsDragging(false);
    if (swipeX < -30) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
    setSwipeX(0);
  };

  const handleClick = () => {
    if (!showDelete) return;
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setIsOpen(prev => !prev);
  };

  const swipeProgress = isDragging ? Math.min(1, Math.abs(swipeX) / 80) : 0;
  const actionsVisible = isOpen || swipeProgress > 0.1;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{
          opacity: 0,
          x: -60,
          scale: 0.95,
          transition: { duration: 0.3, ease: 'easeInOut' },
        }}
        transition={{
          duration: 0.35,
          delay: index * 0.04,
          ease: [0.25, 0.46, 0.45, 0.94],
        }}
        className="border-b border-[#30363D]/40 last:border-b-0"
        style={{ touchAction: showDelete ? 'pan-y' : undefined }}
      >
        <div
          className="flex items-center gap-3 py-3.5 px-4 cursor-pointer select-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleClick}
        >
          {/* Category Icon */}
          <motion.div
            className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              backgroundColor: (cat?.color || '#9CA3AF') + '15',
              border: `1px solid ${(cat?.color || '#9CA3AF')}20`,
            }}
            whileTap={{ scale: 0.9 }}
          >
            <span style={{ fontSize: '20px' }}>{cat?.icon || '📦'}</span>
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className="truncate text-[#E6EDF3]"
              style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3 }}
            >
              {tx.description}
            </p>

            <div className="flex items-center gap-1 mt-0.5 flex-wrap">
              <span className="text-[#7D8590] truncate" style={{ fontSize: '11px', maxWidth: '72px' }}>
                {cat?.label || 'Outros'}
              </span>
              <span className="text-[#30363D]" style={{ fontSize: '6px' }}>●</span>
              <span className="text-[#7D8590] flex-shrink-0" style={{ fontSize: '11px' }}>
                {formatDate(tx.date)}
              </span>
              {tx.paymentMethod && (
                <>
                  <span className="text-[#30363D]" style={{ fontSize: '8px' }}>●</span>
                  <PayIcon size={11} color="#484F58" className="flex-shrink-0" />
                </>
              )}
              {isPrevisto && (
                <span
                  className="flex items-center gap-0.5 flex-shrink-0 px-1 py-px rounded"
                  style={{ fontSize: '8px', fontWeight: 600, background: '#FFA50215', color: '#FFA502' }}
                >
                  <Clock size={7} />
                  Previsto
                </span>
              )}
              {hasInstallments && (
                <span
                  className="flex items-center gap-0.5 flex-shrink-0 px-1 py-px rounded"
                  style={{ fontSize: '8px', fontWeight: 600, background: '#4A90D915', color: '#4A90D9' }}
                >
                  <RotateCcw size={7} />
                  {tx.currentInstallment || 1}/{tx.installments}
                </span>
              )}
            </div>
          </div>

          {/* Value */}
          <div className="flex flex-col items-end flex-shrink-0">
            <p
              style={{
                fontSize: '13px', fontWeight: 700, color: valueColor,
                lineHeight: 1.2, letterSpacing: '-0.02em', whiteSpace: 'nowrap',
              }}
            >
              {isIncome ? '+' : '-'}{formatCurrency(tx.value)}
            </p>
            {hasInstallments && tx.totalInstallmentValue && (
              <p className="mt-0.5" style={{ fontSize: '9px', color: '#484F58' }}>
                Total: {formatCurrency(tx.totalInstallmentValue)}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {showDelete && (
            <motion.div
              className="flex items-center gap-2 flex-shrink-0 overflow-hidden"
              animate={{
                width: actionsVisible ? 80 : 0,
                opacity: isDragging ? swipeProgress : (isOpen ? 1 : 0),
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setShowEditModal(true);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(74, 144, 217, 0.25)',
                  border: '1px solid rgba(74, 144, 217, 0.35)',
                  boxShadow: '0 0 8px rgba(74, 144, 217, 0.15)',
                }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
              >
                <Pencil size={14} color="#6BB3F0" />
              </motion.button>
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setDeleteStep('confirm');
                  setShowDeleteConfirm(true);
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{
                  background: 'rgba(255, 71, 87, 0.25)',
                  border: '1px solid rgba(255, 71, 87, 0.35)',
                  boxShadow: '0 0 8px rgba(255, 71, 87, 0.15)',
                }}
                whileTap={{ scale: 0.85 }}
                whileHover={{ scale: 1.1 }}
              >
                <Trash2 size={14} color="#FF6B7A" />
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditTransactionModal
          transaction={tx}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={() => { if (deleteStep === 'confirm') setShowDeleteConfirm(false); }}
          >
            <motion.div
              className="w-full max-w-[320px] rounded-2xl overflow-hidden"
              initial={{ scale: 0.85, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              style={{
                background: '#161B22',
                border: '1px solid #30363D',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <AnimatePresence mode="wait">
                {deleteStep === 'confirm' ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between px-5 pt-5 pb-2">
                      <div className="flex items-center gap-2.5">
                        <motion.div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{
                            background: 'rgba(255, 71, 87, 0.15)',
                            border: '1px solid rgba(255, 71, 87, 0.25)',
                          }}
                          initial={{ rotate: -10, scale: 0.8 }}
                          animate={{ rotate: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          <AlertTriangle size={20} color="#FF4757" />
                        </motion.div>
                        <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 700 }}>
                          Excluir transação
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: '#21262D' }}
                      >
                        <X size={16} color="#7D8590" />
                      </button>
                    </div>

                    <div className="px-5 py-4">
                      <p className="text-[#8B949E]" style={{ fontSize: '13px', lineHeight: 1.6 }}>
                        Tem certeza que deseja excluir{' '}
                        <span className="text-[#E6EDF3]" style={{ fontWeight: 600 }}>
                          "{tx.description}"
                        </span>
                        {' '}no valor de{' '}
                        <span style={{ color: valueColor, fontWeight: 600 }}>
                          {formatCurrency(tx.value)}
                        </span>
                        ?
                      </p>
                      {/* [T-05] FIX: avisar que todas as parcelas serão excluídas */}
                      {isInstallmentParent && tx.installments && (
                        <div
                          className="mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5"
                          style={{ background: 'rgba(255,165,2,0.08)', border: '1px solid rgba(255,165,2,0.25)' }}
                        >
                          <AlertTriangle size={14} color="#FFA502" className="flex-shrink-0 mt-0.5" />
                          <p style={{ fontSize: '12px', color: '#FFA502', lineHeight: 1.5 }}>
                            Atenção: esta é a 1ª de <strong>{tx.installments} parcelas</strong>. Excluir apagará <strong>todas as {tx.installments} parcelas</strong> desta compra.
                          </p>
                        </div>
                      )}
                      <p className="mt-2 text-[#7D8590]" style={{ fontSize: '12px', lineHeight: 1.5 }}>
                        Essa ação não pode ser desfeita.
                      </p>
                    </div>

                    <div className="flex gap-3 px-5 pb-5">
                      <motion.button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center"
                        style={{
                          background: '#21262D', border: '1px solid #30363D',
                          fontSize: '14px', fontWeight: 600, color: '#8B949E',
                        }}
                        whileTap={{ scale: 0.96 }}
                      >
                        Cancelar
                      </motion.button>
                      <motion.button
                        onClick={() => setDeleteStep('success')}
                        className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2"
                        style={{
                          background: 'rgba(255, 71, 87, 0.2)',
                          border: '1px solid rgba(255, 71, 87, 0.35)',
                          fontSize: '14px', fontWeight: 600, color: '#FF4757',
                        }}
                        whileTap={{ scale: 0.96 }}
                        whileHover={{ background: 'rgba(255, 71, 87, 0.3)' }}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="success"
                    className="flex flex-col items-center py-8 px-5"
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  >
                    <motion.div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                      style={{
                        background: 'rgba(0, 217, 126, 0.15)',
                        border: '1px solid rgba(0, 217, 126, 0.25)',
                        boxShadow: '0 0 20px rgba(0, 217, 126, 0.1)',
                      }}
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                    >
                      <CheckCircle2 size={28} color="#00D97E" />
                    </motion.div>
                    <motion.p
                      className="text-[#E6EDF3] mb-1.5"
                      style={{ fontSize: '16px', fontWeight: 700 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      Transação excluída
                    </motion.p>
                    <motion.p
                      className="text-[#7D8590] text-center"
                      style={{ fontSize: '13px', lineHeight: 1.5 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <span className="text-[#8B949E]" style={{ fontWeight: 600 }}>"{tx.description}"</span>
                      {' '}foi removida com sucesso.
                    </motion.p>
                    <motion.button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteStep('confirm');
                        deleteTransaction(tx.id);
                      }}
                      className="mt-6 w-full h-11 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'rgba(0, 217, 126, 0.15)',
                        border: '1px solid rgba(0, 217, 126, 0.3)',
                        fontSize: '14px', fontWeight: 600, color: '#00D97E',
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Entendido
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
