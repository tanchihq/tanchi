import { useRef, useState } from 'react';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, TriangleAlert } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppError, AppLoader } from '@/components/AsyncState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import SettingsSection from './settings-section/SettingsSection';
import BillingSection from './billing-section/BillingSection';
import MarketCard from './market-card/MarketCard';
import useRetrieveSettings from './hooks/useRetrieveSettings';
import useUpdateSettings from './hooks/useUpdateSettings';
import useGenerateProfile from './hooks/useGenerateProfile';
import {
  DEFAULT_SETTINGS,
  EMPTY_MARKET,
  learningDilutionWarning,
  settingsSchema,
  toFormValues,
  type SettingsFormValues,
} from './utils';

const Settings = () => {
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    mode: 'onChange',
    defaultValues: DEFAULT_SETTINGS,
  });
  const markets = useFieldArray({ control: form.control, name: 'markets' });
  const watchedMarkets = useWatch({ control: form.control, name: 'markets' });
  const dilutionWarning = learningDilutionWarning(watchedMarkets ?? []);

  const regenerateTarget = useRef<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const { status, refetch } = useRetrieveSettings({
    onLoaded: (data) => form.reset(toFormValues(data)),
  });
  const { onFetch: save, isLoading: saving } = useUpdateSettings({
    onSaved: (data) => form.reset(toFormValues(data)),
  });
  const { onFetch: generate, isLoading: generating } = useGenerateProfile({
    onGenerated: (companyProfile) => {
      const target = regenerateTarget.current;
      if (target === null) return;
      form.setValue(`markets.${target}.companyProfile`, companyProfile, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setRegeneratingIndex(null);
    },
  });

  const handleRegenerate = (index: number) => {
    regenerateTarget.current = index;
    setRegeneratingIndex(index);
    generate();
  };

  if (status === 'loading') {
    return (
      <AppScreen title="Settings">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Settings">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Settings">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => save(values))}
            className="mx-auto flex max-w-[720px] flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#ABA8C0]">
                What the agent knows about you and who it writes to.
              </p>
              <Button
                type="submit"
                size="lg"
                isLoading={saving}
                disabled={!form.formState.isValid}
              >
                Save
              </Button>
            </div>

            <SettingsSection title="Company">
              <div className="flex flex-col gap-3.5">
                <FormField
                  control={form.control}
                  name="company.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="company.website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsSection>

            <SettingsSection title="Resources">
              <div className="flex flex-col gap-3.5">
                <FormField
                  control={form.control}
                  name="resources.productPageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product page</FormLabel>
                      <FormControl>
                        <Input placeholder="https://" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="resources.salesDeckUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sales deck</FormLabel>
                      <FormControl>
                        <Input placeholder="Add a link" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SettingsSection>

            <div className="mt-2 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-medium text-white">Markets</h2>
                <p className="text-xs text-[#6F6C85]">
                  One market per language / positioning. Each learns on its own.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => markets.append(EMPTY_MARKET)}
              >
                <Plus size={14} /> Add a market
              </Button>
            </div>

            {dilutionWarning !== null && (
              <div className="text-warn flex items-start gap-2.5 rounded-[14px] border border-[rgba(251,191,119,0.25)] bg-[rgba(251,191,119,0.08)] p-3.5 text-[13px]">
                <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                <span>{dilutionWarning}</span>
              </div>
            )}

            <div className="flex flex-col gap-3.5">
              {markets.fields.map((item, index) => (
                <MarketCard
                  key={item.id}
                  control={form.control}
                  index={index}
                  canRemove={markets.fields.length > 1}
                  onRemove={() => markets.remove(index)}
                  onRegenerate={() => handleRegenerate(index)}
                  isGenerating={generating && regeneratingIndex === index}
                />
              ))}
            </div>
          </form>
        </Form>
        <div className="mx-auto mt-4 flex max-w-[720px] flex-col gap-4 pb-7">
          <BillingSection />
        </div>
      </div>
    </AppScreen>
  );
};

export default Settings;
