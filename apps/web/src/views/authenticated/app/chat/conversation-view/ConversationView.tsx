import { AppError, AppLoader } from '@/components/AsyncState';
import useRetrieveConversation from '../hooks/useRetrieveConversation';
import ConversationBoard from '../conversation-board/ConversationBoard';

type ConversationViewProps = Readonly<{
  id: string;
  onConversationChanged: () => void;
}>;

const ConversationView = ({ id, onConversationChanged }: ConversationViewProps) => {
  const { data, status, refetch } = useRetrieveConversation({ id });

  if (status === 'loading') return <AppLoader />;
  if (status === 'error' || !data) return <AppError onRetry={refetch} />;

  return (
    <ConversationBoard conversation={data} onConversationChanged={onConversationChanged} />
  );
};

export default ConversationView;
