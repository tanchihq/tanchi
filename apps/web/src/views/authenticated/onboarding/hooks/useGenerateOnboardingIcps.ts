import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { generateOnboardingIcpsAxios } from '@/api/api';
import { type GeneratedIcpsDto } from '@/api/onboarding/generate-icps';
import {
  type GenerateIcpsDto,
  type IcpDraft,
} from '@/api/onboarding/entities/request.entities';

type UseGenerateOnboardingIcpsProps = Readonly<{
  onGenerated: (icps: ReadonlyArray<IcpDraft>) => void;
}>;

const useGenerateOnboardingIcps = ({
  onGenerated,
}: UseGenerateOnboardingIcpsProps) =>
  useAsyncEvent<GeneratedIcpsDto, GenerateIcpsDto>({
    onError: ({ error }) =>
      toast.error(
        error.message === 'invalidWebsite'
          ? 'Add a valid website first.'
          : "Couldn't suggest profiles, please try again.",
      ),
    onSuccess: ({ returnedData }) => {
      onGenerated(returnedData.icps);
      toast.success(
        returnedData.icps.length === 1
          ? '1 profile suggested — review it on the next step.'
          : `${returnedData.icps.length} profiles suggested — review them on the next step.`,
      );
    },
    promise: (dto: GenerateIcpsDto) => generateOnboardingIcpsAxios(dto),
  });

export default useGenerateOnboardingIcps;
