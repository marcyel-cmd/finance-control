import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Toast } from '../../types';

const TOAST_CONFIG: Record<string, {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
}> = {
  success: {
    color: '#00D97E',
    bg: 'linear-gradient(135deg, rgba(0,217,126,0.12) 0%, rgba(0,217,126,0.05) 100%)',
    border: 'rgba(0,217,126,0.3)',
    icon: <CheckCircle2 size={18} />,
  },
  error: {
    color: '#FF4757',
    bg: 'linear-gradient(135deg, rgba(255,71,87,0.12) 0%, rgba(255,71,87,0.05) 100%)',
    border: 'rgba(255,71,87,0.3)',
    icon: <AlertOctagon size={18} />,
  },
  warning: {
    color: '#FFA502',
    bg: 'linear-gradient(135deg, rgba(255,165,2,0.12) 0%, rgba(255,165,2,0.05) 100%)',
    border: 'rgba(255,165,2,0.3)',
    icon: <AlertTriangle size={18} />,
  },
  info: {
    color: '#4A90D9',
    bg: 'linear-gradient(135deg, rgba(74,144,217,0.12) 0%, rgba(74,144,217,0.05) 100%)',
    border: 'rgba(74,144,217,0.3)',
    icon: <Info size={18} />,
  },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const cfg = TOAST_CONFIG[toast.type] || TOAST_CONFIG.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const duration = toast.duration || 3500;
    const exitTimer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => onDismiss(toast.id), 300);
    }, duration - 300);
    return () => clearTimeout(exitTimer);
  }, [toast, onDismiss]);

  return (
    <div
      className="w-full transition-all duration-300"
      style={{
        transform: visible && !exiting ? 'translateY(0) scale(1)' : 'translateY(-20px) scale(0.95)',
        opacity: visible && !exiting ? 1 : 0,
      }}
    >
      <div
        className="flex items-start gap-3 rounded-2xl px-4 py-3.5 backdrop-blur-xl"
        style={{
          background: cfg.bg,
          border: `1.5px solid ${cfg.border}`,
          boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${cfg.color}15`,
        }}
      >
        {/* Icon */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: `${cfg.color}20`, color: cfg.color }}
        >
          {toast.icon ? <span style={{ fontSize: '16px' }}>{toast.icon}</span> : cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3', lineHeight: 1.3 }}>
            {toast.title}
          </p>
          {toast.message && (
            <p style={{ fontSize: '11px', color: '#7D8590', marginTop: 2, lineHeight: 1.4 }}>
              {toast.message}
            </p>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => { setExiting(true); setTimeout(() => onDismiss(toast.id), 300); }}
          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 hover:bg-white/5 transition-colors"
          style={{ color: '#484F58' }}
        >
          <X size={12} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="mt-1 mx-4 h-0.5 rounded-full overflow-hidden bg-[#1C2128]">
        <div
          className="h-full rounded-full"
          style={{
            background: cfg.color,
            animation: `toastProgress ${(toast.duration || 3500)}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <>
      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        className="fixed top-0 z-[100] flex flex-col gap-2 px-4 pt-3 pointer-events-none"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
        }}
      >
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onDismiss={dismissToast} />
          </div>
        ))}
      </div>
    </>
  );
}
