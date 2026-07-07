import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { generateOnboardingProfileAxios } from '@/api/api';
import { type GeneratedProfileDto } from '@/api/onboarding/generate-profile';
import { type GenerateProfileDto } from '@/api/onboarding/entities/request.entities';

type UseGenerateOnboardingProfileProps = Readonly<{
  onGenerated: (profile: string) => void;
}>;

const useGenerateOnboardingProfile = ({ onGenerated }: UseGenerateOnboardingProfileProps) =>
  useAsyncEvent<GeneratedProfileDto, GenerateProfileDto>({
    onError: ({ error }) =>
      toast.error(
        error.message === 'invalidWebsite'
          ? 'Add a valid website first.'
          : "Couldn't generate the profile, please try again.",
      ),
    onSuccess: ({ returnedData }) => {
      onGenerated(returnedData.companyProfile);
      toast.success('Company profile generated.');
    },
    promise: (dto: GenerateProfileDto) => generateOnboardingProfileAxios(dto),
  });

export default useGenerateOnboardingProfile;
