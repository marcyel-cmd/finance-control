import React from 'react';
import { TrendingUp, TrendingDown, Wallet, Calendar, LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useDeviceType } from '../../hooks/useDeviceType';

interface SummaryCardProps {
  title: string;
  value: number;
  type: 'entrada' | 'saida' | 'saldo' | 'previsto';
  trend?: number;
  suffix?: string;
  index?: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatPercent = (value: number) => `${value.toFixed(1)}%`;

const CONFIG = {
  entrada: {
    icon: TrendingUp,
    iconBg: 'bg-[#00D97E]/15',
    iconColor: '#00D97E',
    valueColor: 'text-[#00D97E]',
    accent: '#00D97E',
  },
  saida: {
    icon: TrendingDown,
    iconBg: 'bg-[#FF4757]/15',
    iconColor: '#FF4757',
    valueColor: 'text-[#FF4757]',
    accent: '#FF4757',
  },
  saldo: {
    icon: Wallet,
    iconBg: 'bg-[#4A90D9]/15',
    iconColor: '#4A90D9',
    valueColor: 'text-[#E6EDF3]',
    accent: '#4A90D9',
  },
  previsto: {
    icon: Calendar,
    iconBg: 'bg-[#FFA502]/15',
    iconColor: '#FFA502',
    valueColor: 'text-[#FFA502]',
    accent: '#FFA502',
  },
};

export function SummaryCard({ title, value, type, trend, suffix, index = 0 }: SummaryCardProps) {
  const config = CONFIG[type];
  const Icon = config.icon;
  const displayValue = suffix ? formatPercent(value) : formatCurrency(value);
  const deviceType = useDeviceType();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        delay: index * 0.08,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.97 }}
      className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 md:p-5 flex flex-col gap-3 hover:border-[#30363D]/80 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="text-[#7D8590]" style={{ fontSize: deviceType === 'desktop' ? '13px' : '12px' }}>{title}</span>
        <motion.div
          className={`w-8 h-8 md:w-9 md:h-9 rounded-xl ${config.iconBg} flex items-center justify-center`}
          initial={{ rotate: -15, scale: 0.7 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: index * 0.08 + 0.15 }}
        >
          <Icon size={deviceType === 'desktop' ? 18 : 16} color={config.iconColor} strokeWidth={2} />
        </motion.div>
      </div>

      <div>
        <motion.p
          className={`${config.valueColor}`}
          style={{ fontSize: deviceType === 'desktop' ? '24px' : '20px', fontWeight: 700, lineHeight: 1 }}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: index * 0.08 + 0.1 }}
        >
          {displayValue}
        </motion.p>
        {trend !== undefined && (
          <motion.div
            className="flex items-center gap-1 mt-1.5 min-w-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.08 + 0.3 }}
          >
            {trend >= 0 ? (
              <TrendingUp size={10} color="#00D97E" className="shrink-0" />
            ) : (
              <TrendingDown size={10} color="#FF4757" className="shrink-0" />
            )}
            <span className="truncate" style={{ fontSize: '10px', color: trend >= 0 ? '#00D97E' : '#FF4757' }}>
              {trend > 0 ? '+' : ''}{trend.toFixed(1)}% vs anterior
            </span>
          </motion.div>
        )}
      </div>

      {/* Accent bar */}
      <div className="h-0.5 rounded-full" style={{ background: config.accent + '30' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: config.accent }}
          initial={{ width: '0%' }}
          animate={{ width: '60%' }}
          transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  );
}
