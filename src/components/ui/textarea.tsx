import { type ComponentProps } from 'react';
import { cn } from '@/utils/lib/utils';

const Textarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea
    data-slot="textarea"
    className={cn(
      'glass-well text-glass-fg placeholder:text-glass-dim w-full resize-none px-4 py-3 text-sm leading-relaxed outline-none disabled:opacity-60',
      className,
    )}
    {...props}
  />
);

export { Textarea };
