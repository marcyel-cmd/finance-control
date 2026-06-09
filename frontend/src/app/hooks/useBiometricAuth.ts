import { useCallback } from 'react';
import { isNative } from '../lib/platform';
import { authApi, LoginResponse } from '../services/auth.api';
import { getAccessToken } from '../services/api';
import { secureStorage } from '../services/secureStorage';

export interface BiometricResult {
  ok: boolean;
  /** Presente quando o login web (WebAuthn) retorna o usuário autenticado. */
  user?: LoginResponse['user'];
  error?: string;
}

// Detecta o ambiente e usa o mecanismo de biometria adequado:
//   - Nativo (Capacitor): @aparajita/capacitor-biometric-auth
//     (Face ID / Touch ID / digital, com fallback p/ PIN via allowDeviceCredential).
//     Após o desbloqueio, reaproveita a sessão guardada no storage seguro.
//   - Web: fluxo WebAuthn já existente (authApi.authenticateWithBiometry).
export function useBiometricAuth() {

  const authenticate = useCallback(async (email?: string): Promise<BiometricResult> => {
    if (isNative()) {
      try {
        // Import dinâmico — só carrega o plugin no ambiente nativo
        const { BiometricAuth } = await import('@aparajita/capacitor-biometric-auth');
        const status = await BiometricAuth.checkBiometry();
        if (!status.isAvailable && !status.deviceIsSecure) {
          return { ok: false, error: 'Biometria não disponível neste dispositivo' };
        }

        await BiometricAuth.authenticate({
          reason: 'Confirme sua identidade para acessar o Preve',
          cancelTitle: 'Cancelar',
          allowDeviceCredential: true, // fallback p/ PIN/senha do aparelho
          androidTitle: 'Acesso ao Preve',
          androidSubtitle: 'Use sua biometria ou PIN',
          iosFallbackTitle: 'Usar PIN',
        });

        // Desbloqueio OK. Para entrar, precisamos de uma sessão previamente
        // salva (refresh token no keychain). Senão, pede login por senha.
        const hasSession = !!secureStorage.getSync('fc_refresh_token') || !!getAccessToken();
        if (!hasSession) {
          return { ok: false, error: 'Faça login com e-mail e senha uma vez para habilitar o acesso por biometria.' };
        }
        return { ok: true };
      } catch (err: any) {
        const code = err?.code || '';
        if (code === 'userCancel' || code === 'systemCancel' || code === 'appCancel') {
          return { ok: false, error: 'Autenticação cancelada' };
        }
        return { ok: false, error: err?.message || 'Falha na autenticação biométrica' };
      }
    }

    // ── Web: WebAuthn / Passkey ──
    try {
      const res = await authApi.authenticateWithBiometry(email);
      return { ok: true, user: res.user };
    } catch (err: any) {
      return { ok: false, error: err?.message || 'Erro na autenticação biométrica' };
    }
  }, []);

  return { authenticate };
}
