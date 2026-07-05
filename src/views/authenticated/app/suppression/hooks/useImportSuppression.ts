import { toast } from 'sonner';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { importSuppressionAxios } from '@/api/api';
import { SuppressionErrors } from '@/api/suppression/entities/errors';
import { type ImportSuppressionResultDto } from '@/api/suppression/entities/response.entities';

type UseImportSuppressionProps = Readonly<{
  onImported: (result: ImportSuppressionResultDto) => void;
}>;

const useImportSuppression = ({ onImported }: UseImportSuppressionProps) =>
  useAsyncEvent({
    onError: ({ error }) => {
      switch (error.message) {
        case SuppressionErrors.invalidFile:
          toast.error('Invalid file. Upload a CSV under 5 MB.');
          break;
        case SuppressionErrors.noEmailsFound:
          toast.error('No email addresses found in that file.');
          break;
        default:
          toast.error("Couldn't import the file, please try again.");
      }
    },
    onSuccess: ({ returnedData }) => {
      onImported(returnedData);
      toast.success(`${returnedData.imported} addresses imported.`);
    },
    promise: (file: File) => importSuppressionAxios(file),
  });

export default useImportSuppression;
