import { AppScreen } from '../AppScreen';
import { AppError, AppLoader } from '@/components/AsyncState';
import useRetrieveSenders from './hooks/useRetrieveSenders';
import SenderCard from './sender-card/SenderCard';
import SenderForm from './sender-form/SenderForm';

const Mailbox = () => {
  const { data, status, refetch } = useRetrieveSenders();

  if (status === 'loading') {
    return (
      <AppScreen title="Mailbox">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Mailbox">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const senders = data ?? [];

  return (
    <AppScreen title="Mailbox">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <div className="mx-auto flex max-w-[720px] flex-col gap-4">
          <p className="text-sm leading-relaxed text-[#ABA8C0]">
            Connect your own mailbox. Emails go out from your address (SMTP) and replies are
            read back (IMAP). Editing a mailbox means deleting and re-creating it.
          </p>

          {senders.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {senders.map((sender) => (
                <SenderCard key={sender.id} sender={sender} onChanged={refetch} />
              ))}
            </div>
          )}

          <SenderForm onCreated={refetch} />
        </div>
      </div>
    </AppScreen>
  );
};

export default Mailbox;
