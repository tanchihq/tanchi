import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppEmpty, AppError, AppLoader } from '@/components/AsyncState';
import MessageRow from './message-row/MessageRow';
import useRetrieveMessages from './hooks/useRetrieveMessages';

const Messages = () => {
  const navigate = useNavigate();
  const { data, status, refetch } = useRetrieveMessages();

  if (status === 'loading') {
    return (
      <AppScreen title="Messages">
        <AppLoader />
      </AppScreen>
    );
  }
  if (status === 'error') {
    return (
      <AppScreen title="Messages">
        <AppError onRetry={refetch} />
      </AppScreen>
    );
  }

  const messages = data ?? [];

  if (messages.length === 0) {
    return (
      <AppScreen title="Messages">
        <AppEmpty
          icon={<History size={22} />}
          title="No messages yet"
          hint="Every message the agent drafts and sends shows up here, with its status."
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="Messages">
      <div className="h-full overflow-y-auto px-[30px] py-7">
        <div className="mx-auto flex max-w-[720px] flex-col gap-2">
          {messages.map((message) => (
            <MessageRow
              key={message.id}
              message={message}
              onOpen={(leadId) => navigate(`/app/lead/${leadId}`)}
            />
          ))}
        </div>
      </div>
    </AppScreen>
  );
};

export default Messages;
