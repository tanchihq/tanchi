import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { AppEmpty, AppError, AppLoader } from '@/components/AsyncState';
import useRetrieveConversations from './hooks/useRetrieveConversations';
import useCreateConversation from './hooks/useCreateConversation';
import useDeleteConversation from './hooks/useDeleteConversation';
import ConversationList from './conversation-list/ConversationList';
import ConversationView from './conversation-view/ConversationView';

const Chat = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { data, status, refetch } = useRetrieveConversations();

  const { onFetch: create, isLoading: creating } = useCreateConversation({
    onCreated: (conversation) => {
      refetch();
      navigate(`/app/chat/${conversation.id}`);
    },
  });

  const { onFetch: remove } = useDeleteConversation({
    onDeleted: (deletedId) => {
      setDeletingId(null);
      refetch();
      if (deletedId === id) navigate('/app/chat');
    },
  });

  const onDelete = (conversationId: string) => {
    setDeletingId(conversationId);
    remove(conversationId);
  };

  const conversations = data ?? [];

  return (
    <AppScreen title="Copilot">
      <div className="flex h-full">
        {status === 'loading' && data === undefined && <AppLoader />}
        {status === 'error' && data === undefined && <AppError onRetry={refetch} />}
        {data !== undefined && (
          <>
            <ConversationList
              conversations={conversations}
              activeId={id}
              creating={creating}
              deletingId={deletingId}
              onNew={() => create(undefined)}
              onSelect={(conversationId) => navigate(`/app/chat/${conversationId}`)}
              onDelete={onDelete}
            />
            <div className="min-w-0 flex-1">
              {id === undefined ? (
                <AppEmpty
                  icon={<MessageSquare size={22} />}
                  title="Your prospecting copilot"
                  hint="Pick a conversation on the left, or start a new one to ask about your prospects, rework a message, or get an angle."
                />
              ) : (
                <ConversationView key={id} id={id} onConversationChanged={refetch} />
              )}
            </div>
          </>
        )}
      </div>
    </AppScreen>
  );
};

export default Chat;
