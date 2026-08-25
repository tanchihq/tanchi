import { type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium',
  {
    variants: {
      variant: {
        brand: 'bg-app-accent-bg text-app-accent-fg',
        success: 'text-app-success-fg bg-app-success-bg',
        warning: 'text-app-warn-fg bg-app-warn-bg',
        danger: 'text-app-danger-fg bg-app-danger-bg',
        neutral: 'border-app-line bg-app-hover text-app-soft border',
      },
    },
    defaultVariants: { variant: 'brand' },
  },
);

type BadgeProps = ComponentProps<'span'> & VariantProps<typeof badgeVariants>;

const Badge = ({ className, variant, ...props }: BadgeProps) => (
  <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { Badge, badgeVariants };
