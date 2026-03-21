// src/app/data/mockData.ts
// Dados mock removidos — agora tudo vem da API
// Mantido apenas PAYMENT_METHODS (constante estática usada nos modais)

import { Category } from '../types';

export const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro / PIX' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Cartão de Crédito' },
  { id: 'boleto', label: 'Boleto' },
  { id: 'transferencia', label: 'Transferência' },
];

// Fallback vazio para categorias (carregadas da API agora)
export const CATEGORIES: Category[] = [];
