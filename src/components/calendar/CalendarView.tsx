'use client';

import React, { useState, useEffect } from 'react';
import { useSavingsStore } from '@/lib/store/useSavingsStore';
import { formatVND } from '@/lib/services/financialService';
import { ChevronLeft, ChevronRight, TrendingUp, PiggyBank, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { useAppStore } from '@/lib/store/useAppStore';

export const CalendarView: React.FC = () => {
  const { dailyRecords, selectedCalendarDate, setSelectedCalendarDate } = useSavingsStore();
  const { setIsIncomeModalOpen } = useAppStore();

  const [currentMonth, setCurrentMonth] = useState<Date>(() => new Date(2026, 10, 1));
  const [todayStr, setTodayStr] = useState<string>('');

  useEffect(() => {
    const now = new Date();
    setCurrentMonth(now);
    setTodayStr(now.toISOString().split('T')[0]);
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth(); // 0-indexed

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  // Get day of week for the 1st (0 = Sunday, 1 = Monday). In Vietnam, Monday is commonly day 1.
  const startDayOffset = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const daysOfWeek = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

  // Map daily records by date "YYYY-MM-DD"
  const recordsMap = new Map<string, { income: number; savings: number; hasRecord: boolean }>();
  for (const r of dailyRecords) {
    const existing = recordsMap.get(r.date) || { income: 0, savings: 0, hasRecord: true };
    existing.income += r.incomeAmount || 0;
    existing.savings += r.savingsContribution || 0;
    recordsMap.set(r.date, existing);
  }

  const selectedRecord = recordsMap.get(selectedCalendarDate);
  const selectedRawRecord = dailyRecords.find((r) => r.date === selectedCalendarDate);

  return (
    <div className="space-y-4">
      {/* Calendar Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-xs">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Tháng {month + 1}, {year}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Tháng trước"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              aria-label="Tháng sau"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {daysOfWeek.map((d) => (
            <div key={d} className="text-[11px] font-bold text-slate-400 py-1">
              {d}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty offset cells */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Actual day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const info = recordsMap.get(dayStr);
            const isSelected = selectedCalendarDate === dayStr;
            const isToday = todayStr === dayStr;

            return (
              <button
                key={dayStr}
                onClick={() => setSelectedCalendarDate(dayStr)}
                className={`relative aspect-square rounded-2xl flex flex-col items-center justify-between p-1.5 transition-all text-xs font-semibold ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold scale-105 z-10'
                    : isToday
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span>{dayNum}</span>

                {/* Activity Dots Indicator */}
                <div className="flex gap-0.5 justify-center mt-auto">
                  {info?.income ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-amber-300' : 'bg-emerald-500'
                      }`}
                      title={`Thu nhập: ${formatVND(info.income)}`}
                    />
                  ) : null}
                  {info?.savings ? (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-teal-500'
                      }`}
                      title={`Tiết kiệm: ${formatVND(info.savings)}`}
                    />
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Có thu nhập</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Có tiết kiệm</span>
          </div>
        </div>
      </div>

      {/* Selected Date Summary Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Chi tiết ngày
            </h3>
            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
              {new Date(selectedCalendarDate).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <button
            onClick={() => setIsIncomeModalOpen(true)}
            className="text-xs px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1 hover:bg-emerald-100 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Thêm ghi chép
          </button>
        </div>

        {selectedRecord && (selectedRecord.income > 0 || selectedRecord.savings > 0) ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Thu nhập
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {formatVND(selectedRecord.income)}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <PiggyBank className="w-3.5 h-3.5 text-teal-500" />
                  Tiết kiệm
                </div>
                <div className="text-sm font-extrabold text-teal-600 dark:text-teal-400 mt-1">
                  {formatVND(selectedRecord.savings)}
                </div>
              </div>
            </div>

            {selectedRawRecord?.source && (
              <div className="text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-400">Nguồn thu: </span>
                {selectedRawRecord.source}
              </div>
            )}

            {selectedRawRecord?.note && (
              <div className="text-xs text-slate-600 dark:text-slate-300 italic">
                <span className="font-semibold text-slate-400 not-italic">Ghi chú: </span>
                &ldquo;{selectedRawRecord.note}&rdquo;
              </div>
            )}
          </div>
        ) : (
          <p className="text-xs text-slate-400 dark:text-slate-500 py-3 text-center">
            Không có hoạt động tài chính nào trong ngày này.
          </p>
        )}
      </div>
    </div>
  );
};
