import React, { useState, useMemo } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from '../components/layout/Header';
import { TransactionItem } from '../components/finance/TransactionItem';
import { useApp } from '../context/AppContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { Transaction } from '../types';

type TabId = 'todas' | 'entradas' | 'saidas' | 'previsto';

const TABS: { id: TabId; label: string; color: string }[] = [
  { id: 'todas', label: 'Todas', color: '#4A90D9' },
  { id: 'entradas', label: 'Entradas', color: '#00D97E' },
  { id: 'saidas', label: 'Saídas', color: '#FF4757' },
  { id: 'previsto', label: 'Previsto', color: '#FFA502' },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

export function TransactionsScreen() {
  const { period, getFilteredTransactions, categories } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('todas');
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const allTx = getFilteredTransactions(period.month, period.year);

  const filtered = useMemo(() => {
    let list: Transaction[] = allTx;

    // [T-01] FIX: hierarquia de abas sem sobreposição
    // "Previsto" mostra apenas type === 'previsto' (budgets/orçamentos)
    // "Saídas" mostra saida + saida_futura (incluindo com status previsto, mas NÃO type previsto)
    if (activeTab === 'entradas') list = list.filter(t => t.type === 'entrada');
    else if (activeTab === 'saidas') list = list.filter(t => t.type === 'saida' || t.type === 'saida_futura');
    else if (activeTab === 'previsto') list = list.filter(t => t.type === 'previsto');

    if (search) list = list.filter(t =>
      t.description.toLowerCase().includes(search.toLowerCase())
    );
    if (filterCategory !== 'all') list = list.filter(t => t.category === filterCategory);
    // [T-03] FIX: filtro de status não aplicado quando aba já define status implícito
    if (filterStatus !== 'all') {
      if (activeTab === 'todas' || activeTab === 'saidas') {
        list = list.filter(t => t.status === filterStatus);
      }
      // em 'previsto' e 'entradas' o filtro de status não faz sentido, ignoramos
    }

    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allTx, activeTab, search, filterCategory, filterStatus]);

  // [T-02] FIX: mini-resumo sempre calculado sobre allTx (não filtrado),
  // assim o usuário vê o saldo real do período independente dos filtros ativos
  const entradas = allTx.filter(t => t.type === 'entrada' && t.status === 'realizado').reduce((s, t) => s + t.value, 0);
  const saidas = allTx.filter(t => (t.type === 'saida' || t.type === 'saida_futura') && t.status === 'realizado').reduce((s, t) => s + t.value, 0);

  const hasActiveFilters = filterCategory !== 'all' || filterStatus !== 'all';

  return (
    <div className="flex flex-col">
      <Header title="Transações" subtitle={`${filtered.length} registros`} />

      <div className="px-4 pt-4 flex flex-col gap-3">
        {/* Tabs */}
        <motion.div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {TABS.map((tab, i) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl transition-all"
              style={{
                background: activeTab === tab.id ? tab.color + '20' : '#1C2128',
                border: `1px solid ${activeTab === tab.id ? tab.color : '#30363D'}`,
                color: activeTab === tab.id ? tab.color : '#7D8590',
                fontWeight: activeTab === tab.id ? 600 : 400,
                fontSize: '13px',
              }}
              whileTap={{ scale: 0.93 }}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </motion.div>

        {/* Search + Filter */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7D8590]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar transações..."
              className="w-full bg-[#161B22] border border-[#30363D] rounded-xl pl-9 pr-4 py-2.5 text-[#E6EDF3] placeholder-[#484F58] outline-none focus:border-[#00D97E]/50"
              style={{ fontSize: '13px' }}
            />
          </div>
          <motion.button
            onClick={() => setShowFilters(!showFilters)}
            className="w-10 h-10 rounded-xl flex items-center justify-center border transition-all"
            style={{
              background: hasActiveFilters ? '#00D97E/15' : '#161B22',
              borderColor: hasActiveFilters ? '#00D97E' : '#30363D',
              color: hasActiveFilters ? '#00D97E' : '#7D8590',
            }}
            whileTap={{ scale: 0.9, rotate: 15 }}
          >
            <SlidersHorizontal size={16} />
          </motion.button>
        </motion.div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4 flex flex-col gap-3"
              initial={{ opacity: 0, height: 0, scaleY: 0.8 }}
              animate={{ opacity: 1, height: 'auto', scaleY: 1 }}
              exit={{ opacity: 0, height: 0, scaleY: 0.8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              style={{ originY: 0, overflow: 'hidden' }}
            >
              <div className="flex items-center justify-between">
                <p className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>Filtros</p>
                {hasActiveFilters && (
                  <button
                    onClick={() => { setFilterCategory('all'); setFilterStatus('all'); }}
                    className="flex items-center gap-1 text-[#FF4757]"
                    style={{ fontSize: '11px' }}
                  >
                    <X size={12} /> Limpar
                  </button>
                )}
              </div>

              <div>
                <p className="text-[#7D8590] mb-2" style={{ fontSize: '11px' }}>Categoria</p>
                <div className="flex gap-2 flex-wrap">
                  {[{ id: 'all', label: 'Todas', icon: '🔍', color: '#7D8590' }, ...categories].map(c => (
                    <motion.button
                      key={c.id}
                      onClick={() => setFilterCategory(c.id)}
                      className="px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: filterCategory === c.id ? '#00D97E20' : '#1C2128',
                        border: `1px solid ${filterCategory === c.id ? '#00D97E' : '#30363D'}`,
                        color: filterCategory === c.id ? '#00D97E' : '#7D8590',
                      }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {c.icon} {c.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[#7D8590] mb-2" style={{ fontSize: '11px' }}>Status</p>
                <div className="flex gap-2">
                  {[
                    { id: 'all', label: 'Todos' },
                    { id: 'realizado', label: 'Realizado' },
                    { id: 'previsto', label: 'Previsto' },
                  ].map(s => (
                    <motion.button
                      key={s.id}
                      onClick={() => setFilterStatus(s.id)}
                      className="px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: filterStatus === s.id ? '#4A90D920' : '#1C2128',
                        border: `1px solid ${filterStatus === s.id ? '#4A90D9' : '#30363D'}`,
                        color: filterStatus === s.id ? '#4A90D9' : '#7D8590',
                      }}
                      whileTap={{ scale: 0.92 }}
                    >
                      {s.label}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Summary Mini — [T-02] FIX: sempre mostra saldo do período inteiro, não do filtro */}
        <div className="flex gap-3">
          {[
            { label: 'Entradas', value: entradas, color: '#00D97E' },
            { label: 'Saídas', value: saidas, color: '#FF4757' },
            { label: 'Saldo do Mês', value: entradas - saidas, color: entradas - saidas >= 0 ? '#00D97E' : '#FF4757' },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              className="flex-1 bg-[#161B22] border border-[#30363D] rounded-xl px-3 py-2"
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15 + i * 0.06, duration: 0.35 }}
            >
              <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>{item.label}</p>
              <p style={{ fontSize: '14px', fontWeight: 700, color: item.color }}>
                {formatCurrency(item.value)}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transaction List */}
        <motion.div
          className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((tx, i) => (
                <TransactionItem key={tx.id} transaction={tx} showDelete index={i} />
              ))
            ) : (
              <motion.div
                key="empty"
                className="py-12 text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <p className="text-4xl mb-3">📊</p>
                <p className="text-[#7D8590]" style={{ fontSize: '14px' }}>Nenhuma transação encontrada</p>
                <p className="text-[#484F58] mt-1" style={{ fontSize: '12px' }}>
                  Ajuste os filtros ou adicione uma nova transação
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
