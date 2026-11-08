'use client';

import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: string;
  showLabel?: boolean;
  colorScheme?: 'emerald' | 'amber' | 'blue';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 'h-2.5',
  showLabel = false,
  colorScheme = 'emerald',
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(progress || 0)));

  const gradientClass =
    colorScheme === 'emerald'
      ? 'from-emerald-500 to-teal-400'
      : colorScheme === 'amber'
      ? 'from-amber-500 to-yellow-400'
      : 'from-blue-500 to-indigo-400';

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1 font-semibold">
          <span className="text-slate-500 dark:text-slate-400">Tiến độ</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{clamped}%</span>
        </div>
      )}
      <div className={`w-full ${height} bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner`}>
        <div
          className={`h-full bg-gradient-to-r ${gradientClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

