import React from 'react';
import { ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../../context/AppContext';
import { useDeviceType } from '../../hooks/useDeviceType';

const MONTHS_FULL = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const MONTHS_SHORT = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

// Today's actual month/year
const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth() + 1; // 1-based
const CURRENT_YEAR  = NOW.getFullYear();

interface HeaderProps {
  title: string;
  subtitle?: string;
  showPeriod?: boolean;
  rightAction?: React.ReactNode;
  hideBell?: boolean;
}

export function Header({ title, subtitle, showPeriod = true, rightAction, hideBell = false }: HeaderProps) {
  const { period, setPeriod, unreadCount, showNotifications, setShowNotifications } = useApp();
  const deviceType = useDeviceType();

  const isCurrentMonth = period.month === CURRENT_MONTH && period.year === CURRENT_YEAR;

  const prevMonth = () => {
    if (period.month === 1) setPeriod({ month: 12, year: period.year - 1 });
    else setPeriod({ month: period.month - 1, year: period.year });
  };

  const nextMonth = () => {
    if (period.month === 12) setPeriod({ month: 1, year: period.year + 1 });
    else setPeriod({ month: period.month + 1, year: period.year });
  };

  const goToToday = () => setPeriod({ month: CURRENT_MONTH, year: CURRENT_YEAR });

  return (
    <header className="sticky top-0 z-30 bg-[#0D1117]/95 backdrop-blur-sm border-b border-[#30363D]/50">
      <motion.div
        className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 md:py-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Left – logo + title */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0 shrink">
          {deviceType !== 'desktop' && (
            <div className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[#00D97E]/15 flex items-center justify-center shrink-0">
              <span className="text-[#00D97E] text-[10px] md:text-sm font-semibold">FC</span>
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-[#E6EDF3] truncate" style={{ fontSize: deviceType === 'desktop' ? '18px' : '14px', fontWeight: 600, lineHeight: 1.2 }}>
              {title}
            </h1>
            {subtitle && (
              <p className="text-[#7D8590] truncate" style={{ fontSize: '10px' }}>{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right – period selector + today + extras + bell */}
        <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
          {showPeriod && (
            <>
              {/* Period stepper */}
              <div className="flex items-center gap-0.5 md:gap-1 bg-[#1C2128] border border-[#30363D] rounded-lg md:rounded-xl px-1.5 md:px-3 py-1 md:py-2">
                <button
                  onClick={prevMonth}
                  className="text-[#7D8590] hover:text-[#E6EDF3] transition-colors p-0.5"
                >
                  <ChevronLeft size={deviceType === 'desktop' ? 16 : 13} />
                </button>
                <span
                  key={`${period.month}-${period.year}`}
                  className="text-[#E6EDF3] text-center"
                  style={{ fontSize: deviceType === 'desktop' ? '14px' : '11px', fontWeight: 500, minWidth: deviceType === 'desktop' ? 120 : 68 }}
                >
                  {deviceType === 'desktop' ? MONTHS_FULL[period.month - 1] : MONTHS_SHORT[period.month - 1]} {period.year}
                </span>
                <button
                  onClick={nextMonth}
                  className="text-[#7D8590] hover:text-[#E6EDF3] transition-colors p-0.5"
                >
                  <ChevronRight size={deviceType === 'desktop' ? 16 : 13} />
                </button>
              </div>

              {/* "Hoje" pill — only visible when NOT on current month */}
              <AnimatePresence>
                {!isCurrentMonth && (
                  <motion.button
                    onClick={goToToday}
                    className="flex items-center px-2 md:px-3 py-1 md:py-2 rounded-lg md:rounded-xl transition-all active:scale-90 hover:bg-[#00D97E]/20"
                    style={{
                      background: 'rgba(0,217,126,0.12)',
                      border: '1px solid rgba(0,217,126,0.35)',
                      fontSize: deviceType === 'desktop' ? '12px' : '10px',
                      fontWeight: 700,
                      color: '#00D97E',
                      whiteSpace: 'nowrap',
                    }}
                    initial={{ opacity: 0, scale: 0.8, x: -8 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.8, x: -8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  >
                    Hoje
                  </motion.button>
                )}
              </AnimatePresence>
            </>
          )}

          {rightAction}

          {/* Notification Bell */}
          {!hideBell && (
            <motion.button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl flex items-center justify-center transition-all"
              style={{
                background: showNotifications ? 'rgba(74,144,217,0.15)' : '#1C2128',
                border: `1px solid ${showNotifications ? 'rgba(74,144,217,0.35)' : '#30363D'}`,
              }}
              whileTap={{ scale: 0.85 }}
              whileHover={{ scale: 1.05 }}
            >
              <Bell size={deviceType === 'desktop' ? 16 : 15} color={showNotifications ? '#4A90D9' : '#7D8590'} />
              <AnimatePresence>
                {unreadCount > 0 && (
                  <motion.span
                    className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full flex items-center justify-center px-1"
                    style={{
                      background: '#FF4757',
                      fontSize: '9px',
                      fontWeight: 700,
                      color: 'white',
                      lineHeight: 1,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          )}
        </div>
      </motion.div>
    </header>
  );
}