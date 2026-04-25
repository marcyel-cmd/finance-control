import { useCallback, useEffect, useState } from 'react';
import { pushApi } from '../services/push.api';

// Browser-side helper to convert a base64 string to Uint8Array
// (formato exigido pelo PushManager.subscribe).
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) out[i] = raw.charCodeAt(i);
  return out;
}

function bufferToBase64(buf: ArrayBuffer | null): string {
  if (!buf) return '';
  const bytes = new Uint8Array(buf);
  let str = '';
  for (let i = 0; i < bytes.byteLength; i++) str += String.fromCharCode(bytes[i]);
  return btoa(str);
}

function getDeviceName(): string {
  const ua = navigator.userAgent;
  // Tentativa simples de identificar dispositivo+navegador
  if (/Android/.test(ua)) return /Chrome/.test(ua) ? 'Android · Chrome' : 'Android';
  if (/iPhone|iPad/.test(ua)) return 'iOS · Safari';
  if (/Edg/.test(ua)) return 'Desktop · Edge';
  if (/Chrome/.test(ua)) return 'Desktop · Chrome';
  if (/Firefox/.test(ua)) return 'Desktop · Firefox';
  return 'Desconhecido';
}

export type PushStatus = 'unsupported' | 'not_configured' | 'denied' | 'idle' | 'subscribed' | 'error';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [vapidKey, setVapidKey] = useState('');

  const checkStatus = useCallback(async () => {
    setError('');
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setStatus('denied');
      return;
    }
    try {
      const keyRes = await pushApi.getVapidPublicKey();
      if (!keyRes.data?.configured) { setStatus('not_configured'); return; }
      setVapidKey(keyRes.data.publicKey);

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setStatus(sub ? 'subscribed' : 'idle');
    } catch (err: any) {
      setError(err?.message || 'Erro ao verificar status');
      setStatus('error');
    }
  }, []);

  useEffect(() => { void checkStatus(); }, [checkStatus]);

  const subscribe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        throw new Error('Navegador não suporta Web Push');
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        throw new Error('Permissão negada pelo navegador');
      }

      let publicKey = vapidKey;
      if (!publicKey) {
        const keyRes = await pushApi.getVapidPublicKey();
        if (!keyRes.data?.configured) throw new Error('Push não configurado no servidor');
        publicKey = keyRes.data.publicKey;
        setVapidKey(publicKey);
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = sub.toJSON() as any;
      await pushApi.subscribe({
        endpoint:   sub.endpoint,
        p256dh:     json.keys?.p256dh ?? bufferToBase64(sub.getKey('p256dh')),
        auth:       json.keys?.auth   ?? bufferToBase64(sub.getKey('auth')),
        deviceName: getDeviceName(),
      });
      setStatus('subscribed');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Erro ao inscrever');
      return false;
    } finally {
      setLoading(false);
    }
  }, [vapidKey]);

  const unsubscribe = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await pushApi.unsubscribe(sub.endpoint).catch(() => null);
        await sub.unsubscribe();
      }
      setStatus('idle');
      return true;
    } catch (err: any) {
      setError(err?.message || 'Erro ao cancelar inscrição');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendTest = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await pushApi.test();
      return res.data;
    } catch (err: any) {
      setError(err?.message || 'Erro ao enviar teste');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { status, loading, error, subscribe, unsubscribe, sendTest, refresh: checkStatus };
}
