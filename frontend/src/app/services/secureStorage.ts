import { Preferences } from '@capacitor/preferences';
import { isNative } from '../lib/platform';

// Wrapper de storage seguro.
//   - Nativo (Capacitor): @capacitor/preferences (keystore/keychain-backed).
//   - Web: localStorage.
//
// Problema: o Preferences é assíncrono, mas partes do app (api.ts, AppContext)
// leem tokens de forma SÍNCRONA no boot. Solução: manter um cache em memória
// das chaves sensíveis, hidratado uma vez no boot (`hydrate()`), e expor leitura
// síncrona (`getSync`) a partir desse cache. Escritas atualizam o cache na hora
// e persistem de forma assíncrona.

// Chaves gerenciadas por este wrapper (auth).
export const SECURE_KEYS = [
  'fc_auth',
  'fc_current_user',
  'fc_access_token',
  'fc_refresh_token',
] as const;

export type SecureKey = (typeof SECURE_KEYS)[number];

const cache = new Map<string, string | null>();
let hydrated = false;

async function readBacking(key: string): Promise<string | null> {
  if (isNative()) {
    const { value } = await Preferences.get({ key });
    return value ?? null;
  }
  return localStorage.getItem(key);
}

async function writeBacking(key: string, value: string): Promise<void> {
  if (isNative()) {
    await Preferences.set({ key, value });
  } else {
    localStorage.setItem(key, value);
  }
}

async function removeBacking(key: string): Promise<void> {
  if (isNative()) {
    await Preferences.remove({ key });
  } else {
    localStorage.removeItem(key);
  }
}

export const secureStorage = {
  // Carrega as chaves sensíveis para o cache em memória. Deve ser chamado uma
  // única vez no boot (main.tsx), ANTES de renderizar o app.
  async hydrate(): Promise<void> {
    if (hydrated) return;
    await Promise.all(
      SECURE_KEYS.map(async (key) => {
        try {
          cache.set(key, await readBacking(key));
        } catch {
          cache.set(key, null);
        }
      }),
    );
    hydrated = true;
  },

  // Leitura síncrona a partir do cache (usada por api.ts / AppContext no boot).
  getSync(key: string): string | null {
    if (cache.has(key)) return cache.get(key) ?? null;
    // Fallback: no web ainda conseguimos ler localStorage de forma síncrona.
    if (!isNative()) return localStorage.getItem(key);
    return null;
  },

  // Escrita: atualiza o cache imediatamente e persiste em background.
  set(key: string, value: string): void {
    cache.set(key, value);
    void writeBacking(key, value).catch((err) =>
      console.warn('[secureStorage] erro ao persistir', key, err),
    );
  },

  // Remoção: atualiza o cache imediatamente e persiste em background.
  remove(key: string): void {
    cache.set(key, null);
    void removeBacking(key).catch((err) =>
      console.warn('[secureStorage] erro ao remover', key, err),
    );
  },
};
