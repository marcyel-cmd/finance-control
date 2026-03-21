// src/app/services/categories.api.ts
import { apiFetch } from './api';
import { Category } from '../types';

export const categoriesApi = {
  async list() {
    return apiFetch<{ success: boolean; data: Category[] }>('/categories');
  },

  async create(data: { id: string; label: string; color: string; icon: string }) {
    return apiFetch<{ success: boolean; data: Category }>('/categories', { method: 'POST', body: data });
  },

  async update(id: string, data: { label?: string; color?: string; icon?: string }) {
    return apiFetch<{ success: boolean; data: Category }>(`/categories/${id}`, { method: 'PUT', body: data });
  },

  async delete(id: string) {
    return apiFetch(`/categories/${id}`, { method: 'DELETE' });
  },
};
