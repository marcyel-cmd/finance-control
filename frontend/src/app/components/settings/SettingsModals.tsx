import React, { useState } from 'react';
import { Bell, Shield, Download, FileText, X, Check, Eye, EyeOff, Lock, ChevronRight } from 'lucide-react';
import { LoadingModal } from './LoadingModal';
import { authApi } from '../../services/auth.api';
import { apiFetch } from '../../services/api';

interface SettingsModalsProps {
  // Notifications
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  notifTransactions: boolean;
  setNotifTransactions: (val: boolean) => void;
  notifBills: boolean;
  setNotifBills: (val: boolean) => void;
  notifCards: boolean;
  setNotifCards: (val: boolean) => void;
  notifBudgets: boolean;
  setNotifBudgets: (val: boolean) => void;
  
  // Security
  showSecurity: boolean;
  setShowSecurity: (show: boolean) => void;
  currentPassword: string;
  setCurrentPassword: (val: string) => void;
  newPassword: string;
  setNewPassword: (val: string) => void;
  confirmPassword: string;
  setConfirmPassword: (val: string) => void;
  showCurrentPw: boolean;
  setShowCurrentPw: (val: boolean) => void;
  showNewPw: boolean;
  setShowNewPw: (val: boolean) => void;
  showConfirmPw: boolean;
  setShowConfirmPw: (val: boolean) => void;
  securityError: string;
  setSecurityError: (val: string) => void;
  
  // Export/Reports
  showExport: boolean;
  setShowExport: (show: boolean) => void;
  showReports: boolean;
  setShowReports: (show: boolean) => void;
  
  // Loading states
  showExportLoading: boolean;
  setShowExportLoading: (show: boolean) => void;
  showReportLoading: boolean;
  setShowReportLoading: (show: boolean) => void;
  exportFormat: string;
  setExportFormat: (format: string) => void;
  reportTitle: string;
  setReportTitle: (title: string) => void;
  
  // Callbacks
  showToast: (toast: { type: string; title: string; message: string }) => void;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
}

export function SettingsModals(props: SettingsModalsProps) {
  const {
    showNotifications, setShowNotifications,
    notifTransactions, setNotifTransactions,
    notifBills, setNotifBills,
    notifCards, setNotifCards,
    notifBudgets, setNotifBudgets,
    showSecurity, setShowSecurity,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showCurrentPw, setShowCurrentPw,
    showNewPw, setShowNewPw,
    showConfirmPw, setShowConfirmPw,
    securityError, setSecurityError,
    showExport, setShowExport,
    showReports, setShowReports,
    showExportLoading, setShowExportLoading,
    showReportLoading, setShowReportLoading,
    exportFormat, setExportFormat,
    reportTitle, setReportTitle,
    showToast,
    onExportCSV,
    onExportJSON,
  } = props;

  return (
    <>
      {/* Notifications Modal */}
      {showNotifications && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowNotifications(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-3xl w-full"
            style={{ maxWidth: '540px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A90D9]/20 to-[#A855F7]/10 border-b border-[#30363D] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#4A90D9]/20 flex items-center justify-center">
                    <Bell size={26} color="#4A90D9" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      Notificações
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Gerencie alertas e lembretes
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="w-9 h-9 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={18} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3.5">
              {[
                { id: 'transactions', label: 'Novas Transações', desc: 'Alerta ao adicionar nova transação', state: notifTransactions, setState: setNotifTransactions, icon: '💰', color: '#00D97E' },
                { id: 'bills', label: 'Contas a Pagar', desc: 'Lembrete 3 dias antes do vencimento', state: notifBills, setState: setNotifBills, icon: '📅', color: '#FFA502' },
                { id: 'cards', label: 'Limite de Cartão', desc: 'Alerta ao atingir 80% do limite', state: notifCards, setState: setNotifCards, icon: '💳', color: '#FF4757' },
                { id: 'budgets', label: 'Orçamentos', desc: 'Notificar gastos acima do previsto', state: notifBudgets, setState: setNotifBudgets, icon: '📊', color: '#4A90D9' },
              ].map((notif) => (
                <div key={notif.id} className="bg-[#0D1117] border border-[#21262D] rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: '24px' }}>{notif.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[#E6EDF3]" style={{ fontSize: '13px', fontWeight: 600 }}>
                        {notif.label}
                      </p>
                      <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                        {notif.desc}
                      </p>
                    </div>
                    <button
                      onClick={() => notif.setState(!notif.state)}
                      className="w-11 h-6 rounded-full flex items-center transition-all px-0.5"
                      style={{
                        background: notif.state ? notif.color : '#30363D',
                        justifyContent: notif.state ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div className="w-5 h-5 rounded-full bg-white shadow transition-all" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[#30363D] p-4">
              <button
                onClick={() => {
                  showToast({ type: 'success', title: 'Preferências salvas', message: 'Suas notificações foram atualizadas' });
                  setShowNotifications(false);
                }}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #4A90D9, #A855F7)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <Check size={16} />
                Salvar Preferências
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Modal - Change Password */}
      {showSecurity && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowSecurity(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-3xl w-full"
            style={{ maxWidth: '540px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00D97E]/20 to-[#4A90D9]/10 border-b border-[#30363D] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00D97E]/20 flex items-center justify-center">
                    <Shield size={26} color="#00D97E" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      Segurança
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Alterar senha da conta
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowSecurity(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setSecurityError('');
                  }}
                  className="w-9 h-9 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={18} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Error */}
              {securityError && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#FF4757]" />
                  <p style={{ fontSize: '11px', color: '#FF4757' }}>{securityError}</p>
                </div>
              )}

              {/* Current Password */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Senha Atual</label>
                <div className="relative">
                  <Lock size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={e => { setCurrentPassword(e.target.value); setSecurityError(''); }}
                    placeholder="Digite sua senha atual"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                  />
                  <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showCurrentPw ? <EyeOff size={14} color="#484F58" /> : <Eye size={14} color="#484F58" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Nova Senha</label>
                <div className="relative">
                  <Lock size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    value={newPassword}
                    onChange={e => { setNewPassword(e.target.value); setSecurityError(''); }}
                    placeholder="Mínimo 4 caracteres"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                  />
                  <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showNewPw ? <EyeOff size={14} color="#484F58" /> : <Eye size={14} color="#484F58" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ fontSize: '11px', color: '#7D8590', marginBottom: 4, display: 'block' }}>Confirmar Nova Senha</label>
                <div className="relative">
                  <Lock size={14} color="#484F58" className="absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => { setConfirmPassword(e.target.value); setSecurityError(''); }}
                    placeholder="Digite a senha novamente"
                    className="w-full pl-9 pr-10 py-2.5 rounded-lg outline-none"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '13px' }}
                  />
                  <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showConfirmPw ? <EyeOff size={14} color="#484F58" /> : <Eye size={14} color="#484F58" />}
                  </button>
                </div>
              </div>

              {/* Security Tips */}
              <div className="bg-gradient-to-br from-[#4A90D9]/10 to-[#A855F7]/5 border border-[#4A90D9]/20 rounded-xl p-4">
                <p className="text-[#4A90D9] mb-2" style={{ fontSize: '11px', fontWeight: 700 }}>
                  🔒 Dicas de Segurança
                </p>
                <ul className="space-y-1">
                  {[
                    'Use pelo menos 4 caracteres',
                    'Combine letras e números',
                    'Não compartilhe sua senha',
                    'Atualize regularmente',
                  ].map((tip, i) => (
                    <li key={i} className="text-[#7D8590] flex items-start gap-2" style={{ fontSize: '10px' }}>
                      <span className="text-[#00D97E]" style={{ fontSize: '8px' }}>●</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#30363D] p-4">
              <button
                onClick={async () => {
                  if (!currentPassword) { setSecurityError('Digite sua senha atual'); return; }
                  if (newPassword.length < 4) { setSecurityError('Nova senha deve ter no mínimo 4 caracteres'); return; }
                  if (newPassword !== confirmPassword) { setSecurityError('As senhas não coincidem'); return; }
                  try {
                    await apiFetch('/auth/change-password', {
                      method: 'POST',
                      body: { currentPassword, newPassword },
                    });
                    showToast({ type: 'success', title: 'Senha alterada!', message: 'Sua senha foi atualizada com sucesso' });
                    setShowSecurity(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setSecurityError('');
                  } catch (err: any) {
                    setSecurityError(err?.message || 'Senha atual incorreta');
                  }
                }}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00D97E, #4A90D9)',
                  color: '#FFF',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                <Shield size={16} />
                Alterar Senha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowExport(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-3xl w-full"
            style={{ maxWidth: '540px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#00D97E]/20 to-[#4A90D9]/10 border-b border-[#30363D] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#00D97E]/20 flex items-center justify-center">
                    <Download size={26} color="#00D97E" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      Exportar Dados
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Baixe suas transações
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExport(false)}
                  className="w-9 h-9 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={18} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3.5">
              <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                Escolha o formato para exportar seus dados financeiros:
              </p>

              {[
                { format: 'CSV', desc: 'Planilha compatível com Excel', icon: '📊', color: '#00D97E' },
                { format: 'PDF', desc: 'Relatório formatado para impressão', icon: '📄', color: '#4A90D9' },
                { format: 'JSON', desc: 'Dados completos em formato técnico', icon: '💾', color: '#A855F7' },
              ].map((option, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setExportFormat(option.format);
                    setShowExport(false);
                    if (option.format === 'CSV' && onExportCSV) {
                      onExportCSV();
                    } else if (option.format === 'JSON' && onExportJSON) {
                      onExportJSON();
                    } else {
                      showToast({
                        type: 'info',
                        title: `Export ${option.format}`,
                        message: `Exportação em ${option.format} estará disponível em breve`
                      });
                    }
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{
                    background: `${option.color}08`,
                    border: `1px solid ${option.color}25`,
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{option.icon}</span>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: '14px', fontWeight: 700, color: option.color }}>
                      {option.format}
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                      {option.desc}
                    </p>
                  </div>
                  <Download size={18} color={option.color} />
                </button>
              ))}

              {/* Info */}
              <div className="bg-gradient-to-br from-[#4A90D9]/10 to-[#A855F7]/5 border border-[#4A90D9]/20 rounded-xl p-4 mt-4">
                <p className="text-[#4A90D9] mb-1" style={{ fontSize: '11px', fontWeight: 700 }}>
                  📦 Dados Incluídos
                </p>
                <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                  Transações, cartões, categorias e estatísticas do período selecionado.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#30363D] p-4">
              <button
                onClick={() => setShowExport(false)}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: '#21262D',
                  border: '1px solid #30363D',
                  color: '#7D8590',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReports && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4 z-50"
          onClick={() => setShowReports(false)}
        >
          <div 
            className="bg-[#161B22] border border-[#30363D] rounded-3xl w-full"
            style={{ maxWidth: '540px' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#4A90D9]/20 to-[#A855F7]/10 border-b border-[#30363D] px-6 py-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#4A90D9]/20 flex items-center justify-center">
                    <FileText size={26} color="#4A90D9" />
                  </div>
                  <div>
                    <p className="text-[#E6EDF3]" style={{ fontSize: '18px', fontWeight: 700 }}>
                      Relatórios
                    </p>
                    <p className="text-[#7D8590]" style={{ fontSize: '12px', marginTop: '2px' }}>
                      Gere relatórios detalhados
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReports(false)}
                  className="w-9 h-9 rounded-lg hover:bg-[#30363D] flex items-center justify-center transition-colors"
                >
                  <X size={18} color="#7D8590" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-3.5">
              <p className="text-[#7D8590]" style={{ fontSize: '12px' }}>
                Selecione o tipo de relatório que deseja gerar:
              </p>

              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-1"
                style={{ background: 'rgba(255,165,2,0.08)', border: '1px solid rgba(255,165,2,0.2)' }}
              >
                <span style={{ fontSize: '13px' }}>🚧</span>
                <p style={{ fontSize: '11px', color: '#FFA502' }}>
                  Relatórios em PDF estarão disponíveis em breve. Use <strong>Exportar Dados → CSV</strong> para exportar agora.
                </p>
              </div>

              {[
                { title: 'Relatório Mensal', desc: 'Resumo completo do mês atual', icon: '📊', color: '#4A90D9', badge: 'Em breve' },
                { title: 'Análise de Gastos', desc: 'Gráficos e insights por categoria', icon: '📈', color: '#A855F7' },
                { title: 'Projeção Futura', desc: 'Estimativa baseada em histórico', icon: '🔮', color: '#00D97E' },
                { title: 'Comparativo Anual', desc: 'Compare meses do ano', icon: '📅', color: '#FFA502' },
              ].map((report, i) => (
                <button
                  key={i}
                  disabled
                  onClick={() => {
                    showToast({
                      type: 'info',
                      title: 'Em breve',
                      message: `${report.title} estará disponível em uma próxima versão`
                    });
                    setShowReports(false);
                  }}
                  className="w-full flex items-center gap-3 p-4 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                  style={{
                    background: `${report.color}08`,
                    border: `1px solid ${report.color}25`,
                  }}
                >
                  <span style={{ fontSize: '28px' }}>{report.icon}</span>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                      <p style={{ fontSize: '14px', fontWeight: 700, color: report.color }}>
                        {report.title}
                      </p>
                      {report.badge && (
                        <span 
                          className="px-2 py-0.5 rounded-md"
                          style={{ fontSize: '9px', fontWeight: 700, color: report.color, background: `${report.color}15`, border: `1px solid ${report.color}25` }}
                        >
                          {report.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                      {report.desc}
                    </p>
                  </div>
                  <ChevronRight size={18} color={report.color} />
                </button>
              ))}

              {/* Info */}
              <div className="bg-gradient-to-br from-[#00D97E]/10 to-[#4A90D9]/5 border border-[#00D97E]/20 rounded-xl p-4 mt-4">
                <p className="text-[#00D97E] mb-1" style={{ fontSize: '11px', fontWeight: 700 }}>
                  📝 Formato de Saída
                </p>
                <p className="text-[#7D8590]" style={{ fontSize: '11px' }}>
                  Todos os relatórios são gerados em PDF com gráficos e tabelas detalhadas.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#30363D] p-4">
              <button
                onClick={() => setShowReports(false)}
                className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: '#21262D',
                  border: '1px solid #30363D',
                  color: '#7D8590',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Modals */}
      <LoadingModal
        isOpen={showExportLoading}
        onClose={() => setShowExportLoading(false)}
        type="export"
        format={exportFormat}
      />
      
      <LoadingModal
        isOpen={showReportLoading}
        onClose={() => setShowReportLoading(false)}
        type="report"
        title={reportTitle}
      />
    </>
  );
}