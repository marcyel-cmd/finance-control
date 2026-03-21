import React from 'react';
import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Receipt, CreditCard, BarChart3, MoreHorizontal } from 'lucide-react';
import { motion } from 'motion/react';
import { useDeviceType } from '../../hooks/useDeviceType';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transacoes', label: 'Transações', icon: Receipt },
  { path: '/cartoes', label: 'Cartões', icon: CreditCard },
  { path: '/analises', label: 'Análises', icon: BarChart3 },
  { path: '/mais', label: 'Mais', icon: MoreHorizontal },
];

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const deviceType = useDeviceType();

  // Hide on desktop (sidebar is shown instead)
  if (deviceType === 'desktop') {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 z-30 bg-[#161B22] border-t border-[#30363D]"
      style={{
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: deviceType === 'tablet' ? '768px' : '430px',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      <div className="grid grid-cols-5 h-16 md:h-[68px]">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center justify-center gap-0.5 transition-all"
              whileTap={{ scale: 0.85 }}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div 
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 rounded-full bg-[#00D97E]"
                  style={{ width: '32px' }}
                  layoutId="bottomNavIndicator"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              
              {/* Icon */}
              <motion.div 
                className="flex items-center justify-center"
                animate={{
                  color: isActive ? '#00D97E' : '#7D8590',
                  y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Icon 
                  size={deviceType === 'tablet' ? 22 : 20} 
                  strokeWidth={isActive ? 2.2 : 1.8} 
                />
              </motion.div>
              
              {/* Label */}
              <motion.span
                animate={{
                  color: isActive ? '#00D97E' : '#7D8590',
                  fontWeight: isActive ? 600 : 500,
                }}
                style={{ 
                  fontSize: deviceType === 'tablet' ? '10px' : '9px',
                  letterSpacing: '0.02em',
                }}
              >
                {item.label}
              </motion.span>
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}