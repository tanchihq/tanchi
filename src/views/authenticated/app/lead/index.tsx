import { useEffect } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppError, AppLoader } from '@/components/AsyncState';
import LeadHeader from './lead-header/LeadHeader';
import LeadSummary from './lead-summary/LeadSummary';
import LeadConversation from './lead-conversation/LeadConversation';
import useRetrieveProspect from './hooks/useRetrieveProspect';
import useRetrieveOrder from './hooks/useRetrieveOrder';
import useMoveStage from './hooks/useMoveStage';
import useSendDraft from './hooks/useSendDraft';
import useLeadSenders from './hooks/useLeadSenders';

type LeadPanelProps = Readonly<{ id: string }>;

const LeadPanel = ({ id }: LeadPanelProps) => {
  const navigate = useNavigate();
  const detail = useRetrieveProspect({ id });
  const orderQuery = useRetrieveOrder();

  const order = (orderQuery.data ?? []).map((prospect) => prospect.id);
  const index = order.indexOf(id);

  const step = (delta: number) => {
    const target = order[index + delta];
    if (target) navigate(`/app/lead/${target}`);
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        step(1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        step(-1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, order.length]);

  const move = useMoveStage({ onDone: detail.refetch });
  const sendDraft = useSendDraft({ onDone: detail.refetch });
  const sendersQuery = useLeadSenders();
  const activeSenders = (sendersQuery.data ?? []).filter(
    (sender) => sender.status === 'active',
  );

  const lead = detail.data;

  return (
    <div className="flex h-full flex-col" style={{ animation: 'sl-card-in 0.32s ease both' }}>
      <LeadHeader
        stage={lead?.stage ?? 'identified'}
        index={index}
        orderLength={order.length}
        onBack={() => navigate('/app')}
        onStage={(stage) => move.onFetch({ id, stage, origin: 'manual' })}
        onPrev={() => step(-1)}
        onNext={() => step(1)}
      />

      {detail.status === 'loading' && <AppLoader />}
      {(detail.status === 'error' || (detail.status === 'success' && !lead)) && (
        <AppError onRetry={detail.refetch} />
      )}

      {lead && (
        <div className="min-h-0 flex-1 overflow-y-auto px-[30px] py-[26px]">
          <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-[22px] lg:grid-cols-2">
            <LeadSummary lead={lead} />
            <LeadConversation
              lead={lead}
              senders={activeSenders}
              sending={sendDraft.isLoading}
              onSend={(edited, senderId) =>
                sendDraft.onFetch({ id, stage: lead.stage, edited, senderId })
              }
              onQualify={(stage) => move.onFetch({ id, stage, origin: 'manual' })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

const LeadPanelRoute = () => {
  const { id } = useParams();
  if (id === undefined) return <Navigate replace to="/app" />;
  return <LeadPanel key={id} id={id} />;
};

export default LeadPanelRoute;
