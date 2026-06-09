import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Pencil, Camera, FileUp, Brain, X } from 'lucide-react';

interface Props {
  onManual: () => void;
  onPhoto: (file: File) => void;
  onImportInvoice: () => void;
  onSmartImport: () => void;
  size?: 'mobile' | 'tablet';
}

// FAB que abre um leque vertical de 3 ações:
//   - Manual (modal de transação tradicional)
//   - Foto de cupom (abre câmera; arquivo selecionado vai pro callback)
//   - Importar fatura (modal de importação tradicional)
export function QuickActionFab({ onManual, onPhoto, onImportInvoice, onSmartImport, size = 'mobile' }: Props) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fecha ao apertar Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const handleManual = () => {
    setOpen(false);
    onManual();
  };

  const handleImport = () => {
    setOpen(false);
    onImportInvoice();
  };

  const handleSmartImport = () => {
    setOpen(false);
    onSmartImport();
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOpen(false);
    onPhoto(file);
  };

  const fabSize = size === 'tablet' ? 64 : 56;
  const iconSize = size === 'tablet' ? 28 : 24;

  return (
    <>
      {/* Hidden file input — capture=environment abre câmera traseira no mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Backdrop — pointer-events-auto pra capturar tap-fora-fecha
          (o pai usa pointer-events-none pra deixar o conteúdo abaixo clicável) */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Action menu — itens aparecem acima do FAB */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="absolute right-4 -top-12 z-50 flex flex-col items-end gap-3 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ transform: 'translateY(-100%)' }}
          >
            {[
              { id: 'smart',   label: 'Import. Inteligente', icon: Brain,  color: '#7C5CFC', onClick: handleSmartImport },
              { id: 'photo',   label: 'Foto de cupom',       icon: Camera, color: '#A855F7', onClick: handlePhotoClick },
              { id: 'import',  label: 'Importar fatura',     icon: FileUp, color: '#4A90D9', onClick: handleImport },
              { id: 'manual',  label: 'Lançar manual',       icon: Pencil, color: '#00D97E', onClick: handleManual },
            ].map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.85 }}
                transition={{ delay: i * 0.04, type: 'spring', stiffness: 380, damping: 26 }}
                className="flex items-center gap-2 pointer-events-auto"
              >
                <span
                  className="px-3 py-1.5 rounded-lg pointer-events-none"
                  style={{
                    background: '#161B22',
                    border: '1px solid #30363D',
                    color: '#E6EDF3',
                    fontSize: '12px',
                    fontWeight: 600,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                  }}
                >
                  {item.label}
                </span>
                <button
                  onClick={item.onClick}
                  className="rounded-full flex items-center justify-center active:scale-95 transition-all pointer-events-auto"
                  style={{
                    width: 48,
                    height: 48,
                    background: item.color,
                    boxShadow: `0 6px 18px ${item.color}55`,
                  }}
                >
                  <item.icon size={20} color="#0D1117" strokeWidth={2.4} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB */}
      <motion.button
        onClick={() => setOpen(o => !o)}
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 24 }}
        className="absolute right-4 -top-12 z-50 pointer-events-auto rounded-full flex items-center justify-center active:scale-95 transition-all"
        style={{
          width:  fabSize,
          height: fabSize,
          background: open ? '#FF4757' : '#00D97E',
          boxShadow: open
            ? '0 8px 32px rgba(255, 71, 87, 0.4)'
            : '0 8px 32px rgba(0, 217, 126, 0.4)',
        }}
      >
        {open ? (
          <X size={iconSize} color="#0D1117" strokeWidth={2.8} />
        ) : (
          <svg width={iconSize} height={iconSize} fill="none" stroke="#0D1117" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        )}
      </motion.button>
    </>
  );
}
