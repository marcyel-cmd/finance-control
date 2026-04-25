import React, { useState } from 'react';
import {
  Moon, Sun, Shield, Bell, Download, HelpCircle, ChevronRight,
  User, Palette, Database, FileText, Monitor, Tag, Settings,
  Plus, Pencil, Trash2, Check, ChevronLeft, LogOut, Eye, EyeOff,
  Lock, Mail, UserPlus, Users, Crown, X, RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { Header } from '../components/layout/Header';
import { useApp } from '../context/AppContext';
import { useDeviceType } from '../hooks/useDeviceType';
import { Category, AppUser } from '../types';
import { SettingsModals } from '../components/settings/SettingsModals';
import { RecurringManagement } from '../components/finance/RecurringManagement';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

// ─── Reusable Components ──────────────────────────────────────────────────────

interface SettingItemProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

function SettingItem({ icon, iconBg, title, subtitle, rightElement, onClick, danger }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-[#1C2128] transition-all"
    >
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p style={{
          fontSize: '13px',
          fontWeight: 600,
          color: danger ? '#FF4757' : '#E6EDF3',
        }}>
          {title}
        </p>
        {subtitle && (
          <p style={{ fontSize: '11px', color: '#484F58', marginTop: 1 }}>{subtitle}</p>
        )}
      </div>
      {rightElement || <ChevronRight size={16} color="#30363D" />}
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="px-4 pt-4 pb-2">
      <p className="text-[#7D8590] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 600 }}>
        {title}
      </p>
    </div>
  );
}

// ─── Tab Types ────────────────────────────────────────────────────────────────

type MoreTab = 'config' | 'categories' | 'recurring';

// ─── Category Management Panel ────────────────────────────────────────────────

function CategoryManagement() {
  const { categories, addCategory, updateCategory, deleteCategory } = useApp();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newCat, setNewCat] = useState(false);
  const [form, setForm] = useState<Partial<Category>>({ label: '', icon: '📦', color: '#7D8590' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const PRESET_COLORS = ['#FF4757', '#FFA502', '#00D97E', '#4A90D9', '#A855F7', '#F59E0B', '#EC4899', '#7D8590'];
  const PRESET_ICONS = ['🍔', '🏠', '🚗', '💊', '🎓', '🎮', '💳', '🛒', '💼', '✈️', '📱', '🎵', '⚡', '🎁', '📦', '💰'];

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({ label: cat.label, icon: cat.icon, color: cat.color });
    setNewCat(false);
  };

  const startNew = () => {
    setNewCat(true);
    setEditingId(null);
    setForm({ label: '', icon: '📦', color: '#7D8590' });
  };

  const saveEdit = async () => {
    if (!form.label?.trim()) return;
    try {
      if (editingId) {
        await updateCategory({ id: editingId, label: form.label!, icon: form.icon || '📦', color: form.color || '#7D8590' });
        setEditingId(null);
      } else if (newCat) {
        const slug = form.label!.trim().toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        await addCategory({
          id: slug || `cat_${Date.now()}`,
          label: form.label!,
          icon: form.icon || '📦',
          color: form.color || '#7D8590',
        });
        setNewCat(false);
      }
      setForm({ label: '', icon: '📦', color: '#7D8590' });
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setNewCat(false);
    setForm({ label: '', icon: '📦', color: '#7D8590' });
  };

  const isEditing = editingId !== null || newCat;

  return (
    <div className="flex flex-col gap-4">
      {/* Add button */}
      <button
        onClick={startNew}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] transition-all"
        style={{
          background: 'rgba(0,217,126,0.08)',
          border: '1px solid rgba(0,217,126,0.25)',
          color: '#00D97E',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        <Plus size={16} />
        Nova Categoria
      </button>

      {/* Inline editor */}
      {isEditing && (
        <div
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{ background: '#161B22', border: '1px solid #30363D' }}
        >
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
            {editingId ? 'Editar Categoria' : 'Nova Categoria'}
          </p>
          {/* Name */}
          <input
            value={form.label || ''}
            onChange={e => setForm(p => ({ ...p, label: e.target.value }))}
            placeholder="Nome da categoria"
            className="w-full px-4 py-3 rounded-xl outline-none"
            style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
          />
          {/* Icons */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Ícone</p>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map(icon => (
                <button
                  key={icon}
                  onClick={() => setForm(p => ({ ...p, icon }))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center transition-all"
                  style={{
                    background: form.icon === icon ? '#21262D' : 'transparent',
                    border: form.icon === icon ? '1.5px solid #4A90D9' : '1.5px solid #30363D',
                    fontSize: '16px',
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          {/* Colors */}
          <div>
            <p style={{ fontSize: '11px', color: '#7D8590', marginBottom: 6 }}>Cor</p>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(p => ({ ...p, color }))}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                  style={{
                    background: color,
                    border: form.color === color ? '3px solid #E6EDF3' : '3px solid transparent',
                    boxShadow: form.color === color ? `0 0 8px ${color}60` : 'none',
                  }}
                >
                  {form.color === color && <Check size={14} color="#FFF" />}
                </button>
              ))}
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: '#0D1117' }}>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: `${form.color}15`, border: `1px solid ${form.color}25` }}
            >
              <span style={{ fontSize: '16px' }}>{form.icon}</span>
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
              {form.label || 'Nome da categoria'}
            </span>
          </div>
          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={cancelEdit}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center"
              style={{ background: '#21262D', border: '1px solid #30363D', color: '#7D8590', fontSize: '13px', fontWeight: 600 }}
            >
              Cancelar
            </button>
            <button
              onClick={saveEdit}
              className="flex-1 py-2.5 rounded-xl flex items-center justify-center gap-1"
              style={{
                background: 'rgba(0,217,126,0.15)',
                border: '1px solid rgba(0,217,126,0.3)',
                color: '#00D97E',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <Check size={14} />
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Category list */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#161B22', border: '1px solid #30363D' }}>
        {categories.map((cat, i) => (
          <div key={cat.id}>
            {i > 0 && <div className="border-t border-[#30363D]/50" />}
            <div className="flex items-center gap-3 px-4 py-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}25` }}
              >
                <span style={{ fontSize: '18px' }}>{cat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: '#E6EDF3' }}>
                  {cat.label}
                </p>
                <p style={{ fontSize: '10px', color: '#484F58' }}>{cat.id}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => startEdit(cat)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#4A90D9]/10 transition-all"
                >
                  <Pencil size={13} color="#4A90D9" />
                </button>
                {confirmDeleteId === cat.id ? (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={async () => { await deleteCategory(cat.id); setConfirmDeleteId(null); }}
                      className="px-2 py-1 rounded-md"
                      style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', fontSize: '10px', fontWeight: 600, color: '#FF4757' }}
                    >
                      Excluir
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-2 py-1 rounded-md"
                      style={{ background: '#21262D', border: '1px solid #30363D', fontSize: '10px', color: '#7D8590' }}
                    >
                      Não
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(cat.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#FF4757]/10 transition-all"
                  >
                    <Trash2 size={13} color="#FF4757" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Config Panel ─────────────────────────────────────────────────────────────

interface ConfigPanelProps {
  onShowAbout: () => void;
  onShowHelp: () => void;
}

function ConfigPanel({ onShowAbout, onShowHelp }: ConfigPanelProps) {
  const { transactions, cards, categories, currentUser, logoutUser, users, addUser, deleteUser, showToast } = useApp();
  const navigate = useNavigate();
  const deviceType = useDeviceType();
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [showNewUserPw, setShowNewUserPw] = useState(false);
  const [createError, setCreateError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // New states for modals
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showReports, setShowReports] = useState(false);
  
  // Notification settings — persisted to localStorage
  const loadNotifPref = (key: string, fallback: boolean) => {
    const v = localStorage.getItem(`fc_notif_${key}`);
    return v === null ? fallback : v === 'true';
  };
  const [notifTransactions, setNotifTransactions] = useState(() => loadNotifPref('transactions', true));
  const [notifBills, setNotifBills] = useState(() => loadNotifPref('bills', true));
  const [notifCards, setNotifCards] = useState(() => loadNotifPref('cards', true));
  const [notifBudgets, setNotifBudgets] = useState(() => loadNotifPref('budgets', false));
  
  // Security states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [securityError, setSecurityError] = useState('');

  // Loading states
  const [showExportLoading, setShowExportLoading] = useState(false);
  const [showReportLoading, setShowReportLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState('');
  const [reportTitle, setReportTitle] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  // ─── Export functions ──────────────────────────────────────────────────────

  const handleExportCSV = () => {
    const headers = ['Data', 'Descri\u00E7\u00E3o', 'Tipo', 'Valor', 'Status', 'Categoria'];
    const rows = transactions.map(t => [
      // [MORE-01] FIX: Transaction não tem campo 'day' — extrair do campo 'date' (ISO "YYYY-MM-DD")
      (() => { const [y, m, d] = (t.date || '').split('-'); return `${d || '??'}/${m || '??'}/${y || t.year}`; })(),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.type,
      t.value.toFixed(2).replace('.', ','),
      t.status,
      t.category || '',
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preve_transacoes_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'CSV exportado!', message: `${transactions.length} transa\u00E7\u00F5es baixadas` });
  };

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      transactions: transactions.map(t => ({
        id: t.id, description: t.description, value: t.value,
        type: t.type, status: t.status, category: t.category,
        // [MORE-02] FIX: usar t.date diretamente (já é ISO "YYYY-MM-DD"); t.day não existe no tipo
        date: t.date,
      })),
      cards: cards.map(c => ({ id: c.id, name: c.name, brand: c.brand, limit: c.limit, used: c.used })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `preve_dados_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ type: 'success', title: 'JSON exportado!', message: 'Dados completos baixados' });
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleCreateUser = () => {
    if (!newUserName.trim()) { setCreateError('Informe o nome'); return; }
    if (!newUserEmail.includes('@')) { setCreateError('E-mail inválido'); return; }
    if (newUserPassword.length < 4) { setCreateError('Senha deve ter no mínimo 4 caracteres'); return; }
    if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase())) {
      setCreateError('Este e-mail já está cadastrado');
      return;
    }
    setCreateError('');
    addUser({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole,
      active: true,
    });
    showToast({ type: 'success', title: 'Usuário criado', message: `${newUserName} foi adicionado com sucesso` });
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    setShowCreateUser(false);
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser?.id) return;
    const u = users.find(user => user.id === id);
    deleteUser(id);
    showToast({ type: 'success', title: 'Usuário removido', message: `${u?.name} foi removido` });
    setConfirmDeleteId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Perfil */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center relative"
            style={{
              background: isAdmin
                ? 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(74,144,217,0.15))'
                : 'linear-gradient(135deg, rgba(0,217,126,0.2), rgba(74,144,217,0.15))',
              border: isAdmin ? '1px solid rgba(168,85,247,0.3)' : '1px solid rgba(0,217,126,0.3)',
            }}
          >
            <span style={{ fontSize: '20px', fontWeight: 800, color: isAdmin ? '#A855F7' : '#00D97E', letterSpacing: -1 }}>
              {currentUser?.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'PV'}
            </span>
            {isAdmin && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: '#A855F7', border: '2px solid #161B22' }}
              >
                <Crown size={10} color="#FFF" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3' }}>
                {currentUser?.name || 'Usuário Preve'}
              </p>
              {isAdmin && (
                <span
                  className="px-2 py-0.5 rounded-md"
                  style={{ fontSize: '9px', fontWeight: 700, color: '#A855F7', background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.25)' }}
                >
                  ADMIN
                </span>
              )}
            </div>
            <p style={{ fontSize: '12px', color: '#7D8590' }}>{currentUser?.email || 'Plano Gratuito'}</p>
          </div>
        </div>
      </div>

      {/* ── Admin: User Management ── */}
      {isAdmin && (
        <div className="bg-gradient-to-br from-[#A855F7]/10 to-[#4A90D9]/5 border border-[#A855F7]/25 rounded-2xl overflow-hidden">
          <div className="px-4 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users size={14} color="#A855F7" />
              <p className="text-[#A855F7] uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 600 }}>
                Gerenciar Usuários
              </p>
            </div>
            <span
              className="px-2 py-0.5 rounded-md"
              style={{ fontSize: '10px', fontWeight: 600, color: '#7D8590', background: '#21262D' }}
            >
              {users.length} {users.length === 1 ? 'usuário' : 'usuários'}
            </span>
          </div>

          {/* Create user button */}
          <div className="px-4 pb-3 pt-1">
            <button
              onClick={() => setShowCreateUser(!showCreateUser)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.98] transition-all"
              style={{
                background: showCreateUser ? '#21262D' : 'rgba(168,85,247,0.1)',
                border: `1px solid ${showCreateUser ? '#30363D' : 'rgba(168,85,247,0.3)'}`,
                color: showCreateUser ? '#7D8590' : '#A855F7',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {showCreateUser ? (
                <><X size={14} /> Cancelar</>
              ) : (
                <><UserPlus size={15} /> Criar Novo Usuário</>
              )}
            </button>
          </div>

          {/* Create user form */}
          {showCreateUser && (
            <div className="px-4 pb-4">
              <div
                className="rounded-xl p-4 flex flex-col gap-3"
                style={{ background: '#161B22', border: '1px solid #30363D' }}
              >
                {/* Error */}
                {createError && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
                    <p style={{ fontSize: '11px', color: '#FF4757' }}>{createError}</p>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Nome</label>
                  <div className="relative">
                    <User size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={newUserName}
                      onChange={e => { setNewUserName(e.target.value); setCreateError(''); }}
                      placeholder="Nome completo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none"
                      style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = '#30363D'; }}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>E-mail</label>
                  <div className="relative">
                    <Mail size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={e => { setNewUserEmail(e.target.value); setCreateError(''); }}
                      placeholder="email@preve.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none"
                      style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = '#30363D'; }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Senha</label>
                  <div className="relative">
                    <Lock size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showNewUserPw ? 'text' : 'password'}
                      value={newUserPassword}
                      onChange={e => { setNewUserPassword(e.target.value); setCreateError(''); }}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-9 pr-10 py-2.5 rounded-lg outline-none"
                      style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = '#30363D'; }}
                    />
                    <button onClick={() => setShowNewUserPw(!showNewUserPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                      {showNewUserPw ? <EyeOff size={14} color="#484F58" /> : <Eye size={14} color="#484F58" />}
                    </button>
                  </div>
                </div>

                {/* Role picker */}
                <div>
                  <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Permissão</label>
                  <div className="flex gap-2">
                    {[
                      { id: 'user' as const, label: 'Usuário', icon: User, color: '#4A90D9' },
                      { id: 'admin' as const, label: 'Admin', icon: Crown, color: '#A855F7' },
                    ].map(role => (
                      <button
                        key={role.id}
                        onClick={() => setNewUserRole(role.id)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
                        style={{
                          background: newUserRole === role.id ? `${role.color}15` : '#0D1117',
                          border: `1.5px solid ${newUserRole === role.id ? `${role.color}50` : '#30363D'}`,
                          color: newUserRole === role.id ? role.color : '#484F58',
                          fontSize: '12px',
                          fontWeight: newUserRole === role.id ? 600 : 400,
                        }}
                      >
                        <role.icon size={13} />
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleCreateUser}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                    color: '#FFF',
                    fontSize: '13px',
                    fontWeight: 700,
                  }}
                >
                  <UserPlus size={15} />
                  Criar Usuário
                </button>
              </div>
            </div>
          )}

          {/* User list */}
          <div className="px-4 pb-4">
            <div className="rounded-xl overflow-hidden" style={{ background: '#161B22', border: '1px solid #30363D' }}>
              {users.map((user, i) => (
                <div key={user.id}>
                  {i > 0 && <div className="border-t border-[#30363D]/50" />}
                  <div className="flex items-center gap-3 px-3 py-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: user.role === 'admin' ? 'rgba(168,85,247,0.15)' : 'rgba(74,144,217,0.15)',
                        border: `1px solid ${user.role === 'admin' ? 'rgba(168,85,247,0.25)' : 'rgba(74,144,217,0.25)'}`,
                      }}
                    >
                      {user.role === 'admin' ? <Crown size={14} color="#A855F7" /> : <User size={14} color="#4A90D9" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate" style={{ fontSize: '12px', fontWeight: 600, color: '#E6EDF3' }}>
                          {user.name}
                        </p>
                        {user.id === currentUser?.id && (
                          <span style={{ fontSize: '9px', color: '#00D97E', fontWeight: 600 }}>(você)</span>
                        )}
                      </div>
                      <p className="truncate" style={{ fontSize: '10px', color: '#484F58' }}>{user.email}</p>
                    </div>
                    {user.id !== currentUser?.id && (
                      confirmDeleteId === user.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="px-2 py-1 rounded-md"
                            style={{ background: 'rgba(255,71,87,0.15)', border: '1px solid rgba(255,71,87,0.3)', fontSize: '10px', fontWeight: 600, color: '#FF4757' }}
                          >
                            Confirmar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md"
                            style={{ background: '#21262D', border: '1px solid #30363D', fontSize: '10px', color: '#7D8590' }}
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(user.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[#FF4757]/10 transition-all"
                        >
                          <Trash2 size={12} color="#FF4757" />
                        </button>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notificações & Segurança */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
        <SectionHeader title="Geral" />
        <SettingItem
          icon={<Bell size={17} color="#4A90D9" />}
          iconBg="bg-[#4A90D9]/15"
          title="Notificações"
          subtitle="Alertas e lembretes"
          onClick={() => setShowNotifications(true)}
        />
        <div className="border-t border-[#30363D]/50" />
        <SettingItem
          icon={<Shield size={17} color="#00D97E" />}
          iconBg="bg-[#00D97E]/15"
          title="Segurança"
          subtitle="Biometria e PIN"
          onClick={() => setShowSecurity(true)}
        />
      </div>

      {/* Dados */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
        <SectionHeader title="Dados" />
        <SettingItem
          icon={<FileText size={17} color="#4A90D9" />}
          iconBg="bg-[#4A90D9]/15"
          title="Relatórios"
          subtitle="Gerar relatório mensal"
          onClick={() => setShowReports(true)}
        />
        <div className="border-t border-[#30363D]/50" />
        <SettingItem
          icon={<Download size={17} color="#00D97E" />}
          iconBg="bg-[#00D97E]/15"
          title="Exportar Dados"
          subtitle="CSV ou PDF"
          onClick={() => setShowExport(true)}
        />
      </div>

      {/* Suporte */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
        <SectionHeader title="Suporte" />
        <SettingItem
          icon={<HelpCircle size={17} color="#7D8590" />}
          iconBg="bg-[#30363D]"
          title="Ajuda & FAQ"
          subtitle="Tire suas dúvidas"
          onClick={onShowHelp}
        />
        <div className="border-t border-[#30363D]/50" />
        <SettingItem
          icon={<User size={17} color="#7D8590" />}
          iconBg="bg-[#30363D]"
          title="Sobre o App"
          subtitle="Preve v2.1.0"
          onClick={onShowAbout}
        />
      </div>

      {/* Estatísticas */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl p-4">
        <p className="text-[#7D8590] mb-3 uppercase tracking-wider" style={{ fontSize: '11px', fontWeight: 600 }}>
          Estatísticas
        </p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Transações', value: transactions.length, color: '#4A90D9' },
            { label: 'Cartões', value: cards.length, color: '#A855F7' },
            { label: 'Categorias', value: categories.length, color: '#F59E0B' },
            { label: 'Meses', value: 6, color: '#00D97E' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1C2128] rounded-xl p-3 text-center">
              <p style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</p>
              <p className="text-[#7D8590]" style={{ fontSize: '10px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Device Info */}
      <div className="bg-gradient-to-br from-[#4A90D9]/20 to-[#A855F7]/10 border border-[#4A90D9]/30 rounded-2xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#4A90D9]/20 flex items-center justify-center">
            <Monitor size={18} color="#4A90D9" />
          </div>
          <div>
            <p className="text-[#E6EDF3]" style={{ fontSize: '14px', fontWeight: 600 }}>
              Dispositivo Detectado
            </p>
            <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
              Layout otimizado automaticamente
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { type: 'mobile', label: 'Mobile', icon: '📱', active: deviceType === 'mobile' },
            { type: 'tablet', label: 'Tablet', icon: '📱', active: deviceType === 'tablet' },
            { type: 'desktop', label: 'Desktop', icon: '🖥️', active: deviceType === 'desktop' },
          ].map((device) => (
            <div
              key={device.type}
              className="bg-[#1C2128] rounded-xl p-2.5 text-center transition-all"
              style={{
                border: device.active ? '2px solid #4A90D9' : '2px solid transparent',
                opacity: device.active ? 1 : 0.4,
              }}
            >
              <p style={{ fontSize: '20px' }}>{device.icon}</p>
              <p style={{
                fontSize: '10px',
                fontWeight: device.active ? 700 : 400,
                color: device.active ? '#4A90D9' : '#7D8590',
              }}>
                {device.label}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 bg-[#1C2128] rounded-xl p-3">
          <div className="flex items-center justify-between">
            <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>Largura da tela:</span>
            <span className="text-[#4A90D9]" style={{ fontSize: '11px', fontWeight: 700 }}>
              {typeof window !== 'undefined' && `${window.innerWidth}px`}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-[#7D8590]" style={{ fontSize: '11px' }}>Modo:</span>
            <span className="text-[#00D97E]" style={{ fontSize: '11px', fontWeight: 700 }}>
              {deviceType === 'desktop' ? 'Sidebar + Grid' : deviceType === 'tablet' ? 'Bottom Nav + Tablet' : 'Bottom Nav + FAB'}
            </span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <div className="bg-[#161B22] border border-[#30363D] rounded-2xl overflow-hidden">
        <SettingItem
          icon={<LogOut size={17} color="#FF4757" />}
          iconBg="bg-[#FF4757]/15"
          title="Sair da conta"
          subtitle="Encerrar sessão"
          onClick={handleLogout}
          danger
          rightElement={<ChevronRight size={16} color="#FF4757" />}
        />
      </div>

      {/* Version */}
      <div className="text-center py-2">
        <p className="text-[#484F58]" style={{ fontSize: '11px' }}>Preve © 2026 · v2.1.0</p>
        <p className="text-[#484F58]" style={{ fontSize: '10px', marginTop: '2px' }}>
          Controle Financeiro Inteligente
        </p>
      </div>

      {/* Settings Modals */}
      <SettingsModals
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifTransactions={notifTransactions}
        setNotifTransactions={setNotifTransactions}
        notifBills={notifBills}
        setNotifBills={setNotifBills}
        notifCards={notifCards}
        setNotifCards={setNotifCards}
        notifBudgets={notifBudgets}
        setNotifBudgets={setNotifBudgets}
        showSecurity={showSecurity}
        setShowSecurity={setShowSecurity}
        currentPassword={currentPassword}
        setCurrentPassword={setCurrentPassword}
        newPassword={newPassword}
        setNewPassword={setNewPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showCurrentPw={showCurrentPw}
        setShowCurrentPw={setShowCurrentPw}
        showNewPw={showNewPw}
        setShowNewPw={setShowNewPw}
        showConfirmPw={showConfirmPw}
        setShowConfirmPw={setShowConfirmPw}
        securityError={securityError}
        setSecurityError={setSecurityError}
        showExport={showExport}
        setShowExport={setShowExport}
        showReports={showReports}
        setShowReports={setShowReports}
        showToast={showToast}
        showExportLoading={showExportLoading}
        setShowExportLoading={setShowExportLoading}
        showReportLoading={showReportLoading}
        setShowReportLoading={setShowReportLoading}
        exportFormat={exportFormat}
        setExportFormat={setExportFormat}
        reportTitle={reportTitle}
        setReportTitle={setReportTitle}
        onExportCSV={handleExportCSV}
        onExportJSON={handleExportJSON}
      />
    </div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export function MoreScreen() {
  const [activeTab, setActiveTab] = useState<MoreTab>('config');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  return (
    <div className="flex flex-col">
      <Header
        title={
          activeTab === 'config' ? 'Configurações' :
          activeTab === 'categories' ? 'Categorias' : 'Recorrências'
        }
        subtitle={
          activeTab === 'config' ? 'Personalização e conta' :
          activeTab === 'categories' ? 'Gerencie suas categorias' :
          'Lançamentos automáticos das contas fixas'
        }
      />

      {/* Tab Switcher */}
      <div className="px-4 pt-2 pb-3">
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: '#161B22', border: '1px solid #30363D' }}>
          {[
            { id: 'config' as MoreTab, icon: <Settings size={14} />, label: 'Config' },
            { id: 'categories' as MoreTab, icon: <Tag size={14} />, label: 'Categorias' },
            { id: 'recurring' as MoreTab, icon: <RefreshCw size={14} />, label: 'Recorrências' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg transition-all"
              style={{
                background: activeTab === tab.id ? '#21262D' : 'transparent',
                color: activeTab === tab.id ? '#E6EDF3' : '#484F58',
                fontSize: '12px',
                fontWeight: activeTab === tab.id ? 600 : 400,
                border: activeTab === tab.id ? '1px solid #30363D' : '1px solid transparent',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28" style={{ scrollbarWidth: 'none' }}>
        {activeTab === 'config' && <ConfigPanel onShowAbout={setShowAboutModal} onShowHelp={setShowHelpModal} />}
        {activeTab === 'categories' && <CategoryManagement />}
        {activeTab === 'recurring' && <RecurringManagement />}
      </div>

      {/* About Modal */}
      {showAboutModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowAboutModal(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div 
              className="sticky top-0 bg-gradient-to-r from-[#4A90D9]/20 to-[#00D97E]/10 border-b border-[#30363D] px-5 py-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00D97E] to-[#4A90D9] flex items-center justify-center">
                    <span style={{ fontSize: '24px', fontWeight: 800, color: '#FFF' }}>💰</span>
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 700 }}>
                      FinanceControl
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                      Versão 2.1.0 • 2026
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAboutModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={16} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Description */}
              <div>
                <p className="text-[#E6EDF3] leading-relaxed" style={{ fontSize: '13px' }}>
                  <strong className="text-[#00D97E]">FinanceControl</strong> é um aplicativo de <strong>controle financeiro pessoal inteligente</strong>, projetado para ajudar você a gerenciar suas finanças de forma simples, organizada e eficiente.
                </p>
              </div>

              {/* Features */}
              <div>
                <p className="text-[#7D8590] uppercase tracking-wider mb-3" style={{ fontSize: '10px', fontWeight: 700 }}>
                  Recursos Principais
                </p>
                <div className="space-y-2.5">
                  {[
                    { icon: '📊', title: 'Dashboard Inteligente', desc: 'Visão completa das suas finanças em tempo real' },
                    { icon: '💳', title: 'Gestão de Cartões', desc: 'Controle de limites e faturas de múltiplos cartões' },
                    { icon: '📈', title: 'Análises Detalhadas', desc: 'Gráficos e insights sobre seus gastos' },
                    { icon: '⏱', title: 'Gastos Previstos', desc: 'Planeje e acompanhe seus orçamentos mensais' },
                    { icon: '🔄', title: 'Parcelamento', desc: 'Controle total de compras parceladas' },
                    { icon: '🏷️', title: 'Categorias Personalizadas', desc: 'Organize suas transações do seu jeito' },
                  ].map((feature, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-[#0D1117] border border-[#21262D]">
                      <span style={{ fontSize: '20px' }}>{feature.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[#E6EDF3]" style={{ fontSize: '12px', fontWeight: 600 }}>
                          {feature.title}
                        </p>
                        <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                          {feature.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tech Stack */}
              <div>
                <p className="text-[#7D8590] uppercase tracking-wider mb-3" style={{ fontSize: '10px', fontWeight: 700 }}>
                  Tecnologias
                </p>
                <div className="flex flex-wrap gap-2">
                  {['React', 'TypeScript', 'Tailwind CSS', 'Material Design 3', 'Recharts'].map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-lg text-[#4A90D9] bg-[#4A90D9]/10 border border-[#4A90D9]/25"
                      style={{ fontSize: '10px', fontWeight: 600 }}
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Info */}
              <div className="bg-gradient-to-br from-[#00D97E]/10 to-[#4A90D9]/5 border border-[#00D97E]/20 rounded-xl p-4">
                <p className="text-[#00D97E] mb-1" style={{ fontSize: '11px', fontWeight: 700 }}>
                  🎯 Nossa Missão
                </p>
                <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                  Tornar o controle financeiro acessível e intuitivo para todos, ajudando você a tomar decisões mais inteligentes sobre seu dinheiro.
                </p>
              </div>

              {/* Footer */}
              <div className="text-center pt-2 border-t border-[#30363D]">
                <p className="text-[#484F58]" style={{ fontSize: '11px' }}>
                  Desenvolvido com 💚 para ajudar você
                </p>
                <p className="text-[#484F58] mt-1" style={{ fontSize: '10px' }}>
                  © 2026 FinanceControl • Todos os direitos reservados
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="sticky bottom-0 bg-[#161B22] border-t border-[#30363D] p-4">
              <button
                onClick={() => setShowAboutModal(false)}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00D97E, #4A90D9)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <Check size={16} />
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-2xl max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#FFA502]/20 to-[#4A90D9]/10 border-b border-[#30363D] px-5 py-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFA502]/20 flex items-center justify-center">
                    <HelpCircle size={24} color="#FFA502" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '16px', fontWeight: 700 }}>
                      Ajuda & FAQ
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                      Perguntas frequentes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={16} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* FAQ Content */}
            <div className="p-5 space-y-3">
              {[
                {
                  q: 'Como adicionar uma transação?',
                  a: 'Toque no botão + (flutuante no mobile ou na barra lateral no desktop) e preencha os dados da transação. Você pode adicionar parcelamento, categorias e vincular a gastos previstos.',
                  icon: '💰',
                },
                {
                  q: 'Como funcionam os Gastos Previstos?',
                  a: 'Crie gastos previstos para planejar seu orçamento mensal. Ao lançar transações reais, vincule-as ao gasto previsto para acompanhar quanto já foi utilizado.',
                  icon: '⏱',
                },
                {
                  q: 'Posso parcelar uma compra?',
                  a: 'Sim! Ao adicionar uma transação, ative a opção "Parcelar" e defina o número de parcelas. O sistema criará automaticamente todas as parcelas futuras.',
                  icon: '🔄',
                },
                {
                  q: 'Como gerenciar cartões de crédito?',
                  a: 'Na aba Cartões, você pode adicionar cartões, definir limites, datas de fechamento e vencimento. O app calcula automaticamente o limite disponível.',
                  icon: '💳',
                },
                {
                  q: 'Posso criar categorias personalizadas?',
                  a: 'Sim! Na aba Mais > Categorias, você pode criar, editar e excluir categorias com ícones e cores personalizadas.',
                  icon: '🏷️',
                },
                {
                  q: 'Como alterar o período exibido?',
                  a: 'Use o seletor de mês/ano no topo das telas para navegar entre diferentes períodos e visualizar histórico.',
                  icon: '📅',
                },
              ].map((faq, i) => (
                <div key={i} className="bg-[#0D1117] border border-[#21262D] rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-2">
                    <span style={{ fontSize: '20px' }}>{faq.icon}</span>
                    <p className="text-[#E6EDF3] flex-1" style={{ fontSize: '12px', fontWeight: 600 }}>
                      {faq.q}
                    </p>
                  </div>
                  <p className="text-[#7D8590] pl-9" style={{ fontSize: '11px', lineHeight: 1.5 }}>
                    {faq.a}
                  </p>
                </div>
              ))}

              {/* Contact Support */}
              <div className="bg-gradient-to-br from-[#4A90D9]/10 to-[#A855F7]/5 border border-[#4A90D9]/20 rounded-xl p-4 mt-4">
                <p className="text-[#4A90D9] mb-1" style={{ fontSize: '11px', fontWeight: 700 }}>
                  💬 Ainda tem dúvidas?
                </p>
                <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                  Entre em contato com nosso suporte através do e-mail: <strong className="text-[#E6EDF3]">suporte@financecontrol.com</strong>
                </p>
              </div>
            </div>

            {/* Action Button */}
            <div className="sticky bottom-0 bg-[#161B22] border-t border-[#30363D] p-4">
              <button
                onClick={() => setShowHelpModal(false)}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #FFA502, #F59E0B)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <Check size={16} />
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}