// src/app/services/auth.api.ts
import { apiFetch, setTokens, clearTokens } from './api';

export interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    active: boolean;
  };
  accessToken: string;
  refreshToken: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('fc_auth', 'true');
    localStorage.setItem('fc_current_user', JSON.stringify(data.user));
    return data;
  },

  async register(name: string, email: string, password: string): Promise<LoginResponse> {
    const data = await apiFetch<LoginResponse>('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      skipAuth: true,
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('fc_auth', 'true');
    localStorage.setItem('fc_current_user', JSON.stringify(data.user));
    return data;
  },

  async me() {
    return apiFetch('/auth/me');
  },

  logout() {
    clearTokens();
  },

  async refresh() {
    return apiFetch('/auth/refresh', { method: 'POST' });
  },

  // ── WebAuthn / Biometria ────────────────────────────────

  async getPasskeyAuthOptions(email?: string) {
    return apiFetch<{ success: boolean; data: any }>('/auth/passkey/authenticate-options', {
      method: 'POST',
      body: { email },
      skipAuth: true,
    });
  },

  async verifyPasskeyAuth(assertion: any, challengeKey: string) {
    const data = await apiFetch<LoginResponse & { success: boolean }>('/auth/passkey/authenticate-verify', {
      method: 'POST',
      body: { assertion, challengeKey },
      skipAuth: true,
    });
    setTokens(data.accessToken, data.refreshToken);
    localStorage.setItem('fc_auth', 'true');
    localStorage.setItem('fc_current_user', JSON.stringify(data.user));
    return data;
  },

  async authenticateWithBiometry(email?: string): Promise<LoginResponse> {
    // 1. Get challenge options from backend
    const optionsRes = await this.getPasskeyAuthOptions(email);
    const options = optionsRes.data;

    // 2. Trigger browser biometric prompt via WebAuthn API
    const { startAuthentication } = await import('@simplewebauthn/browser');
    const assertion = await startAuthentication(options);

    // 3. Verify with backend
    return await this.verifyPasskeyAuth(assertion, options.challengeKey);
  },
};
