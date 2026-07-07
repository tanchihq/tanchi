import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const AppLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="text-glass-soft size-6 animate-spin" />
  </div>
);

export const AppError = ({ onRetry }: Readonly<{ onRetry: () => void }>) => (
  <div className="flex h-full flex-col items-center justify-center gap-3">
    <p className="text-[#ABA8C0]">Something went wrong.</p>
    <button
      type="button"
      onClick={onRetry}
      className="h-9 rounded-lg border border-white/10 bg-white/[0.04] px-4 text-[13px] text-[#ABA8C0] transition-colors hover:bg-white/[0.08]"
    >
      Retry
    </button>
  </div>
);

export const AppEmpty = ({
  icon,
  title,
  hint,
}: Readonly<{ icon: ReactNode; title: string; hint: string }>) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
    <div className="text-glass-dim flex size-14 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.03]">
      {icon}
    </div>
    <div>
      <div className="text-[15px] font-medium text-[#F3F2F8]">{title}</div>
      <div className="mx-auto mt-1 max-w-[360px] text-[13px] leading-snug text-[#6F6C85]">
        {hint}
      </div>
    </div>
  </div>
);
