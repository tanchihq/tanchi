import { type ComponentProps, type ReactNode } from 'react';
import { cn } from '@/utils/lib/utils';

const FieldLabel = ({ children }: Readonly<{ children: ReactNode }>) => (
  <div className="mb-[7px] text-[13px] text-[#A7ACB8]">{children}</div>
);

const DarkInput = ({ className, ...props }: ComponentProps<'input'>) => (
  <input
    className={cn(
      'glass-well text-glass-fg placeholder:text-glass-dim h-[52px] w-full px-4 text-[15px] outline-none',
      className,
    )}
    {...props}
  />
);

const DarkTextarea = ({ className, ...props }: ComponentProps<'textarea'>) => (
  <textarea
    className={cn(
      'glass-well text-glass-fg placeholder:text-glass-dim w-full resize-none px-4 py-3 text-[14px] leading-relaxed outline-none',
      className,
    )}
    {...props}
  />
);

type LabeledFieldProps = Readonly<{
  label: string;
  children: ReactNode;
}>;

const LabeledField = ({ label, children }: LabeledFieldProps) => (
  <div>
    <FieldLabel>{label}</FieldLabel>
    {children}
  </div>
);

export { DarkInput, DarkTextarea, FieldLabel, LabeledField };
