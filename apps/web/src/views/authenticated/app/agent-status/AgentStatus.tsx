import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAppStatus } from '../store/app-status.context';
import NotificationPanel from './notification-panel/NotificationPanel';

const AgentStatus = () => {
  const navigate = useNavigate();
  const { status, activity, hasUnread, markSeen, refetch } = useAppStatus();
  const [open, setOpen] = useState(false);

  const running = status?.isRunning === true;

  const toggle = () => {
    setOpen((value) => {
      if (!value) {
        refetch();
        markSeen();
      }
      return !value;
    });
  };

  return (
    <div className="relative flex items-center gap-2">
      <div className="flex items-center gap-2 whitespace-nowrap rounded-[20px] border border-app-line bg-app-hover px-3 py-1.5 text-xs text-app-soft">
        <span
          className="size-[7px] rounded-full"
          style={{
            background: running ? 'var(--app-success-fg)' : 'var(--app-faint)',
            boxShadow: running ? '0 0 0 3px var(--app-success-bg)' : 'none',
          }}
        />
        {running ? 'Agent working' : 'Agent idle'}
        {status && <span className="text-app-faint">· {status.today.sent} sent today</span>}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="relative flex size-8 items-center justify-center rounded-lg border border-app-line bg-app-hover text-app-soft transition-colors hover:bg-app-hover"
        aria-label="Activity"
      >
        <Bell size={15} />
        {hasUnread && !open && (
          <span className="bg-brand-500 absolute right-1.5 top-1.5 size-2 rounded-full ring-2 ring-app-raised" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <NotificationPanel
            items={activity}
            onOpenLead={(leadId) => {
              setOpen(false);
              navigate(`/app/lead/${leadId}`);
            }}
          />
        </>
      )}
    </div>
  );
};

export default AgentStatus;
