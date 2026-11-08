'use client';

import React, { useState, useEffect } from 'react';
import { parseVND } from '@/lib/services/financialService';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  presets?: number[];
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label,
  placeholder = '0 ₫',
  required = false,
  presets = [50000, 100000, 200000, 500000],
  autoFocus = false,
}) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    if (value > 0) {
      setDisplayValue(value.toLocaleString('vi-VN'));
    } else {
      setDisplayValue('');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseVND(raw);
    onChange(num);
    setDisplayValue(num > 0 ? num.toLocaleString('vi-VN') : '');
  };

  const addPreset = (amount: number) => {
    const next = (value || 0) + amount;
    onChange(next);
  };

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        <input
          type="text"
          inputMode="numeric"
          autoFocus={autoFocus}
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className="w-full text-xl font-bold px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
        />
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400 font-semibold">
          ₫
        </div>
      </div>

      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {presets.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => addPreset(preset)}
              className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/60 active:scale-95 transition-all"
            >
              +{preset >= 1000000 ? `${preset / 1000000}Tr` : `${preset / 1000}k`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(0)}
            className="text-xs px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 active:scale-95 transition-all"
          >
            Xóa
          </button>
        </div>
      )}
    </div>
  );
};

