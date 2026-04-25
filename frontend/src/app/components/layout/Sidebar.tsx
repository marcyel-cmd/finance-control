import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { LayoutDashboard, Receipt, CreditCard, BarChart3, Menu, Plus, Camera, FileUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImportInvoiceModal } from '../finance/ImportInvoiceModal';
import { ConfirmReceiptModal } from '../finance/ConfirmReceiptModal';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transacoes', label: 'Transações', icon: Receipt },
  { path: '/cartoes', label: 'Cartões', icon: CreditCard },
  { path: '/analises', label: 'Análises', icon: BarChart3 },
  { path: '/mais', label: 'Mais', icon: Menu },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowAddModal } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dois fluxos distintos (mesmo pattern do MobileShell):
  // - showImport (com capturedFile?): Importar fatura → várias transações
  // - receiptFile: Foto de cupom → UMA transação avulsa
  const [showImport, setShowImport] = useState(false);
  const [capturedFile, setCapturedFile] = useState<File | undefined>(undefined);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setReceiptFile(file);
  };

  const handleImportClose = () => {
    setShowImport(false);
    setCapturedFile(undefined);
  };

  return (
    <aside className="w-64 bg-[#0D1117] border-r border-[#30363D] flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-[#30363D]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00D97E]/15 flex items-center justify-center">
            <span className="text-[#00D97E] font-bold">FC</span>
          </div>
          <div>
            <h1 className="text-[#E6EDF3] font-semibold text-lg">FinanceControl</h1>
            <p className="text-[#7D8590] text-xs">Controle Financeiro</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#00D97E]/15 text-[#00D97E] border border-[#00D97E]/30'
                    : 'text-[#7D8590] hover:bg-[#1C2128] hover:text-[#E6EDF3]'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Hidden file input — file picker no desktop, câmera no mobile */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelected}
        className="hidden"
      />

      {/* Quick actions — 1 principal + 2 secundários */}
      <div className="p-4 border-t border-[#30363D] space-y-2">
        <button
          onClick={() => setShowAddModal(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#00D97E] text-[#0D1117] font-semibold text-sm hover:bg-[#00C070] transition-all active:scale-95"
          style={{ boxShadow: '0 4px 16px rgba(0, 217, 126, 0.3)' }}
        >
          <Plus size={20} />
          Nova Transação
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg transition-all active:scale-95"
            style={{
              background: 'rgba(168,85,247,0.10)',
              border: '1px solid rgba(168,85,247,0.30)',
              color: '#A855F7',
              fontSize: '11px',
              fontWeight: 600,
            }}
            title="Foto de cupom"
          >
            <Camera size={14} />
            Foto
          </button>
          <button
            onClick={() => { setCapturedFile(undefined); setShowImport(true); }}
            className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-lg transition-all active:scale-95"
            style={{
              background: 'rgba(74,144,217,0.10)',
              border: '1px solid rgba(74,144,217,0.30)',
              color: '#4A90D9',
              fontSize: '11px',
              fontWeight: 600,
            }}
            title="Importar fatura"
          >
            <FileUp size={14} />
            Fatura
          </button>
        </div>
      </div>

      {/* Modais do escopo desktop */}
      {showImport && <ImportInvoiceModal initialFile={capturedFile} onClose={handleImportClose} />}
      {receiptFile && <ConfirmReceiptModal file={receiptFile} onClose={() => setReceiptFile(null)} />}
    </aside>
  );
}
