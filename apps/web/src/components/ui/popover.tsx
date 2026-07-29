import { type ComponentProps } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/utils/lib/utils';

const Popover = ({ ...props }: ComponentProps<typeof PopoverPrimitive.Root>) => (
  <PopoverPrimitive.Root data-slot="popover" {...props} />
);

const PopoverTrigger = ({
  ...props
}: ComponentProps<typeof PopoverPrimitive.Trigger>) => (
  <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
);

const PopoverContent = ({
  className,
  align = 'start',
  sideOffset = 4,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      data-slot="popover-content"
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-[14px] border border-white/10 bg-[#171733] p-1 text-[#E7E5F2] shadow-glass outline-none',
        'animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
);

export { Popover, PopoverTrigger, PopoverContent };
