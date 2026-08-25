import { type ComponentProps } from 'react';
import { cn } from '@/utils/lib/utils';

const Label = ({ className, ...props }: ComponentProps<'label'>) => (
  <label
    data-slot="label"
    className={cn('text-app-soft text-[13px]', className)}
    {...props}
  />
);

export { Label };
