import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Sparkles } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppError, AppLoader } from '@/components/AsyncState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SelectNative } from '@/components/ui/select-native';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import SettingsSection from './settings-section/SettingsSection';
import IcpEditor from './icp-editor/IcpEditor';
import SearchSendDaysEditor from './search-send-days-editor/SearchSendDaysEditor';
import FollowUpEditor from './follow-up-editor/FollowUpEditor';
import useRetrieveSettings from './hooks/useRetrieveSettings';
import useUpdateSettings from './hooks/useUpdateSettings';
import useGenerateProfile from './hooks/useGenerateProfile';
import {
  DEFAULT_SETTINGS,
  LANGUAGES,
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
  const icps = useFieldArray({ control: form.control, name: 'icps' });

  const { status, refetch } = useRetrieveSettings({
    onLoaded: (data) => form.reset(toFormValues(data)),
  });
  const { onFetch: save, isLoading: saving } = useUpdateSettings({
    onSaved: (data) => form.reset(toFormValues(data)),
  });
  const { onFetch: generate, isLoading: generating } = useGenerateProfile({
    onGenerated: (companyProfile) =>
      form.setValue('companyProfile', companyProfile, { shouldDirty: true, shouldValidate: true }),
  });

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

            <SettingsSection title="Outreach language">
              <FormField
                control={form.control}
                name="outreachLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      The language the agent writes to prospects in (independent of this
                      interface)
                    </FormLabel>
                    <FormControl>
                      <SelectNative {...field}>
                        {LANGUAGES.map((language) => (
                          <option key={language.code} value={language.code}>
                            {language.label}
                          </option>
                        ))}
                      </SelectNative>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>

            <SettingsSection title="Company profile">
              <FormField
                control={form.control}
                name="companyProfile"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel>
                        What the agent should know about your company (AI-generated, editable)
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        isLoading={generating}
                        onClick={() => generate()}
                      >
                        {!generating && <Sparkles size={13} />}
                        Regenerate
                      </Button>
                    </div>
                    <FormControl>
                      <Textarea rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>

            <SettingsSection title="Search & send days">
              <SearchSendDaysEditor control={form.control} />
            </SettingsSection>

            <SettingsSection title="Leads per day">
              <FormField
                control={form.control}
                name="leadsPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={200}
                        className="h-[38px] w-28"
                        value={field.value}
                        onChange={(event) => field.onChange(event.target.valueAsNumber)}
                      />
                    </FormControl>
                    <p className="text-xs leading-relaxed text-[#6F6C85]">
                      Max number of new prospects the AI sources on each active day. Lower it if
                      your review queue gets too crowded.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SettingsSection>

            <SettingsSection title="Follow-up cadence">
              <FollowUpEditor control={form.control} />
            </SettingsSection>

            <SettingsSection title="Ideal clients">
              <IcpEditor
                control={form.control}
                fields={icps.fields}
                append={icps.append}
                remove={icps.remove}
              />
            </SettingsSection>
          </form>
        </Form>
      </div>
    </AppScreen>
  );
};

export default Settings;
