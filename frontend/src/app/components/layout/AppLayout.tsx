import React, { Suspense, Component, ReactNode } from 'react';
import { Outlet } from 'react-router';
import { AppProvider } from '../../context/AppContext';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('AppLayout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          minHeight: '100vh', 
          background: '#0D1117', 
          color: '#E6EDF3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          textAlign: 'center'
        }}>
          <div>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Erro ao carregar</h1>
            <p style={{ color: '#7D8590', marginBottom: '20px' }}>
              {this.state.error?.message || 'Ocorreu um erro inesperado'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#00D97E',
                color: '#0D1117',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export function AppLayout() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <Suspense fallback={<div style={{ minHeight: '100vh', background: '#0D1117' }} />}>
          <Outlet />
        </Suspense>
      </AppProvider>
    </ErrorBoundary>
  );
}