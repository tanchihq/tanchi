import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { updateSettingsAxios } from '@/api/api';
import { SettingsErrors } from '@/api/settings/entities/errors';
import { type SettingsDto } from '@/api/settings/entities/settings.entities';

type UseUpdateSettingsProps = Readonly<{
  onSaved: (settings: SettingsDto) => void;
}>;

const useUpdateSettings = ({ onSaved }: UseUpdateSettingsProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SettingsErrors.invalidWebsite:
          toast.error('Enter a valid website URL.');
          break;
        case SettingsErrors.invalidLanguage:
          toast.error('Invalid outreach language.');
          break;
        case SettingsErrors.invalidResource:
          toast.error('A resource URL is invalid.');
          break;
        default:
          toast.error('Some fields are invalid, please review them.');
      }
    },
    onSuccess: ({ returnedData }) => {
      onSaved(returnedData);
      toast.success('Settings saved.');
    },
    promise: (dto: SettingsDto) => updateSettingsAxios(dto),
  });

export default useUpdateSettings;
