import { type ComponentProps } from 'react';
import { cn } from '@/utils/lib/utils';

const Input = ({ className, ...props }: ComponentProps<'input'>) => (
  <input
    data-slot="input"
    className={cn(
      'glass-well text-glass-fg placeholder:text-glass-dim h-11 w-full px-4 text-sm outline-none disabled:opacity-60',
      className,
    )}
    {...props}
  />
);

export { Input };
