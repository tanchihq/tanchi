import { type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/utils/lib/utils';

type GlassFieldProps = ComponentProps<'input'> &
  Readonly<{
    icon: ReactNode;
    suffix?: ReactNode;
  }>;

// Champ translucide sombre du design auth. Le focus-ring est géré en CSS via
// `.glass-well:focus-within` (voir index.css).
const GlassField = ({ icon, suffix, className, ref, ...props }: GlassFieldProps) => (
  <div className="glass-well flex h-[52px] items-center gap-2.5 px-4">
    <span className="text-glass-dim flex shrink-0">{icon}</span>
    <input
      ref={ref}
      className={cn(
        'text-glass-fg min-w-0 flex-1 border-none bg-transparent text-[15px] outline-none',
        className,
      )}
      {...props}
    />
    {suffix}
  </div>
);

export { GlassField };
