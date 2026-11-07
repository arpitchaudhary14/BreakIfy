import { Loader2 } from 'lucide-react';

export function Spinner({ className = '' }: { className?: string }) {
  return (
    <Loader2 className={`w-5 h-5 animate-spin text-zinc-500 dark:text-zinc-400 ${className}`} />
  );
}

export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div
      className={`h-4 rounded bg-zinc-200/80 dark:bg-zinc-800 animate-pulse ${className}`}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121214] p-5 space-y-3">
      <SkeletonLine className="w-1/3 h-4" />
      <SkeletonLine className="w-2/3 h-8" />
      <SkeletonLine className="w-1/2 h-3" />
    </div>
  );
}
