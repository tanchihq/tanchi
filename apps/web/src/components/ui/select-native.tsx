import { type ComponentProps } from 'react';
import { cn } from '@/utils/lib/utils';

const SelectNative = ({ className, children, ...props }: ComponentProps<'select'>) => (
  <select
    data-slot="select-native"
    className={cn(
      'glass-well text-app-fg h-11 w-full px-4 text-sm outline-none disabled:opacity-60',
      className,
    )}
    {...props}
  >
    {children}
  </select>
);

export { SelectNative };
