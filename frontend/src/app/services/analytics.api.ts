// src/app/services/analytics.api.ts
import { apiFetch } from './api';
import { MonthlyData } from '../types';

export interface ProjectionData {
  monthlyIncome: number;
  monthlyExpense: number;
  monthlySavings: number;
  projection: Array<{ month: string; monthNum: number; year: number; value: number }>;
}

export interface CategoryAnalytics {
  categories: Array<{
    category: string; label: string; icon: string; color: string;
    value: number; percentage: number;
  }>;
  total: number;
}

export interface ComparisonData {
  month: string; monthNum: number; year: number;
  realizado: number; previsto: number;
}

export const analyticsApi = {
  async monthly(months = 6) {
    return apiFetch<{ success: boolean; data: MonthlyData[] }>(
      `/analytics/monthly?months=${months}`
    );
  },

  async categories(month: number, year: number) {
    return apiFetch<{ success: boolean; data: CategoryAnalytics }>(
      `/analytics/categories?month=${month}&year=${year}`
    );
  },

  async projection(months = 6) {
    return apiFetch<{ success: boolean; data: ProjectionData }>(
      `/analytics/projection?months=${months}`
    );
  },

  async comparison(months = 4) {
    return apiFetch<{ success: boolean; data: ComparisonData[] }>(
      `/analytics/comparison?months=${months}`
    );
  },

  async monthlyData(months = 6) {
    return apiFetch<{ success: boolean; data: MonthlyData[] }>(
      `/monthly-data?months=${months}`
    );
  },

  async insights(month: number, year: number) {
    return apiFetch<{ success: boolean; data: { insights: string[]; generatedAt: string } }>(
      `/analytics/insights?month=${month}&year=${year}`
    );
  },
};
