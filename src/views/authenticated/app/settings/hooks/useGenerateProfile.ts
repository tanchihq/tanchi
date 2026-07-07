import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { generateSettingsProfileAxios } from '@/api/api';
import { type GeneratedProfileDto } from '@/api/settings/entities/settings.entities';

type UseGenerateProfileProps = Readonly<{ onGenerated: (profile: string) => void }>;

const useGenerateProfile = ({ onGenerated }: UseGenerateProfileProps) =>
  useAsyncEvent<GeneratedProfileDto, void>({
    onError: () => toast.error("Couldn't generate the profile, please try again."),
    onSuccess: ({ returnedData }) => {
      onGenerated(returnedData.companyProfile);
      toast.success('Company profile generated.');
    },
    promise: () => generateSettingsProfileAxios(),
  });

export default useGenerateProfile;
