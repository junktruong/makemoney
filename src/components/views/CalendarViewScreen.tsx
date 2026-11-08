'use client';

import React from 'react';
import { CalendarView } from '../calendar/CalendarView';
import { TransactionLedger } from '../calendar/TransactionLedger';

export const CalendarViewScreen: React.FC = () => {
  return (
    <div className="space-y-4 pb-20 pt-2 animate-in fade-in duration-200">
      <CalendarView />
      <TransactionLedger />
    </div>
  );
};
