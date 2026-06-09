import { createBrowserRouter, redirect } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { MobileShell } from './components/layout/MobileShell';
import { DashboardScreen } from './screens/DashboardScreen';
import { TransactionsScreen } from './screens/TransactionsScreen';
import { CardsScreen } from './screens/CardsScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { MoreScreen } from './screens/MoreScreen';
import { LoginScreen } from './screens/LoginScreen';
import { QuickAddScreen } from './screens/QuickAddScreen';
import { ShareTargetScreen } from './screens/ShareTargetScreen';
import { secureStorage } from './services/secureStorage';

// Auth guard — verifica token JWT (lê do storage seguro, hidratado no boot)
function requireAuth() {
  const hasToken = !!secureStorage.getSync('fc_access_token');
  const isAuth = secureStorage.getSync('fc_auth') === 'true';
  if (!hasToken || !isAuth) return redirect('/login');
  return null;
}

// Redirect if already logged in
function redirectIfAuth() {
  const hasToken = !!secureStorage.getSync('fc_access_token');
  const isAuth = secureStorage.getSync('fc_auth') === 'true';
  if (hasToken && isAuth) return redirect('/');
  return null;
}

export const router = createBrowserRouter([
  {
    path: '/',
    Component: AppLayout,
    children: [
      {
        path: 'login',
        Component: LoginScreen,
        loader: redirectIfAuth,
      },
      {
        loader: requireAuth,
        Component: MobileShell,
        children: [
          { index: true, Component: DashboardScreen },
          { path: 'transacoes', Component: TransactionsScreen },
          { path: 'cartoes', Component: CardsScreen },
          { path: 'analises', Component: AnalyticsScreen },
          { path: 'mais', Component: MoreScreen },
        ],
      },
      // Rotas "leves" pra captura rápida via PWA shortcut e Web Share Target.
      // Não usam MobileShell pra evitar bottom nav/FAB sobrepondo o modal.
      {
        loader: requireAuth,
        children: [
          { path: 'quick', Component: QuickAddScreen },
          { path: 'share-target', Component: ShareTargetScreen },
        ],
      },
    ],
  },
]);
