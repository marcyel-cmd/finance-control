import { initializeApp, cert, applicationDefault, App, Credential } from 'firebase-admin/app';
import { getMessaging as getAdminMessaging, Messaging } from 'firebase-admin/messaging';

// Inicialização gated por env — mesmo padrão do Web Push (isPushConfigured).
// Aceita credencial de duas formas:
//   - FIREBASE_SERVICE_ACCOUNT: JSON do service account inline (string)
//   - GOOGLE_APPLICATION_CREDENTIALS: caminho pro arquivo JSON (lido pelo SDK)
// Sem credencial → push nativo desativado graciosamente (apenas warn).

function loadCredential(): Credential | null {
  const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (inline) {
    try {
      const parsed = JSON.parse(inline);
      return cert(parsed);
    } catch (err: any) {
      console.warn('[firebase] FIREBASE_SERVICE_ACCOUNT inválido (JSON):', err.message);
      return null;
    }
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // applicationDefault() lê o arquivo apontado por GOOGLE_APPLICATION_CREDENTIALS
    try {
      return applicationDefault();
    } catch (err: any) {
      console.warn('[firebase] GOOGLE_APPLICATION_CREDENTIALS inválido:', err.message);
      return null;
    }
  }
  return null;
}

let app: App | null = null;
const credential = loadCredential();

if (credential) {
  app = initializeApp({ credential });
  console.log('[firebase] Firebase Admin inicializado — push nativo (FCM/APNs) ativo');
} else {
  console.warn('[firebase] Credencial ausente — push nativo desativado. Defina FIREBASE_SERVICE_ACCOUNT ou GOOGLE_APPLICATION_CREDENTIALS no .env');
}

export const isFirebaseConfigured = !!app;

export function getMessaging(): Messaging | null {
  return app ? getAdminMessaging(app) : null;
}
