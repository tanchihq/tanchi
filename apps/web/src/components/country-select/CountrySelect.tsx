import { useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/utils/lib/utils';
import {
  COUNTRY_CODES,
  countryFlag,
  countryName,
} from '@/utils/countries';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type CountrySelectProps = Readonly<{
  value: string;
  onChange: (code: string) => void;
}>;

const CountrySelect = ({ value, onChange }: CountrySelectProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="glass-well text-app-fg flex h-11 w-full items-center justify-between gap-2 px-4 text-sm outline-none"
        >
          <span className="flex items-center gap-2 truncate">
            <span className="text-base leading-none">{countryFlag(value)}</span>
            <span className="truncate">{countryName(value)}</span>
          </span>
          <ChevronsUpDown size={15} className="text-app-faint shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
        <Command>
          <CommandInput placeholder="Search a country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            {COUNTRY_CODES.map((code) => (
              <CommandItem
                key={code}
                value={`${countryName(code)} ${code}`}
                onSelect={() => {
                  onChange(code);
                  setOpen(false);
                }}
              >
                <span className="text-base leading-none">{countryFlag(code)}</span>
                <span className="flex-1 truncate">{countryName(code)}</span>
                <Check
                  size={15}
                  className={cn(
                    'shrink-0 text-brand-300',
                    value === code ? 'opacity-100' : 'opacity-0',
                  )}
                />
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default CountrySelect;
