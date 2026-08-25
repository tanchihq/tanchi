import { type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export const AppLoader = () => (
  <div className="flex h-full items-center justify-center">
    <Loader2 className="text-app-soft size-6 animate-spin" />
  </div>
);

export const AppError = ({ onRetry }: Readonly<{ onRetry: () => void }>) => (
  <div className="flex h-full flex-col items-center justify-center gap-3">
    <p className="text-app-soft">Something went wrong.</p>
    <button
      type="button"
      onClick={onRetry}
      className="h-9 rounded-lg border border-app-line bg-app-hover px-4 text-[13px] text-app-soft transition-colors hover:bg-app-hover"
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
    <div className="text-app-faint flex size-14 items-center justify-center rounded-2xl border border-app-line bg-app-hover">
      {icon}
    </div>
    <div>
      <div className="text-[15px] font-medium text-app-fg">{title}</div>
      <div className="mx-auto mt-1 max-w-[360px] text-[13px] leading-snug text-app-faint">
        {hint}
      </div>
    </div>
  </div>
);
