import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router';
import {
  Mail, Lock, Eye, EyeOff, ArrowRight, Shield, TrendingUp, Wallet,
  Fingerprint, ChevronRight, X, ArrowLeft, KeyRound, CheckCircle2
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { authApi } from '../services/auth.api';

// ─── Animated Background ─────────────────────────────────────────────────────

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <style>{`
        @keyframes float-orb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -40px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.95); }
          75% { transform: translate(15px, 35px) scale(1.05); }
        }
        @keyframes grid-pulse {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
      `}</style>
      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(74,144,217,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,144,217,0.04) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          animation: 'grid-pulse 8s ease-in-out infinite',
        }}
      />
      {/* Orbs */}
      <div
        className="absolute rounded-full"
        style={{
          width: 300, height: 300, top: '-10%', right: '-15%',
          background: 'radial-gradient(circle, rgba(0,217,126,0.12), transparent 70%)',
          animation: 'float-orb 12s ease-in-out infinite',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 250, height: 250, bottom: '5%', left: '-10%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.1), transparent 70%)',
          animation: 'float-orb 15s ease-in-out infinite',
          animationDelay: '-5s',
          filter: 'blur(40px)',
        }}
      />
      <div
        className="absolute rounded-full"
        style={{
          width: 200, height: 200, top: '40%', left: '50%',
          background: 'radial-gradient(circle, rgba(74,144,217,0.08), transparent 70%)',
          animation: 'float-orb 10s ease-in-out infinite',
          animationDelay: '-3s',
          filter: 'blur(40px)',
        }}
      />
    </div>
  );
}

// ─── Biometric Overlay ───────────────────────────────────────────────────────

function BiometricOverlay({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const duration = 2800;
    const interval = 30;
    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += interval;
      const p = Math.min(1, elapsed / duration);
      setProgress(p);
      if (p >= 1) {
        clearInterval(timer);
        setSuccess(true);
        setTimeout(() => onSuccess(), 1200);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [onSuccess]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)' }}
      onClick={!success ? onClose : undefined}
    >
      <style>{`
        @keyframes orbit-spin-bio {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes orbit-spin-r-bio {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes bio-ring-scale {
          0%, 100% { transform: scale(1); opacity: 0.15; }
          50% { transform: scale(1.06); opacity: 0.35; }
        }
        @keyframes bio-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(168,85,247,0.2), 0 0 60px rgba(168,85,247,0.1); }
          50% { box-shadow: 0 0 50px rgba(168,85,247,0.35), 0 0 90px rgba(168,85,247,0.15); }
        }
        @keyframes bio-success-pop {
          0% { transform: scale(0); }
          70% { transform: scale(1.15); }
          100% { transform: scale(1); }
        }
        @keyframes bio-check-draw {
          0% { stroke-dashoffset: 30; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>

      <div
        className="relative flex items-center justify-center"
        style={{ width: 300, height: 300 }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Orbital dashed rings (SVG lines spinning) ── */}
        <svg
          className="absolute inset-0"
          width="300" height="300"
          viewBox="0 0 300 300"
          fill="none"
          style={{ overflow: 'visible' }}
        >
          {/* Ring 1 — fast, clockwise */}
          <g style={{ transformOrigin: '150px 150px', animation: 'orbit-spin-bio 4s linear infinite' }}>
            <circle
              cx="150" cy="150" r="108"
              stroke="#A855F7" strokeWidth="1" strokeDasharray="10 8"
              fill="none" opacity="0.3"
            />
          </g>
          {/* Ring 2 — medium, counter-clockwise */}
          <g style={{ transformOrigin: '150px 150px', animation: 'orbit-spin-r-bio 6s linear infinite' }}>
            <circle
              cx="150" cy="150" r="128"
              stroke="#A855F7" strokeWidth="1" strokeDasharray="14 10"
              fill="none" opacity="0.2"
            />
          </g>
          {/* Ring 3 — slow, clockwise */}
          <g style={{ transformOrigin: '150px 150px', animation: 'orbit-spin-bio 8s linear infinite' }}>
            <circle
              cx="150" cy="150" r="148"
              stroke="#A855F7" strokeWidth="0.8" strokeDasharray="6 12"
              fill="none" opacity="0.12"
            />
          </g>
        </svg>

        {/* ── Pulse rings (expanding/fading lines) ── */}
        {[
          { size: 180, delay: '0s' },
          { size: 220, delay: '0.4s' },
          { size: 260, delay: '0.8s' },
        ].map((r, i) => (
          <div
            key={`pulse-${i}`}
            className="absolute rounded-full"
            style={{
              width: r.size, height: r.size,
              border: '1px solid rgba(168,85,247,0.2)',
              animation: `bio-ring-scale 2s ease-in-out infinite`,
              animationDelay: r.delay,
            }}
          />
        ))}

        {/* ── Center circle ── */}
        <div
          className="relative rounded-full flex items-center justify-center"
          style={{
            width: 144, height: 144,
            background: success
              ? 'linear-gradient(135deg, rgba(0,217,126,0.3), rgba(0,217,126,0.1))'
              : 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(74,144,217,0.15))',
            border: success ? '2px solid rgba(0,217,126,0.25)' : '2px solid rgba(168,85,247,0.25)',
            animation: success ? undefined : 'bio-glow 2s ease-in-out infinite',
            transition: 'all 0.5s ease',
          }}
        >
          {success ? (
            <div style={{ animation: 'bio-success-pop 0.5s ease-out forwards' }}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <circle cx="32" cy="32" r="28" fill="rgba(0,217,126,0.15)" stroke="#00D97E" strokeWidth="2" />
                <path
                  d="M20 32 L28 40 L44 24"
                  stroke="#00D97E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                  fill="none"
                  strokeDasharray="30"
                  style={{ animation: 'bio-check-draw 0.6s ease-out 0.3s forwards', strokeDashoffset: 30 }}
                />
              </svg>
            </div>
          ) : (
            <div className="relative">
              {/* Base fingerprint */}
              <Fingerprint size={64} color="#A855F7" style={{ opacity: 0.35, filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.3))' }} />
              {/* Progressive reveal */}
              <div className="absolute inset-0" style={{ clipPath: `inset(${100 - progress * 100}% 0 0 0)` }}>
                <Fingerprint
                  size={64}
                  color="#FFFFFF"
                  style={{
                    filter: `drop-shadow(0 0 ${4 + progress * 12}px rgba(255,255,255,${0.3 + progress * 0.4}))`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status text */}
      <div className="mt-8 text-center">
        {success ? (
          <>
            <p style={{ fontSize: '18px', fontWeight: 700, color: '#00D97E' }}>Identidade confirmada!</p>
            <p style={{ fontSize: '13px', color: '#7D8590', marginTop: 4 }}>Redirecionando...</p>
          </>
        ) : (
          <>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#E6EDF3' }}>Lendo biometria...</p>
            <p style={{ fontSize: '12px', color: '#7D8590', marginTop: 4 }}>Posicione o dedo no sensor</p>
          </>
        )}
      </div>

      {/* Progress bar */}
      {!success && (
        <div className="w-48 h-1 rounded-full mt-6" style={{ background: '#21262D' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${progress * 100}%`,
            background: 'linear-gradient(90deg, #A855F7, #4A90D9)',
          }} />
        </div>
      )}
    </div>
  );
}

// ─── Forgot Password Modal ───────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for resend
  useEffect(() => {
    if (step !== 2 || timer <= 0) return;
    const t = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [step, timer]);

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + '*'.repeat(Math.max(b.length, 2)) + c)
    : '';

  const passwordStrength = (() => {
    let score = 0;
    if (newPassword.length >= 6) score++;
    if (newPassword.length >= 8) score++;
    if (/[A-Z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    return Math.min(4, score);
  })();

  const strengthLabels = ['', 'Fraca', 'Regular', 'Boa', 'Forte'];
  const strengthColors = ['', '#FF4757', '#FFA502', '#4A90D9', '#00D97E'];

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) newCode[i] = pasted[i];
    setCode(newCode);
    const focusIdx = Math.min(pasted.length, 5);
    codeRefs.current[focusIdx]?.focus();
  };

  const handleStep1 = () => {
    if (!email.includes('@')) { setError('E-mail inválido'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); setTimer(60); }, 1500);
  };

  const handleStep2 = () => {
    if (code.some(c => !c)) { setError('Preencha todos os dígitos'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(3); }, 1200);
  };

  const handleStep3 = () => {
    if (newPassword.length < 6) { setError('A senha deve ter pelo menos 6 caracteres'); return; }
    if (newPassword !== confirmPassword) { setError('As senhas não coincidem'); return; }
    setError('');
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(4); }, 1200);
  };

  const stepTitles = ['', 'Recuperar senha', 'Verificar código', 'Nova senha', 'Tudo certo!'];
  const stepSubtitles = ['', 'Informe seu e-mail cadastrado', `Código enviado para ${maskedEmail}`, 'Crie uma nova senha segura', 'Use sua nova senha para fazer login'];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-1/2 z-50 w-full flex flex-col"
        style={{
          maxWidth: 400,
          transform: 'translateX(-50%)',
          background: '#161B22',
          border: '1px solid #30363D',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          maxHeight: '85vh',
          animation: 'modal-up 0.3s cubic-bezier(0.16,1,0.3,1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes modal-up {
            from { transform: translateX(-50%) translateY(100%); opacity: 0; }
            to { transform: translateX(-50%) translateY(0); opacity: 1; }
          }
        `}</style>

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-[#30363D] rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-3">
            {step > 1 && step < 4 && (
              <button
                onClick={() => { setStep(step - 1); setError(''); }}
                className="w-8 h-8 rounded-lg bg-[#21262D] flex items-center justify-center"
              >
                <ArrowLeft size={16} color="#7D8590" />
              </button>
            )}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#E6EDF3' }}>
                {stepTitles[step]}
              </h3>
              <p style={{ fontSize: '12px', color: '#7D8590', marginTop: 2 }}>
                {stepSubtitles[step]}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#21262D] flex items-center justify-center"
          >
            <X size={16} color="#7D8590" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 px-5 pb-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1 rounded-full" style={{ background: '#21262D' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: step >= s + 1 ? '100%' : '0%',
                  background: '#00D97E',
                }}
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="px-5 pb-8 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Error banner */}
          {error && (
            <div
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
              style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}
            >
              <div className="w-2 h-2 rounded-full bg-[#FF4757]" />
              <p style={{ fontSize: '12px', color: '#FF4757' }}>{error}</p>
            </div>
          )}

          {/* Step 1: Email */}
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,217,126,0.2), rgba(0,217,126,0.05))',
                    border: '1px solid rgba(0,217,126,0.25)',
                  }}
                >
                  <Mail size={28} color="#00D97E" />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '12px', color: '#7D8590', marginBottom: 6, display: 'block' }}>E-mail</label>
                <div className="relative">
                  <Mail size={16} color="#484F58" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all"
                    style={{
                      background: '#0D1117', border: '1px solid #30363D',
                      color: '#E6EDF3', fontSize: '14px',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(0,217,126,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.08)'; }}
                    onBlur={e => { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>
              <button
                onClick={handleStep1} disabled={loading}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00D97E, #00B86B)',
                  color: '#000', fontSize: '14px', fontWeight: 700,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" /> Enviando...</>
                ) : (
                  <>Enviar código <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          )}

          {/* Step 2: Code */}
          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(168,85,247,0.2), rgba(168,85,247,0.05))',
                    border: '1px solid rgba(168,85,247,0.25)',
                  }}
                >
                  <KeyRound size={28} color="#A855F7" />
                </div>
              </div>
              <div className="flex gap-2 justify-center" onPaste={handleCodePaste}>
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => { codeRefs.current[i] = el; }}
                    type="text" inputMode="numeric" maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(i, e.target.value)}
                    onKeyDown={e => handleCodeKeyDown(i, e)}
                    className="text-center outline-none transition-all"
                    style={{
                      width: 48, height: 56, borderRadius: 12,
                      background: digit ? 'rgba(168,85,247,0.08)' : '#0D1117',
                      border: `1.5px solid ${digit ? '#A855F7' : '#30363D'}`,
                      color: '#E6EDF3', fontSize: '20px', fontWeight: 700,
                    }}
                    onFocus={e => { e.target.style.borderColor = '#A855F7'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.1)'; }}
                    onBlur={e => { if (!digit) { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none'; } }}
                  />
                ))}
              </div>
              <div className="text-center">
                {timer > 0 ? (
                  <p style={{ fontSize: '12px', color: '#A855F7' }}>
                    Reenviar em <span style={{ fontWeight: 700 }}>{timer}s</span>
                  </p>
                ) : (
                  <button
                    onClick={() => { setTimer(60); setCode(['', '', '', '', '', '']); }}
                    style={{ fontSize: '12px', color: '#A855F7', fontWeight: 600, background: 'none', border: 'none' }}
                  >
                    Reenviar código
                  </button>
                )}
              </div>
              <button
                onClick={handleStep2} disabled={loading}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #A855F7, #7C3AED)',
                  color: '#FFF', fontSize: '14px', fontWeight: 700,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Verificando...</>
                ) : (
                  <>Verificar código <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          )}

          {/* Step 3: New Password */}
          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div className="flex justify-center">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(74,144,217,0.2), rgba(74,144,217,0.05))',
                    border: '1px solid rgba(74,144,217,0.25)',
                  }}
                >
                  <Lock size={28} color="#4A90D9" />
                </div>
              </div>
              {/* New password */}
              <div>
                <label style={{ fontSize: '12px', color: '#7D8590', marginBottom: 6, display: 'block' }}>Nova senha</label>
                <div className="relative">
                  <Lock size={16} color="#484F58" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showNewPw ? 'text' : 'password'} value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none transition-all"
                    style={{ background: '#0D1117', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '14px' }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(74,144,217,0.5)'; }}
                    onBlur={e => { e.target.style.borderColor = '#30363D'; }}
                  />
                  <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showNewPw ? <EyeOff size={16} color="#484F58" /> : <Eye size={16} color="#484F58" />}
                  </button>
                </div>
                {/* Strength indicator */}
                {newPassword.length > 0 && (
                  <div className="mt-3">
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full" style={{ background: '#21262D' }}>
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: passwordStrength >= i ? '100%' : '0%',
                              background: strengthColors[passwordStrength],
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="mt-1.5" style={{ fontSize: '11px', color: strengthColors[passwordStrength], fontWeight: 600 }}>
                      {strengthLabels[passwordStrength]}
                    </p>
                  </div>
                )}
              </div>
              {/* Confirm password */}
              <div>
                <label style={{ fontSize: '12px', color: '#7D8590', marginBottom: 6, display: 'block' }}>Confirmar senha</label>
                <div className="relative">
                  <Lock size={16} color="#484F58" className="absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPw ? 'text' : 'password'} value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none transition-all"
                    style={{
                      background: '#0D1117',
                      border: `1px solid ${confirmPassword.length === 0 ? '#30363D' : passwordsMatch ? 'rgba(0,217,126,0.5)' : 'rgba(255,71,87,0.5)'}`,
                      color: '#E6EDF3', fontSize: '14px',
                    }}
                  />
                  <button onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showConfirmPw ? <EyeOff size={16} color="#484F58" /> : <Eye size={16} color="#484F58" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && passwordsMatch && (
                  <div className="flex items-center gap-1 mt-2">
                    <CheckCircle2 size={12} color="#00D97E" />
                    <p style={{ fontSize: '11px', color: '#00D97E' }}>Senhas coincidem</p>
                  </div>
                )}
              </div>
              <button
                onClick={handleStep3} disabled={loading}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #4A90D9, #3B7DD8)',
                  color: '#FFF', fontSize: '14px', fontWeight: 700,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Redefinindo...</>
                ) : (
                  <>Redefinir senha <ArrowRight size={16} /></>
                )}
              </button>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="flex flex-col items-center gap-5 py-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,217,126,0.2), rgba(0,217,126,0.05))',
                  border: '1px solid rgba(0,217,126,0.25)',
                  boxShadow: '0 0 30px rgba(0,217,126,0.15)',
                  animation: 'bio-success-pop 0.5s ease-out forwards',
                }}
              >
                <CheckCircle2 size={40} color="#00D97E" />
              </div>
              <div className="text-center">
                <p style={{ fontSize: '18px', fontWeight: 700, color: '#E6EDF3' }}>Tudo certo!</p>
                <p style={{ fontSize: '13px', color: '#7D8590', marginTop: 4 }}>Use sua nova senha para fazer login</p>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                style={{
                  background: 'linear-gradient(135deg, #00D97E, #00B86B)',
                  color: '#000', fontSize: '14px', fontWeight: 700,
                }}
              >
                Voltar ao login <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Login Screen ───────────────────────────────────────────────────────

const REMEMBER_ME_KEY = 'fc_remembered_email';

export function LoginScreen() {
  const navigate = useNavigate();
  const { loginUser } = useApp();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Restore remembered email on mount
  useEffect(() => {
    const remembered = localStorage.getItem(REMEMBER_ME_KEY);
    if (remembered) {
      setEmail(remembered);
      setRememberMe(true);
    }
    setTimeout(() => setMounted(true), 100);
  }, []);

  const handleLogin = useCallback(async () => {
    if (!email || !password) {
      setError('Preencha todos os campos');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const user = await loginUser(email, password);
      if (user) {
        // Persist or clear remembered email based on checkbox
        if (rememberMe) {
          localStorage.setItem(REMEMBER_ME_KEY, email);
        } else {
          localStorage.removeItem(REMEMBER_ME_KEY);
        }
        navigate('/');
      } else {
        setError('E-mail ou senha incorretos');
      }
    } catch (err: any) {
      setError(err.message || 'E-mail ou senha incorretos');
    } finally {
      setLoading(false);
    }
  }, [email, password, rememberMe, navigate, loginUser]);

  const handleBiometricSuccess = useCallback(async () => {
    try {
      // Check if WebAuthn is available on this device
      if (!window.PublicKeyCredential) {
        setError('Biometria n\u00E3o suportada neste navegador');
        setShowBiometric(false);
        return;
      }
      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError('Biometria n\u00E3o dispon\u00EDvel neste dispositivo');
        setShowBiometric(false);
        return;
      }
      // Attempt real WebAuthn authentication
      const res = await authApi.authenticateWithBiometry(email || undefined);
      if (res.user) {
        navigate('/');
      }
    } catch (err: any) {
      setShowBiometric(false);
      const msg = err?.message || '';
      if (msg.includes('NotAllowed') || msg.includes('cancelled') || msg.includes('cancelada')) {
        setError('Autentica\u00E7\u00E3o cancelada');
      } else if (msg.includes('Passkey') || msg.includes('cadastrada') || msg.includes('not found')) {
        setError('Nenhuma biometria cadastrada. Fa\u00E7a login com e-mail e senha, depois cadastre em Configura\u00E7\u00F5es.');
      } else {
        setError(msg || 'Erro na autentica\u00E7\u00E3o biom\u00E9trica');
      }
    }
  }, [email, navigate]);

  const featurePills = [
    { icon: Shield, label: 'Seguro', delay: 300 },
    { icon: TrendingUp, label: 'Análises IA', delay: 500 },
    { icon: Wallet, label: 'Multi-cartão', delay: 700 },
  ];

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 relative"
      style={{ background: '#0D1117' }}
    >
      <AnimatedBackground />

      <style>{`
        @keyframes login-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pill-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.8); }
        }
      `}</style>

      <div
        className="w-full max-w-[380px] flex flex-col items-center relative z-10"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* ── Logo & Branding ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0,217,126,0.2), rgba(0,217,126,0.05))',
                border: '1.5px solid rgba(0,217,126,0.3)',
                boxShadow: '0 8px 32px rgba(0,217,126,0.15)',
              }}
            >
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#00D97E', letterSpacing: -1 }}>
                PV
              </span>
            </div>
            {/* Online indicator */}
            <div
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: '#0D1117', border: '2px solid #0D1117' }}
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  background: '#00D97E',
                  boxShadow: '0 0 8px rgba(0,217,126,0.5)',
                  animation: 'pulse-dot 2s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#E6EDF3' }}>Preve</h1>
          <p style={{ fontSize: '13px', color: '#7D8590', marginTop: 4 }}>Controle financeiro inteligente</p>
        </div>

        {/* ── Feature Pills ── */}
        <div className="flex gap-2 mb-8">
          {featurePills.map((pill, i) => (
            <div
              key={pill.label}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: '1px solid rgba(48,54,61,0.6)',
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(10px)',
                transition: `all 0.5s cubic-bezier(0.16,1,0.3,1) ${pill.delay}ms`,
              }}
            >
              <pill.icon size={13} color="#00D97E" />
              <span style={{ fontSize: '11px', color: '#7D8590' }}>{pill.label}</span>
            </div>
          ))}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div
            className="w-full flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
            style={{ background: 'rgba(255,71,87,0.08)', border: '1px solid rgba(255,71,87,0.2)' }}
          >
            <div className="w-2 h-2 rounded-full bg-[#FF4757]" />
            <p style={{ fontSize: '12px', color: '#FF4757' }}>{error}</p>
          </div>
        )}

        {/* ── Login Form ── */}
        <div className="w-full flex flex-col gap-4 mb-4">
          {/* Email */}
          <div>
            <label style={{ fontSize: '12px', color: '#7D8590', marginBottom: 6, display: 'block' }}>E-mail</label>
            <div className="relative">
              <Mail size={16} color="#484F58" className="absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email" value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                placeholder="seu@email.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all"
                style={{ background: '#161B22', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '14px' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,126,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none'; }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label style={{ fontSize: '12px', color: '#7D8590' }}>Senha</label>
              <button
                onClick={() => setShowForgotPassword(true)}
                style={{ fontSize: '11px', color: '#00D97E', fontWeight: 600, background: 'none', border: 'none' }}
              >
                Esqueceu?
              </button>
            </div>
            <div className="relative">
              <Lock size={16} color="#484F58" className="absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Sua senha"
                className="w-full pl-11 pr-12 py-3.5 rounded-xl outline-none transition-all"
                style={{ background: '#161B22', border: '1px solid #30363D', color: '#E6EDF3', fontSize: '14px' }}
                onFocus={e => { e.target.style.borderColor = 'rgba(0,217,126,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,217,126,0.08)'; }}
                onBlur={e => { e.target.style.borderColor = '#30363D'; e.target.style.boxShadow = 'none'; }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff size={16} color="#484F58" /> : <Eye size={16} color="#484F58" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center justify-center transition-all"
              style={{
                width: 20, height: 20, borderRadius: 6,
                background: rememberMe ? '#00D97E' : 'transparent',
                border: rememberMe ? 'none' : '1.5px solid #30363D',
              }}
            >
              {rememberMe && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <span style={{ fontSize: '13px', color: '#7D8590' }}>Manter conectado</span>
          </div>

          {/* Login button */}
          <button
            key={loading ? 'loading' : 'idle'}
            onClick={handleLogin} disabled={loading}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
            style={{
              background: 'linear-gradient(135deg, #00D97E, #00B86B)',
              boxShadow: '0 4px 20px rgba(0,217,126,0.25)',
              color: '#000', fontSize: '15px', fontWeight: 700,
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                Entrando...
              </>
            ) : (
              <>
                Entrar <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>

        {/* ── Biometric Login ── */}
        <button
          onClick={() => setShowBiometric(true)}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl active:scale-[0.98] transition-all mb-6"
          style={{
            background: 'rgba(168,85,247,0.08)',
            border: '1px solid rgba(168,85,247,0.25)',
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(168,85,247,0.25), rgba(74,144,217,0.15))',
              border: '1px solid rgba(168,85,247,0.3)',
            }}
          >
            <Fingerprint size={20} color="#A855F7" />
          </div>
          <div className="flex-1 text-left">
            <p style={{ fontSize: '14px', fontWeight: 600, color: '#E6EDF3' }}>Biometria / Face ID</p>
            <p style={{ fontSize: '11px', color: '#7D8590', marginTop: 1 }}>Acesso rápido e seguro</p>
          </div>
          <ChevronRight size={18} color="#484F58" />
        </button>

        {/* ── Footer ── */}
        <div className="flex flex-col items-center gap-2 mt-auto">
          <p style={{ fontSize: '10px', color: '#30363D' }}>Protegido com criptografia de ponta a ponta</p>
          <div className="flex items-center gap-1.5">
            <Shield size={10} color="#30363D" />
            <p style={{ fontSize: '9px', color: '#30363D' }}>v2.1.0 · 2026</p>
          </div>
        </div>
      </div>

      {/* ── Overlays ── */}
      {showBiometric && (
        <BiometricOverlay
          onClose={() => setShowBiometric(false)}
          onSuccess={handleBiometricSuccess}
        />
      )}
      {showForgotPassword && (
        <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />
      )}
    </div>
  );
}