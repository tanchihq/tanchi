import { type ComponentProps } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Search } from 'lucide-react';

import { cn } from '@/utils/lib/utils';

const Command = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive>) => (
  <CommandPrimitive
    data-slot="command"
    className={cn('flex h-full w-full flex-col overflow-hidden', className)}
    {...props}
  />
);

const CommandInput = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Input>) => (
  <div className="flex items-center gap-2 border-b border-app-line px-3" data-slot="command-input-wrapper">
    <Search size={15} className="shrink-0 text-app-faint" />
    <CommandPrimitive.Input
      data-slot="command-input"
      className={cn(
        'flex h-10 w-full bg-transparent py-3 text-sm text-app-fg outline-none placeholder:text-app-faint disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  </div>
);

const CommandList = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.List>) => (
  <CommandPrimitive.List
    data-slot="command-list"
    className={cn('max-h-64 overflow-y-auto overflow-x-hidden p-1', className)}
    {...props}
  />
);

const CommandEmpty = ({
  ...props
}: ComponentProps<typeof CommandPrimitive.Empty>) => (
  <CommandPrimitive.Empty
    data-slot="command-empty"
    className="py-6 text-center text-sm text-app-faint"
    {...props}
  />
);

const CommandItem = ({
  className,
  ...props
}: ComponentProps<typeof CommandPrimitive.Item>) => (
  <CommandPrimitive.Item
    data-slot="command-item"
    className={cn(
      "flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[selected=true]:bg-app-hover data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className,
    )}
    {...props}
  />
);

export { Command, CommandInput, CommandList, CommandEmpty, CommandItem };
