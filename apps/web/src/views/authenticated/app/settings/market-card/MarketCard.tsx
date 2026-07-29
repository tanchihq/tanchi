import { type ReactNode, useState } from 'react';
import { type Control, useFormContext, useWatch } from 'react-hook-form';
import { ChevronDown, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { SelectNative } from '@/components/ui/select-native';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import CountrySelect from '@/components/country-select/CountrySelect';
import {
  countryFlag,
  countryName,
  defaultLanguageForCountry,
} from '@/utils/countries';
import SearchSendDaysEditor from '../search-send-days-editor/SearchSendDaysEditor';
import FollowUpEditor from '../follow-up-editor/FollowUpEditor';
import IcpEditor from '../icp-editor/IcpEditor';
import { LANGUAGES, type SettingsFormValues } from '../utils';

type MarketCardProps = Readonly<{
  control: Control<SettingsFormValues>;
  index: number;
  canRemove: boolean;
  onRemove: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
}>;

const FieldLabel = ({ children }: Readonly<{ children: ReactNode }>) => (
  <div className="mb-2 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">{children}</div>
);

const MarketCard = ({
  control,
  index,
  canRemove,
  onRemove,
  onRegenerate,
  isGenerating,
}: MarketCardProps) => {
  const { setValue, getValues } = useFormContext<SettingsFormValues>();
  const [expanded, setExpanded] = useState(true);
  const name = useWatch({ control, name: `markets.${index}.name` });
  const country = useWatch({ control, name: `markets.${index}.country` });

  const handleCountryChange = (code: string) => {
    setValue(`markets.${index}.country`, code, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue(`markets.${index}.outreachLanguage`, defaultLanguageForCountry(code), {
      shouldDirty: true,
      shouldValidate: true,
    });
    if ((getValues(`markets.${index}.name`) ?? '') === '') {
      setValue(`markets.${index}.name`, countryName(code), {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <div className="rounded-[18px] border border-white/[0.07] bg-[#171733]">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <button
          type="button"
          onClick={() => setExpanded((previous) => !previous)}
          className="flex size-7 shrink-0 items-center justify-center rounded-md text-[#ABA8C0] hover:bg-white/5"
          aria-label={expanded ? 'Collapse market' : 'Expand market'}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <FormField
          control={control}
          name={`markets.${index}.name`}
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Input className="h-[38px] font-medium" placeholder="Market name" {...field} />
              </FormControl>
            </FormItem>
          )}
        />
        <Badge variant="neutral" className="shrink-0 gap-1.5">
          <span className="text-sm leading-none">{countryFlag(country ?? 'US')}</span>
          {countryName(country ?? 'US')}
        </Badge>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            onClick={onRemove}
            aria-label="Remove market"
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-6 border-t border-white/[0.07] px-5 py-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <FieldLabel>Country</FieldLabel>
              <CountrySelect value={country ?? 'US'} onChange={handleCountryChange} />
            </div>
            <div>
              <FieldLabel>Leads per day</FieldLabel>
              <FormField
                control={control}
                name={`markets.${index}.leadsPerDay`}
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        className="h-11 w-28"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div>
            <FieldLabel>Outreach language</FieldLabel>
            <FormField
              control={control}
              name={`markets.${index}.outreachLanguage`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SelectNative className="max-w-xs" {...field}>
                      {LANGUAGES.map((entry) => (
                        <option key={entry.code} value={entry.code}>
                          {entry.label}
                        </option>
                      ))}
                    </SelectNative>
                  </FormControl>
                  <p className="mt-1.5 text-xs text-[#6F6C85]">
                    Auto-set from the country. Change it for multilingual markets
                    or when targeting a different language.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <FieldLabel>Company profile for this market</FieldLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                isLoading={isGenerating}
                onClick={onRegenerate}
              >
                {!isGenerating && <Sparkles size={13} />}
                Regenerate
              </Button>
            </div>
            <FormField
              control={control}
              name={`markets.${index}.companyProfile`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      rows={5}
                      placeholder="How you position for this market (language, value props, tone)…"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div>
            <FieldLabel>Search & send days</FieldLabel>
            <SearchSendDaysEditor
              control={control}
              name={`markets.${index}.followUp.excludedWeekdays`}
            />
          </div>

          <div>
            <FieldLabel>Follow-up cadence</FieldLabel>
            <FollowUpEditor
              control={control}
              name={`markets.${index}.followUp.intervals`}
            />
          </div>

          <div>
            <FieldLabel>Ideal clients{name === '' ? '' : ` — ${name}`}</FieldLabel>
            <IcpEditor control={control} marketIndex={index} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketCard;
