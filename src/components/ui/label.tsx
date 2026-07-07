import { type ComponentProps } from 'react';
import { cn } from '@/utils/lib/utils';

const Label = ({ className, ...props }: ComponentProps<'label'>) => (
  <label
    data-slot="label"
    className={cn('text-[13px] text-[#A7ACB8]', className)}
    {...props}
  />
);

export { Label };
