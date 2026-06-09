// src/app/services/api.ts
// Cliente HTTP base com JWT e refresh automático

import { secureStorage } from './secureStorage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333/api/v1';

// Leitura síncrona do cache do secureStorage (hidratado no boot em main.tsx).
let accessToken: string | null = secureStorage.getSync('fc_access_token');
let refreshToken: string | null = secureStorage.getSync('fc_refresh_token');
let isRefreshing = false;
let refreshQueue: Array<() => void> = [];

// ── Token management ────────────────────────────────────

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  secureStorage.set('fc_access_token', access);
  secureStorage.set('fc_refresh_token', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  secureStorage.remove('fc_access_token');
  secureStorage.remove('fc_refresh_token');
  secureStorage.remove('fc_auth');
  secureStorage.remove('fc_current_user');
}

export function getAccessToken() {
  return accessToken;
}

// ── Refresh token logic ─────────────────────────────────

async function doRefresh(): Promise<boolean> {
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

// ── Main fetch wrapper ──────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, skipAuth = false } = options;

  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (!skipAuth && accessToken) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  if (body && method !== 'GET') {
    config.body = JSON.stringify(body);
  }

  let res = await fetch(`${API_URL}${endpoint}`, config);

  // Token expirado — tenta refresh
  if (res.status === 401 && !skipAuth && refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await doRefresh();
      isRefreshing = false;

      if (refreshed) {
        // Retry com novo token
        (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
        res = await fetch(`${API_URL}${endpoint}`, config);
        // Resolve fila de requests pendentes
        refreshQueue.forEach(cb => cb());
        refreshQueue = [];
      } else {
        // Refresh falhou — logout
        clearTokens();
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }
    } else {
      // Outra request já está fazendo refresh — esperar
      await new Promise<void>(resolve => refreshQueue.push(resolve));
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${endpoint}`, config);
    }
  }

  const data = await res.json();

  if (!res.ok) {
    let msg = data.error || data.message || `Erro ${res.status}`;
    // Traduzir erros técnicos para mensagens amigáveis
    if (res.status === 401) {
      if (msg.includes('Email ou senha') || msg.includes('inválido')) msg = 'E-mail ou senha incorretos';
      else if (msg.includes('não encontrado') || msg.includes('not found')) msg = 'Conta não encontrada';
      else if (msg.includes('expirado')) msg = 'Sessão expirada. Faça login novamente.';
      else msg = 'E-mail ou senha incorretos';
    } else if (res.status === 409) {
      if (msg.includes('email')) msg = 'Este e-mail já está cadastrado';
    } else if (res.status === 500) {
      if (!msg || msg === 'Erro 500') msg = 'Erro interno do servidor. Tente novamente.';
    }
    throw new Error(msg);
  }

  return data;
}

// ── Upload helper (multipart) ───────────────────────────

export async function apiUpload<T = any>(endpoint: string, formData: FormData): Promise<T> {
  const config: RequestInit = {
    method: 'POST',
    headers: {} as Record<string, string>,
    body: formData,
  };

  if (accessToken) {
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
  }

  // NÃO setar Content-Type — o browser coloca automaticamente com boundary

  let res = await fetch(`${API_URL}${endpoint}`, config);

  if (res.status === 401 && refreshToken) {
    const refreshed = await doRefresh();
    if (refreshed) {
      (config.headers as Record<string, string>)['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_URL}${endpoint}`, config);
    } else {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Sessão expirada');
    }
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `Erro ${res.status}`);
  return data;
}
