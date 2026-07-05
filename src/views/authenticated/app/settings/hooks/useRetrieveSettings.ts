import { useAsync } from '@/hooks/useAsync';
import { getSettingsAxios } from '@/api/api';
import { type SettingsDto } from '@/api/settings/entities/settings.entities';

type UseRetrieveSettingsProps = Readonly<{
  onLoaded: (settings: SettingsDto) => void;
}>;

const useRetrieveSettings = ({ onLoaded }: UseRetrieveSettingsProps) =>
  useAsync({
    promise: () => getSettingsAxios(),
    onSuccess: ({ returnedData }) => onLoaded(returnedData),
  });

export default useRetrieveSettings;
