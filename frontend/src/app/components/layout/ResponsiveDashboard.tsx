import React from 'react';
import { useDeviceType } from '../../hooks/useDeviceType';

interface ResponsiveDashboardProps {
  summaryCards: React.ReactNode;
  chart: React.ReactNode;
  creditCards: React.ReactNode;
  predictedExpenses: React.ReactNode | null;
  recentTransactions: React.ReactNode;
  aiInsights?: React.ReactNode | null;
}

export function ResponsiveDashboard({
  summaryCards,
  chart,
  creditCards,
  predictedExpenses,
  recentTransactions,
  aiInsights,
}: ResponsiveDashboardProps) {
  const deviceType = useDeviceType();

  // Desktop: 2-column layout
  if (deviceType === 'desktop') {
    return (
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column - Main Content */}
        <div className="col-span-8 flex flex-col gap-6">
          {/* Summary cards in 4 columns */}
          <div className="grid grid-cols-4 gap-4">
            {summaryCards}
          </div>
          {aiInsights}
          {chart}
          {recentTransactions}
        </div>

        {/* Right Column - Sidebar */}
        <div className="col-span-4 flex flex-col gap-6">
          {creditCards}
          {predictedExpenses}
        </div>
      </div>
    );
  }

  // Tablet: optimized 2-column layout
  if (deviceType === 'tablet') {
    return (
      <div className="flex flex-col gap-5">
        {/* Summary cards in 2x2 grid */}
        <div className="grid grid-cols-2 gap-4">
          {summaryCards}
        </div>
        {aiInsights}
        {/* Chart takes full width */}
        {chart}

        {/* Two column layout for cards and transactions */}
        <div className="grid grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            {creditCards}
          </div>
          <div className="flex flex-col gap-5">
            {predictedExpenses}
            {recentTransactions}
          </div>
        </div>
      </div>
    );
  }

  // Mobile: single column
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        {summaryCards}
      </div>
      {aiInsights}
      {chart}
      {creditCards}
      {predictedExpenses}
      {recentTransactions}
    </div>
  );
}