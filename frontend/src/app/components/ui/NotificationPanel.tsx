import React, { useState } from 'react';
import {
  X, Bell, CheckCheck, Trash2, ChevronRight,
  AlertTriangle, AlertOctagon, Info, CheckCircle2, ShieldCheck,
  BellOff
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { AppNotification, NotificationType } from '../../types';

// ─── Config ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<NotificationType, {
  color: string;
  bg: string;
  border: string;
  gradientFrom: string;
  label: string;
  Icon: React.FC<{ size?: number }>;
}> = {
  alert: {
    color: '#FF4757',
    bg: 'rgba(255,71,87,0.08)',
    border: 'rgba(255,71,87,0.2)',
    gradientFrom: 'rgba(255,71,87,0.15)',
    label: 'Alerta',
    Icon: ({ size = 14 }) => <AlertOctagon size={size} />,
  },
  warning: {
    color: '#FFA502',
    bg: 'rgba(255,165,2,0.08)',
    border: 'rgba(255,165,2,0.2)',
    gradientFrom: 'rgba(255,165,2,0.15)',
    label: 'Aviso',
    Icon: ({ size = 14 }) => <AlertTriangle size={size} />,
  },
  info: {
    color: '#4A90D9',
    bg: 'rgba(74,144,217,0.08)',
    border: 'rgba(74,144,217,0.2)',
    gradientFrom: 'rgba(74,144,217,0.12)',
    label: 'Info',
    Icon: ({ size = 14 }) => <Info size={size} />,
  },
  success: {
    color: '#00D97E',
    bg: 'rgba(0,217,126,0.08)',
    border: 'rgba(0,217,126,0.2)',
    gradientFrom: 'rgba(0,217,126,0.12)',
    label: 'Sucesso',
    Icon: ({ size = 14 }) => <CheckCircle2 size={size} />,
  },
  confirmation: {
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.08)',
    border: 'rgba(168,85,247,0.2)',
    gradientFrom: 'rgba(168,85,247,0.12)',
    label: 'Confirmação',
    Icon: ({ size = 14 }) => <ShieldCheck size={size} />,
  },
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

function timeAgo(dateStr: string) {
  // [NOTIF-02] FIX: data estava hardcoded em '2026-02-17' (esquecida do desenvolvimento)
  const now = new Date();
  const date = new Date(dateStr + 'T12:00:00');
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}min atrás`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h atrás`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'Ontem';
  if (diffD < 7) return `${diffD} dias atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

type FilterTab = 'all' | 'alert' | 'warning' | 'info' | 'confirmation' | 'success';

const FILTER_TABS: { id: FilterTab; label: string; color: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Todas', color: '#7D8590', icon: <Bell size={12} /> },
  { id: 'alert', label: 'Alertas', color: '#FF4757', icon: <AlertOctagon size={12} /> },
  { id: 'warning', label: 'Avisos', color: '#FFA502', icon: <AlertTriangle size={12} /> },
  { id: 'info', label: 'Info', color: '#4A90D9', icon: <Info size={12} /> },
  { id: 'confirmation', label: 'Ações', color: '#A855F7', icon: <ShieldCheck size={12} /> },
  { id: 'success', label: 'Sucesso', color: '#00D97E', icon: <CheckCircle2 size={12} /> },
];

// ─── Notification Card ───────────────────────────────────────────────────────

function NotificationCard({ notif, compact }: { notif: AppNotification; compact?: boolean }) {
  const { markNotificationRead, deleteNotification, showToast, setShowNotifications } = useApp();
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notif.type];

  // ── Swipe-to-dismiss ──
  const x = useMotionValue(0);
  const [isDismissing, setIsDismissing] = useState(false);
  const DISMISS_THRESHOLD = 120;

  // Derived values from swipe
  const swipeProgress = useTransform(x, [-300, -DISMISS_THRESHOLD, 0, DISMISS_THRESHOLD, 300], [1, 1, 0, 1, 1]);
  const bgOpacity = useTransform(x, [-300, -DISMISS_THRESHOLD, 0, DISMISS_THRESHOLD, 300], [0.6, 0.35, 0, 0.35, 0.6]);
  const trashScale = useTransform(x, [-200, -DISMISS_THRESHOLD, -60, 0, 60, DISMISS_THRESHOLD, 200], [1.2, 1, 0.6, 0, 0.6, 1, 1.2]);
  const cardOpacity = useTransform(x, [-300, -DISMISS_THRESHOLD * 1.5, 0, DISMISS_THRESHOLD * 1.5, 300], [0.3, 0.7, 1, 0.7, 0.3]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const swipedFar = Math.abs(info.offset.x) > DISMISS_THRESHOLD;
    const swipedFast = Math.abs(info.velocity.x) > 500;

    if (swipedFar || swipedFast) {
      setIsDismissing(true);
      const direction = info.offset.x > 0 ? 1 : -1;
      // Animate card out, then delete
      setTimeout(() => {
        deleteNotification(notif.id);
        showToast({
          type: 'info',
          title: 'Notificação removida',
          message: `"${notif.title}" foi descartada.`,
          icon: '🗑️',
        });
      }, 300);
    }
  };

  const handleAction = () => {
    markNotificationRead(notif.id);
    setShowNotifications(false);

    if (notif.actionRoute) {
      navigate(notif.actionRoute);
      showToast({
        type: 'info',
        title: notif.actionLabel || 'Navegando',
        message: `Redirecionado a partir de "${notif.title}"`,
        icon: '🔗',
      });
    } else {
      showToast({
        type: 'success',
        title: 'Ação executada',
        message: `"${notif.actionLabel}" realizado com sucesso`,
        icon: '✅',
      });
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 1, height: 'auto' }}
      animate={isDismissing
        ? { opacity: 0, height: 0, marginBottom: 0, scale: 0.8 }
        : { opacity: 1, height: 'auto', scale: 1 }
      }
      exit={{ opacity: 0, height: 0, scale: 0.8 }}
      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="relative overflow-hidden"
    >
      {/* ── Swipe Background Layer ── */}
      <motion.div
        className="absolute inset-0 rounded-2xl flex items-center justify-between px-6 overflow-hidden"
        style={{ opacity: bgOpacity }}
      >
        {/* Left side gradient (swipe right) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(90deg, ${cfg.color}40, ${cfg.color}15, transparent 60%)`,
          }}
        />
        {/* Right side gradient (swipe left) */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(-90deg, #FF475740, #FF475715, transparent 60%)`,
          }}
        />
        {/* Left trash icon */}
        <motion.div
          className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            scale: trashScale,
            background: `${cfg.color}25`,
            border: `1px solid ${cfg.color}40`,
          }}
        >
          <Trash2 size={18} color={cfg.color} />
        </motion.div>
        {/* Right trash icon */}
        <motion.div
          className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            scale: trashScale,
            background: 'rgba(255,71,87,0.25)',
            border: '1px solid rgba(255,71,87,0.4)',
          }}
        >
          <Trash2 size={18} color="#FF4757" />
        </motion.div>
      </motion.div>

      {/* ── Main Card (draggable) ── */}
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.7}
        onDragEnd={handleDragEnd}
        style={{ x, opacity: cardOpacity, touchAction: 'pan-y' }}
        className="relative overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: notif.read ? '#161B22' : `linear-gradient(135deg, ${cfg.gradientFrom}, transparent)`,
            border: `1px solid ${notif.read ? '#30363D' : cfg.border}`,
          }}
          onClick={() => !notif.read && markNotificationRead(notif.id)}
        >
          {/* Left accent bar */}
          <div
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
            style={{
              background: notif.read ? '#30363D' : cfg.color,
              opacity: notif.read ? 0.5 : 1,
            }}
          />

          <div className="flex items-start gap-3 pl-4 pr-3 py-3.5">
            {/* Icon area */}
            <div className="relative shrink-0">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: `${cfg.color}15`,
                  border: `1px solid ${cfg.color}25`,
                }}
              >
                <span style={{ fontSize: '18px' }}>{notif.icon}</span>
              </div>
              {/* Type badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: '#0D1117',
                  border: `1.5px solid ${cfg.color}`,
                  color: cfg.color,
                }}
              >
                <cfg.Icon size={10} />
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <p
                    className="truncate"
                    style={{
                      fontSize: '13px',
                      fontWeight: notif.read ? 500 : 700,
                      color: notif.read ? '#7D8590' : '#E6EDF3',
                      lineHeight: 1.3,
                    }}
                  >
                    {notif.title}
                  </p>
                  {!notif.read && (
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: cfg.color, boxShadow: `0 0 6px ${cfg.color}60` }}
                    />
                  )}
                </div>
                <span className="text-[#484F58] shrink-0" style={{ fontSize: '10px' }}>
                  {timeAgo(notif.date)}
                </span>
              </div>

              {/* Message */}
              <p
                style={{
                  fontSize: '12px',
                  color: notif.read ? '#484F58' : '#7D8590',
                  marginTop: 3,
                  lineHeight: 1.5,
                }}
              >
                {notif.message}
              </p>

              {/* Amount badge + Action */}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                {notif.relatedAmount && (
                  <span
                    className="px-2.5 py-1 rounded-lg"
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: cfg.color,
                      background: `${cfg.color}12`,
                      border: `1px solid ${cfg.color}20`,
                    }}
                  >
                    {formatCurrency(notif.relatedAmount)}
                  </span>
                )}

                {/* Type label */}
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{
                    fontSize: '9px',
                    fontWeight: 600,
                    color: cfg.color,
                    background: `${cfg.color}10`,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {cfg.label}
                </span>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Action button */}
                {notif.actionLabel && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAction(); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
                    style={notif.read
                      ? {
                          background: 'transparent',
                          border: `1px solid ${cfg.color}30`,
                          color: cfg.color,
                          fontSize: '11px',
                          fontWeight: 500,
                        }
                      : {
                          background: cfg.color,
                          color: notif.type === 'warning' || notif.type === 'success' ? '#000' : '#FFF',
                          fontSize: '11px',
                          fontWeight: 600,
                        }
                    }
                  >
                    {notif.actionLabel}
                    <ChevronRight size={12} />
                  </button>
                )}

                {/* Delete */}
                <button
                  onClick={(e) => { e.stopPropagation(); deleteNotification(notif.id); }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FF4757]/10 active:scale-90 transition-all"
                  style={{ color: '#484F58' }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Panel ──────────────────────────────────────────────────────────────

export function NotificationPanel() {
  const {
    notifications, showNotifications, setShowNotifications,
    unreadCount, markAllNotificationsRead
  } = useApp();
  const [filter, setFilter] = useState<FilterTab>('all');

  if (!showNotifications) return null;

  const filtered = filter === 'all'
    ? notifications
    : notifications.filter(n => n.type === filter);

  const unread = filtered.filter(n => !n.read);
  const read = filtered.filter(n => n.read);

  // Count by type
  const countByType = (type: string) =>
    type === 'all' ? notifications.length : notifications.filter(n => n.type === type).length;

  const unreadByType = (type: string) =>
    type === 'all' ? unreadCount : notifications.filter(n => n.type === type && !n.read).length;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={() => setShowNotifications(false)}
      />

      {/* Panel */}
      <div
        className="fixed top-0 z-50 flex flex-col"
        style={{
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 430,
          maxHeight: '88vh',
          background: '#0D1117',
          borderBottom: '1px solid #30363D',
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
          animation: 'notifSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <style>{`
          @keyframes notifSlideDown {
            from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
            to   { transform: translateX(-50%) translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* ─── Header ─── */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(74,144,217,0.2), rgba(168,85,247,0.15))',
                  border: '1px solid rgba(74,144,217,0.3)',
                }}
              >
                <Bell size={18} color="#4A90D9" />
              </div>
              <div>
                <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#E6EDF3' }}>
                  Notificacoes
                </h2>
                <p style={{ fontSize: '12px', color: '#7D8590' }}>
                  {unreadCount > 0
                    ? `${unreadCount} não lida${unreadCount !== 1 ? 's' : ''} de ${notifications.length}`
                    : `${notifications.length} notificações`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl active:scale-95 transition-all"
                  style={{
                    background: 'rgba(74,144,217,0.1)',
                    border: '1px solid rgba(74,144,217,0.25)',
                    fontSize: '11px',
                    color: '#4A90D9',
                    fontWeight: 600,
                  }}
                >
                  <CheckCheck size={13} />
                  Ler tudo
                </button>
              )}
              <button
                onClick={() => setShowNotifications(false)}
                className="w-9 h-9 rounded-xl bg-[#161B22] border border-[#30363D] flex items-center justify-center active:scale-95 transition-all"
              >
                <X size={15} color="#7D8590" />
              </button>
            </div>
          </div>

          {/* ─── Summary Badges ─── */}
          {unreadCount > 0 && (
            <div className="flex gap-2 mb-4">
              {(['alert', 'warning', 'info'] as NotificationType[]).map(type => {
                const count = unreadByType(type);
                if (count === 0) return null;
                const cfg = TYPE_CONFIG[type];
                return (
                  <div
                    key={type}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{
                      background: `${cfg.color}10`,
                      border: `1px solid ${cfg.color}20`,
                    }}
                  >
                    <cfg.Icon size={11} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color }}>
                      {count}
                    </span>
                    <span style={{ fontSize: '10px', color: cfg.color, opacity: 0.7 }}>
                      {cfg.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* ─── Filter Tabs ─── */}
          <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {FILTER_TABS.map(tab => {
              const isActive = filter === tab.id;
              const count = countByType(tab.id);
              const hasUnread = unreadByType(tab.id) > 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl shrink-0 transition-all active:scale-95"
                  style={{
                    background: isActive ? `${tab.color}18` : '#161B22',
                    border: `1.5px solid ${isActive ? `${tab.color}40` : '#30363D'}`,
                    color: isActive ? tab.color : '#484F58',
                    fontSize: '11px',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  <span
                    className="min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: isActive ? `${tab.color}25` : '#1C2128',
                      color: hasUnread && isActive ? tab.color : '#484F58',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-[#30363D] mx-5" />

        {/* ─── Notifications List ─── */}
        <div
          className="overflow-y-auto flex-1 px-4 py-3 flex flex-col gap-2.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{
                  background: '#161B22',
                  border: '1px solid #30363D',
                }}
              >
                <BellOff size={28} color="#484F58" />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '14px', fontWeight: 600, color: '#7D8590' }}>
                  Nenhuma notificação
                </p>
                <p style={{ fontSize: '12px', color: '#484F58', marginTop: 4 }}>
                  {filter !== 'all'
                    ? `Sem notificações do tipo "${FILTER_TABS.find(t => t.id === filter)?.label}"`
                    : 'Você está em dia com tudo!'
                  }
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Unread section */}
              {unread.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A90D9]" />
                    <p style={{
                      fontSize: '11px',
                      color: '#4A90D9',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Novas ({unread.length})
                    </p>
                    <div className="flex-1 h-px bg-[#4A90D9]/15" />
                  </div>
                  <AnimatePresence>
                    {unread.map(n => <NotificationCard key={n.id} notif={n} />)}
                  </AnimatePresence>
                </div>
              )}

              {/* Read section */}
              {read.length > 0 && (
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex items-center gap-2 px-1 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#30363D]" />
                    <p style={{
                      fontSize: '11px',
                      color: '#484F58',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                    }}>
                      Anteriores ({read.length})
                    </p>
                    <div className="flex-1 h-px bg-[#30363D]/50" />
                  </div>
                  <AnimatePresence>
                    {read.map(n => <NotificationCard key={n.id} notif={n} />)}
                  </AnimatePresence>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom handle + safe area */}
        <div className="flex justify-center pt-2 pb-4">
          <div className="w-12 h-1 bg-[#30363D] rounded-full" />
        </div>
      </div>
    </>
  );
}