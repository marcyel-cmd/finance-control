import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { isNative, getPlatform } from '../lib/platform';
import { notificationsApi } from '../services/notifications.api';
import { getAccessToken } from '../services/api';

// Push nativo (FCM/APNs) via Capacitor. No web é no-op — o Web Push já é tratado
// pelo service worker e pelo hook usePushNotifications (gerenciamento de inscrição).
// Solicita permissão, registra no FCM/APNs, envia o token ao backend e trata os
// eventos de notificação (recebida em foreground e toque navegando p/ data.route).
export function useNativePush() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isNative()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // 1) Permissão
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== 'granted') return;

      // 2) Registro no FCM/APNs
      await PushNotifications.register();

      // 3) Token → backend (só se já autenticado)
      const regHandle = await PushNotifications.addListener('registration', (token) => {
        const platform = getPlatform();
        if (platform !== 'ios' && platform !== 'android') return;
        if (!getAccessToken()) return;
        notificationsApi.registerPushToken(token.value, platform)
          .catch((err) => console.warn('[push] erro ao registrar token:', err?.message));
      });

      const errHandle = await PushNotifications.addListener('registrationError', (err) => {
        console.warn('[push] erro de registro:', JSON.stringify(err));
      });

      // 4) Notificação recebida em foreground (backend é a fonte de verdade;
      //    o painel recarrega via AppContext quando aberto).
      const recvHandle = await PushNotifications.addListener('pushNotificationReceived', () => {});

      // 5) Toque na notificação → navega para data.route
      const actionHandle = await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const route = (action.notification?.data?.route as string) || '/';
        navigate(route);
      });

      cleanup = () => {
        regHandle.remove();
        errHandle.remove();
        recvHandle.remove();
        actionHandle.remove();
      };
    })().catch((err) => console.warn('[push] init nativo falhou:', err?.message));

    return () => { cleanup?.(); };
  }, [navigate]);
}
