export type TransactionType = 'entrada' | 'saida' | 'saida_futura' | 'previsto';
export type TransactionStatus = 'realizado' | 'previsto';
export type CardBrand = 'nubank' | 'picpay' | 'visa' | 'mastercard' | 'elo' | 'other';
export type CardType = 'credito' | 'debito';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  category: string;
  value: number;
  date: string;
  paymentMethod: string;
  cardId?: string;
  status: TransactionStatus;
  recurring: boolean;
  linkedPreviewId?: string;
  linkedBudgetId?: string; // ID do previsto vinculado (para saídas)
  month: number;
  year: number;
  installments?: number;
  installmentValue?: number;
  currentInstallment?: number;
  totalInstallmentValue?: number;
}

export interface CreditCard {
  id: string;
  name: string;
  lastDigits: string;
  brand: CardBrand;
  color: string;
  limit: number;
  used: number;
  closingDay: number;
  dueDay: number;
  type: CardType;
}

export interface MonthlyData {
  id?: string;
  month: string;
  monthNum: number;
  year: number;
  entradas: number;
  saidas: number;
  saldo: number;
  previsto: number;
}

export interface CategoryData {
  category: string;
  value: number;
  percentage: number;
  color: string;
}

export interface AppPeriod {
  month: number;
  year: number;
}

export type NotificationType = 'warning' | 'info' | 'success' | 'alert' | 'confirmation';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: string;
  read: boolean;
  icon: string;
  actionLabel?: string;
  actionRoute?: string;
  actionDone?: boolean;
  relatedAmount?: number;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  icon?: string;
}

export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export type UserRole = 'admin' | 'user';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  active: boolean;
}