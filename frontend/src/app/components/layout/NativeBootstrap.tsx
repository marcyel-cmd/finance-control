import { useEffect } from 'react';
import { isNative } from '../../lib/platform';
import { useNativePush } from '../../hooks/useNativePush';

// Inicialização específica do app nativo (Capacitor). No web é totalmente inerte.
// Renderizado dentro do RouterProvider para que o push possa navegar (useNavigate).
export function NativeBootstrap() {
  // Push nativo (FCM/APNs) — no-op no web
  useNativePush();

  useEffect(() => {
    if (!isNative()) return;

    (async () => {
      try {
        const { StatusBar, Style } = await import('@capacitor/status-bar');
        await StatusBar.setStyle({ style: Style.Dark });
        // setBackgroundColor não é suportado no iOS — ignorar erro lá
        await StatusBar.setBackgroundColor({ color: '#0D1117' }).catch(() => {});
      } catch (err: any) {
        console.warn('[native] StatusBar init falhou:', err?.message);
      }

      try {
        const { SplashScreen } = await import('@capacitor/splash-screen');
        await SplashScreen.hide();
      } catch (err: any) {
        console.warn('[native] SplashScreen.hide falhou:', err?.message);
      }
    })();
  }, []);

  return null;
}
