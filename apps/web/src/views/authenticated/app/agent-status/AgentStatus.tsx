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
      <div className="flex items-center gap-2 whitespace-nowrap rounded-[20px] border border-white/8 bg-white/[0.04] px-3 py-1.5 text-xs text-[#ABA8C0]">
        <span
          className="size-[7px] rounded-full"
          style={{
            background: running ? '#4ade80' : '#6f6c85',
            boxShadow: running ? '0 0 0 3px rgba(74,222,128,0.14)' : 'none',
          }}
        />
        {running ? 'Agent working' : 'Agent idle'}
        {status && <span className="text-[#6F6C85]">· {status.today.sent} sent today</span>}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="relative flex size-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04] text-[#ABA8C0] transition-colors hover:bg-white/[0.08]"
        aria-label="Activity"
      >
        <Bell size={15} />
        {hasUnread && !open && (
          <span className="bg-brand-500 absolute right-1.5 top-1.5 size-2 rounded-full ring-2 ring-[#141330]" />
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
