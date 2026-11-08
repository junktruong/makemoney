'use client';

import React from 'react';
import { SavingsSummaryCard } from '../dashboard/SavingsSummaryCard';
import { EveningReminderCard } from '../dashboard/EveningReminderCard';
import { QuickActions } from '../dashboard/QuickActions';
import { WishlistOverview } from '../dashboard/WishlistOverview';
import { DailyActivityCard } from '../dashboard/DailyActivityCard';

export const DashboardView: React.FC = () => {
  return (
    <div className="space-y-4 pb-20 pt-2 animate-in fade-in duration-200">
      <SavingsSummaryCard />
      <EveningReminderCard />
      <QuickActions />
      <WishlistOverview />
      <DailyActivityCard />
    </div>
  );
};
