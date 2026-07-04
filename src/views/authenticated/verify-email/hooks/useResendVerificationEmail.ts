import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { resendVerificationEmailAxios } from '@/api/api';
import { type ResendVerificationEmailDto } from '@/api/auth/entities/request.entities';

const useResendVerificationEmail = () =>
  useAsyncEvent({
    onError: () => {
      toast.error("Couldn't resend the email, please try again.");
    },
    onSuccess: () => {
      toast.success('Verification email sent.');
    },
    promise: (data: ResendVerificationEmailDto) =>
      resendVerificationEmailAxios(data),
  });

export { useResendVerificationEmail };
