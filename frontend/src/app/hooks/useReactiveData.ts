import { useEffect, useRef } from 'react';
import { subscribeToDataChanges } from '../context/AppContext';

/**
 * Hook para garantir que componentes reajam a mudanças globais de dados
 * 
 * Uso:
 * const { transactions } = useApp();
 * useReactiveData(() => {
 *   // Este código roda sempre que dados mudam globalmente
 *   const total = transactions.reduce((sum, t) => sum + t.value, 0);
 *   setTotal(total);
 * }, [transactions]);
 */
export function useReactiveData(callback: () => void, deps: any[]) {
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Executar callback imediatamente
    callback();

    // Se não houver dependências, inscrever para mudanças globais
    if (!deps || deps.length === 0) {
      unsubscribeRef.current = subscribeToDataChanges(callback);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, deps || []);
}