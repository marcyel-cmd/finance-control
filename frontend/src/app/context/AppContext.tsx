import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { Transaction, CreditCard, AppPeriod, AppNotification, Category, Toast, AppUser } from '../types';
import { authApi } from '../services/auth.api';
import { transactionsApi } from '../services/transactions.api';
import { cardsApi } from '../services/cards.api';
import { categoriesApi } from '../services/categories.api';
import { notificationsApi } from '../services/notifications.api';
import { clearTokens, getAccessToken } from '../services/api';

// ========== CORREÇÃO PROBLEMA 1 ==========
// Sistema de listeners para notificar componentes de mudanças
type DataChangeListener = () => void;
const dataChangeListeners = new Set<DataChangeListener>();

export function subscribeToDataChanges(listener: DataChangeListener) {
  dataChangeListeners.add(listener);
  return () => dataChangeListeners.delete(listener);
}

function notifyDataChange() {
  dataChangeListeners.forEach(listener => listener());
}
// ==========================================

interface AppContextType {
  transactions: Transaction[];
  cards: CreditCard[];
  categories: Category[];
  period: AppPeriod;
  darkMode: boolean;
  showAddModal: boolean;
  showManageCards: boolean;
  notifications: AppNotification[];
  showNotifications: boolean;
  unreadCount: number;
  toasts: Toast[];
  users: AppUser[];
  currentUser: AppUser | null;
  loading: boolean;
  summary: { entradas: number; saidas: number; saldo: number; previsto: number; economia?: number; total?: number };
  setPeriod: (p: AppPeriod) => void;
  setDarkMode: (v: boolean) => void;
  setShowAddModal: (v: boolean) => void;
  setShowManageCards: (v: boolean) => void;
  setShowNotifications: (v: boolean) => void;
  addTransaction: (t: any) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
  updateTransaction: (id: string, data: any) => Promise<void>;
  addCard: (c: any) => Promise<CreditCard>;
  updateCard: (c: CreditCard) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  addCategory: (c: Category) => Promise<void>;
  updateCategory: (c: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getFilteredTransactions: (month: number, year: number) => Transaction[];
  getSummary: (month: number, year: number) => { entradas: number; saidas: number; saldo: number; previsto: number };
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (n: Omit<AppNotification, 'id'>) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  loginUser: (email: string, password: string) => Promise<AppUser | null>;
  logoutUser: () => void;
  addUser: (u: Omit<AppUser, 'id' | 'createdAt'>) => void;
  updateUser: (u: AppUser) => void;
  deleteUser: (id: string) => void;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const now = new Date();
  const [period, setPeriod] = useState<AppPeriod>({ month: now.getMonth() + 1, year: now.getFullYear() });
  const [darkMode, setDarkMode] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageCards, setShowManageCards] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem('fc_current_user');
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // [A-05] FIX: remover campo password de dados legados salvos no localStorage
      if (parsed && 'password' in parsed) { delete parsed.password; }
      return parsed;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const initialLoadDone = useRef(false);
  const periodRef = useRef(period);
  periodRef.current = period;

  const EMPTY_SUMMARY = { entradas: 0, saidas: 0, saldo: 0, previsto: 0, economia: 0, total: 0 };
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Carregar dados do backend ────────────────────────────

  const loadCategories = useCallback(async () => {
    try {
      const res = await categoriesApi.list();
      if (res.data) setCategories(res.data);
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
    }
  }, []);

  const loadTransactions = useCallback(async (month: number, year: number) => {
    try {
      const res = await transactionsApi.list({ month, year });
      if (res.data) {
        const mapped = res.data.map((t: any) => ({
          id: t.id,
          type: t.type,
          description: t.description,
          category: t.category,
          // Prisma Decimal serializa como string — converter para number aqui centralizadamente
          value: Number(t.value) || 0,
          date: t.date?.split('T')[0] || t.date,
          paymentMethod: t.paymentMethod || t.payment_method,
          cardId: t.cardId || t.card_id,
          status: t.status,
          recurring: t.recurring,
          linkedPreviewId: t.linkedPreviewId || t.linked_preview_id,
          month: t.month,
          year: t.year,
          installments: t.installmentTotal || t.installment_total,
          installmentValue: Number(t.value) || 0,
          currentInstallment: t.installmentNumber || t.installment_number,
          totalInstallmentValue: Number(t.totalValue ?? t.total_value) || 0,
        }));
        setTransactions(mapped);
      }
    } catch (err) {
      console.error('Erro ao carregar transações:', err);
    }
  }, []);

  const loadCards = useCallback(async () => {
    try {
      const res = await cardsApi.list();
      if (res.data) {
        // Prisma Decimal → string: normalizar campos numéricos dos cartões
        const parsed = res.data.map((c: any) => ({
          ...c,
          limit: Number(c.limit) || 0,
          used: Number(c.used) || 0,
        }));
        setCards(parsed);
      }
    } catch (err) {
      console.error('Erro ao carregar cartões:', err);
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list();
      if (res.data) {
        const mapped = res.data.map((n: any) => ({
          ...n,
          date: n.date?.split('T')[0] || n.date,
        }));
        setNotifications(mapped);
      }
    } catch (err) {
      console.error('Erro ao carregar notificações:', err);
    }
  }, []);

  const loadSummary = useCallback(async (month: number, year: number) => {
    try {
      const res = await transactionsApi.summary(month, year);
      if (res.data) setSummary(res.data);
    } catch (err) {
      console.error('Erro ao carregar summary:', err);
    }
  }, []);

  // ========== CORREÇÃO PROBLEMA 1 ==========
  // Notificar listeners após carregar dados
  const refreshData = useCallback(async () => {
    if (!getAccessToken()) return;
    const { month, year } = periodRef.current;
    setLoading(true);
    try {
      // [A-04] FIX: rolagem de saldo com notificação ao usuário via setToasts direto
      // (showToast não disponível ainda no useCallback — usamos setToasts diretamente)
      // [AN-08] FIX: usar data real (today) para verificar se deve rodar carry-forward,
      // não periodRef.current (período selecionado pelo usuário). Se usuário estiver vendo
      // fevereiro enquanto hoje é 3 de março, o carry-forward de março nunca disparava.
      const today = new Date();
      const todayMonth = today.getMonth() + 1;
      const todayYear  = today.getFullYear();
      if (today.getDate() <= 5) {
        transactionsApi.carryForward(todayMonth, todayYear)
          .then((res: any) => {
            if (res?.data?.created && res?.data?.balance > 0) {
              const MONTH_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
              const prevMonthName = todayMonth === 1 ? MONTH_PT[11] : MONTH_PT[todayMonth - 2];
              const val = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(res.data.balance);
              const id = `toast_carry_${Date.now()}`;
              setToasts(prev => [...prev, {
                id, type: 'info' as const,
                title: 'Saldo transferido automaticamente',
                message: `Saldo de ${prevMonthName} (${val}) adicionado como entrada deste mês.`,
                duration: 6000,
              }]);
              setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 6000);
            }
          })
          .catch(() => {/* silencioso em caso de erro de rede */});
      }

      await Promise.all([
        loadCategories(),
        loadTransactions(month, year),
        loadSummary(month, year),
        loadCards(),
        loadNotifications(),
      ]);
      notifyDataChange();
    } finally {
      setLoading(false);
    }
  }, [loadCategories, loadTransactions, loadSummary, loadCards, loadNotifications]);
  // ==========================================

  useEffect(() => {
    if (getAccessToken() && !initialLoadDone.current) {
      initialLoadDone.current = true;
      refreshData();
    }
  }, [refreshData]);

  useEffect(() => {
    if (getAccessToken()) {
      loadTransactions(period.month, period.year);
      loadSummary(period.month, period.year);
    }
  }, [period.month, period.year, loadTransactions, loadSummary]);

  // ── Helper: reload after any mutation ───────────────────
  const reloadAfterMutation = useCallback(async () => {
    const { month, year } = periodRef.current;
    await Promise.all([loadTransactions(month, year), loadSummary(month, year), loadCards(), loadNotifications()]);
    notifyDataChange();
  }, [loadTransactions, loadSummary, loadCards, loadNotifications]);

  // ── Transaction CRUD (via API) ──────────────────────────

  const addTransaction = useCallback(async (data: any) => {
    const res = await transactionsApi.create({
      type: data.type,
      description: data.description,
      category: data.category,
      value: data.value,
      date: data.date,
      paymentMethod: data.paymentMethod,
      cardId: data.cardId || null,
      status: data.status || 'realizado',
      recurring: data.recurring || false,
      linkedPreviewId: data.linkedPreviewId || null,
      installment: data.installment || false,
      installmentTotal: data.installmentTotal || null,
    });
    await reloadAfterMutation();
    return res;
  }, [reloadAfterMutation]);

  const deleteTransaction = useCallback(async (id: string) => {
    await transactionsApi.delete(id);
    await reloadAfterMutation();
  }, [reloadAfterMutation]);

  const updateTransaction = useCallback(async (id: string, data: any) => {
    await transactionsApi.update(id, data);
    await reloadAfterMutation();
  }, [reloadAfterMutation]);

  // ── Card CRUD (via API) ─────────────────────────────────

  const addCard = useCallback(async (data: any): Promise<CreditCard> => {
    const res = await cardsApi.create({
      name: data.name, lastDigits: data.lastDigits, brand: data.brand,
      color: data.color, limit: data.limit, closingDay: data.closingDay,
      dueDay: data.dueDay, type: data.type,
    });
    await reloadAfterMutation();
    return res.data;
  }, [reloadAfterMutation]);

  const updateCard = useCallback(async (c: CreditCard) => {
    await cardsApi.update(c.id, c);
    await reloadAfterMutation();
  }, [reloadAfterMutation]);

  const deleteCard = useCallback(async (id: string) => {
    await cardsApi.delete(id);
    await reloadAfterMutation();
  }, [reloadAfterMutation]);

  // ── Category CRUD (via API) ─────────────────────────────

  const addCategory = useCallback(async (c: Category) => {
    await categoriesApi.create(c);
    await loadCategories();
    notifyDataChange(); // ← NOTIFICAR COMPONENTES
  }, [loadCategories]);

  const updateCategory = useCallback(async (c: Category) => {
    await categoriesApi.update(c.id, { label: c.label, color: c.color, icon: c.icon });
    await loadCategories();
    notifyDataChange(); // ← NOTIFICAR COMPONENTES
  }, [loadCategories]);

  const deleteCategory = useCallback(async (id: string) => {
    await categoriesApi.delete(id);
    await loadCategories();
    notifyDataChange(); // ← NOTIFICAR COMPONENTES
  }, [loadCategories]);

  // ── Filtros locais (usam dados já carregados) ───────────

  const getFilteredTransactions = useCallback((month: number, year: number) => {
    // [TX-LIST-01] FIX: excluir 'pagamento_fatura' da listagem geral — são transações internas
    // que não representam gastos reais do usuário e poluem a aba "Todas" da TransactionsScreen
    return transactions.filter(t => t.month === month && t.year === year && (t.type as string) !== 'pagamento_fatura');
  }, [transactions]);

  const getSummary = useCallback((month: number, year: number) => {
    const filtered = transactions.filter(t => t.month === month && t.year === year);
    const entradas = filtered
      .filter(t => t.type === 'entrada' && t.status === 'realizado')
      .reduce((sum, t) => sum + t.value, 0);
    const saidas = filtered
      .filter(t => (t.type === 'saida' || t.type === 'saida_futura') && t.status === 'realizado')
      .reduce((sum, t) => sum + t.value, 0);
    const saldo = entradas - saidas;
    const previsto = filtered
      .filter(t => t.status === 'previsto')
      .reduce((sum, t) => sum + t.value, 0);
    return { entradas, saidas, saldo, previsto };
  }, [transactions]);

  // ── Notifications (via API) ─────────────────────────────

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationsApi.markRead(id).catch(console.error);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationsApi.markAllRead().catch(console.error);
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    notificationsApi.delete(id).catch(console.error);
  }, []);

  const addNotification = useCallback((n: Omit<AppNotification, 'id'>) => {
    const newNotif: AppNotification = {
      ...n,
      id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  // ── Toasts (local only) ─────────────────────────────────

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
    const newToast: Toast = { ...toast, id };
    setToasts(prev => [...prev, newToast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // ── Auth (via API) ──────────────────────────────────────

  const loginUser = useCallback(async (email: string, password: string): Promise<AppUser | null> => {
    const res = await authApi.login(email, password);
    // [A-05] FIX: não incluir campo password no objeto de usuário do contexto
    const user: AppUser = {
      id: res.user.id,
      name: res.user.name,
      email: res.user.email,
      role: res.user.role as 'admin' | 'user',
      createdAt: res.user.createdAt,
      active: res.user.active,
    };
    setCurrentUser(user);
    initialLoadDone.current = true;
    // Await data load before returning — so navigate('/') has data ready
    await refreshData();
    return user;
  }, [refreshData]);

  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    setTransactions([]);
    setCards([]);
    setNotifications([]);
    authApi.logout();
    initialLoadDone.current = false;
  }, []);

  // ── Users (simplificado) ────────────────────────────────
  // [A-06] FIX: funções não implementadas lançam erro explícito em vez de ser no-ops silenciosos

  const addUser = useCallback((_u: Omit<AppUser, 'id' | 'createdAt'>) => {
    console.warn('[AppContext] addUser ainda não integrado com a API.');
    // TODO: integrar com POST /users quando necessário
  }, []);

  const updateUser = useCallback((_u: AppUser) => {
    console.warn('[AppContext] updateUser ainda não integrado com a API.');
    // TODO: integrar com PUT /users/me quando necessário
  }, []);

  const deleteUser = useCallback((_id: string) => {
    console.warn('[AppContext] deleteUser ainda não integrado com a API.');
    // TODO: integrar com DELETE /users/:id quando necessário
  }, []);

  const value: AppContextType = {
    transactions,
    cards,
    categories,
    period,
    darkMode,
    showAddModal,
    showManageCards,
    notifications,
    showNotifications,
    unreadCount,
    toasts,
    users,
    currentUser,
    loading,
    summary,
    setPeriod,
    setDarkMode,
    setShowAddModal,
    setShowManageCards,
    setShowNotifications,
    addTransaction,
    deleteTransaction,
    updateTransaction: updateTransaction as any,
    addCard,
    updateCard,
    deleteCard,
    addCategory,
    updateCategory,
    deleteCategory,
    getFilteredTransactions,
    getSummary,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification,
    addNotification,
    showToast,
    dismissToast,
    loginUser,
    logoutUser,
    addUser,
    updateUser,
    deleteUser,
    refreshData,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}