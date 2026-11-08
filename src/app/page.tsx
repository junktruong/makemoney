import { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 animate-pulse mb-3" />
          <p className="text-xs font-bold text-slate-500">Đang khởi tạo Make Money...</p>
        </div>
      }
    >
      <AppShell />
    </Suspense>
  );
}
