import React, { useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { AnimatedOutlet } from './AnimatedOutlet';
import { AddTransactionModal } from '../finance/AddTransactionModal';
import { ManageCardsModal } from '../finance/ManageCardsModal';
import { NotificationPanel } from '../ui/NotificationPanel';
import { ToastContainer } from '../ui/ToastContainer';
import { useApp } from '../../context/AppContext';
import { useDeviceType } from '../../hooks/useDeviceType';

// Ordem das abas para navegação por swipe
const SWIPE_NAV_PATHS = ['/', '/transacoes', '/cartoes', '/analises', '/mais'];

// Threshold mínimo em px para considerar swipe (evita conflito com scroll)
const SWIPE_THRESHOLD = 55;

export function MobileShell() {
  const { showAddModal, setShowAddModal, showManageCards, setShowManageCards } = useApp();
  const deviceType = useDeviceType();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Swipe navigation ──────────────────────────────────────────────────────
  const swipeStartX = useRef<number | null>(null);
  const swipeStartY = useRef<number | null>(null);

  const handleSwipeStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
    swipeStartY.current = e.touches[0].clientY;
  };

  const handleSwipeEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null || swipeStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    const dy = Math.abs(e.changedTouches[0].clientY - swipeStartY.current);

    // Só navega se o swipe for predominantemente horizontal e acima do threshold
    if (Math.abs(dx) < SWIPE_THRESHOLD || dy > Math.abs(dx) * 0.75) {
      swipeStartX.current = null;
      swipeStartY.current = null;
      return;
    }

    const currentIndex = SWIPE_NAV_PATHS.indexOf(location.pathname);
    if (currentIndex === -1) { swipeStartX.current = null; swipeStartY.current = null; return; }

    if (dx < -SWIPE_THRESHOLD && currentIndex < SWIPE_NAV_PATHS.length - 1) {
      navigate(SWIPE_NAV_PATHS[currentIndex + 1]);
    } else if (dx > SWIPE_THRESHOLD && currentIndex > 0) {
      navigate(SWIPE_NAV_PATHS[currentIndex - 1]);
    }

    swipeStartX.current = null;
    swipeStartY.current = null;
  };
  // ──────────────────────────────────────────────────────────────────────────

  // Desktop layout with sidebar
  if (deviceType === 'desktop') {
    return (
      <div className="min-h-screen bg-[#0D1117] flex">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-[1600px] mx-auto w-full">
              <AnimatedOutlet />
            </div>
          </div>
        </div>
        
        {/* Modals */}
        {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}
        {showManageCards && <ManageCardsModal onClose={() => setShowManageCards(false)} />}
        
        {/* Notification Panel */}
        <NotificationPanel />
        
        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    );
  }

  // Tablet and Mobile layout
  const maxWidth = deviceType === 'tablet' ? '768px' : '430px';
  const showFAB = deviceType !== 'desktop';

  return (
    <div className="min-h-screen bg-[#0D1117] flex justify-center overflow-x-hidden">
      <div
        className="w-full min-h-screen bg-[#0D1117] flex flex-col relative overflow-x-hidden"
        style={{ maxWidth }}
      >
        {/* Main content — swipe entre abas */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden pb-20"
          style={{ scrollbarWidth: 'none' }}
          onTouchStart={handleSwipeStart}
          onTouchEnd={handleSwipeEnd}
        >
          <AnimatedOutlet />
        </div>

        {/* Bottom Navigation */}
        <BottomNav />

        {/* FAB - positioned relative to the container */}
        {showFAB && (
          <div
            className="fixed bottom-20 z-40 pointer-events-none"
            style={{ left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth }}
          >
            <div className="relative pointer-events-none" style={{ height: 0 }}>
              <button
                onClick={() => setShowAddModal(true)}
                className="absolute right-4 -top-12 pointer-events-auto w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#00D97E] flex items-center justify-center active:scale-95 transition-all hover:bg-[#00C070]"
                style={{ boxShadow: '0 8px 32px rgba(0, 217, 126, 0.4)' }}
              >
                <svg width={deviceType === 'tablet' ? '28' : '24'} height={deviceType === 'tablet' ? '28' : '24'} fill="none" stroke="#0D1117" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} />}
        {showManageCards && <ManageCardsModal onClose={() => setShowManageCards(false)} />}

        {/* Notification Panel */}
        <NotificationPanel />

        {/* Toast Notifications */}
        <ToastContainer />
      </div>
    </div>
  );
}