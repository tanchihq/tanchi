import { type ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium',
  {
    variants: {
      variant: {
        brand: 'bg-brand-600/[0.18] text-brand-300',
        success: 'text-success bg-[rgba(74,222,128,0.14)]',
        warning: 'text-warn bg-[rgba(251,191,119,0.14)]',
        danger: 'text-danger bg-[rgba(255,138,128,0.14)]',
        neutral: 'border border-white/8 bg-white/[0.05] text-[#ABA8C0]',
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
