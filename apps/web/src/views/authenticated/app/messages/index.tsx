import { useCallback, useState } from 'react';
import { Check, Inbox, PencilLine, X } from 'lucide-react';
import { AppScreen } from '../AppScreen';
import { useAppStatus } from '../store/app-status.context';
import { AppEmpty, AppError, AppLoader } from '@/components/AsyncState';
import { Button } from '@/components/ui/button';
import { type AutopilotDto } from '@/api/autopilot/entities/response.entities';
import {
  type QueueItemDto,
  type QueueSkipReason,
} from '@/api/queue/entities/response.entities';
import AutopilotBar from './autopilot-bar/AutopilotBar';
import SwipeDeck from './swipe-deck/SwipeDeck';
import PendingActionBar from './pending-action-bar/PendingActionBar';
import { type DraftFormValues } from './swipe-card/draft-editor/utils';
import useRetrieveQueue from './hooks/useRetrieveQueue';
import useRetrieveAutopilot from './hooks/useRetrieveAutopilot';
import useUpdateAutopilot from './hooks/useUpdateAutopilot';
import useValidateQueueItem from './hooks/useValidateQueueItem';
import useSkipQueueItem from './hooks/useSkipQueueItem';
import useEditQueueItem from './hooks/useEditQueueItem';
import usePendingAction from './hooks/usePendingAction';
import useSwipeGesture, { type SwipeDirection } from './hooks/useSwipeGesture';
import useQueueShortcuts from './hooks/useQueueShortcuts';
import {
  UNDO_DELAY_MS,
  emptyHint,
  handOffManualMessage,
  isEmailItem,
  replaceItem,
  sendButtonLabel,
  withAutoSend,
  withItemFirst,
  withoutItem,
  type PendingAction,
} from './utils';

const SCREEN_TITLE = 'Queue';

const Messages = () => {
  const { refetch: refreshStatus } = useAppStatus();
  const [items, setItems] = useState<ReadonlyArray<QueueItemDto>>([]);
  const [autopilot, setAutopilot] = useState<AutopilotDto | null>(null);
  const [editing, setEditing] = useState(false);

  const queue = useRetrieveQueue({
    onLoaded: (loaded) => setItems(loaded.items),
  });
  useRetrieveAutopilot({ onLoaded: setAutopilot });

  const restore = useCallback(
    (item: QueueItemDto) => setItems((current) => withItemFirst(current, item)),
    [],
  );

  const validate = useValidateQueueItem({
    onSent: refreshStatus,
    onFailed: restore,
  });
  const skip = useSkipQueueItem({
    onSkipped: refreshStatus,
    onFailed: restore,
  });
  const edit = useEditQueueItem({
    onSaved: (saved) => {
      setItems((current) => replaceItem(current, saved));
      setEditing(false);
    },
  });
  const update = useUpdateAutopilot({
    onUpdated: (next) => {
      setAutopilot(next);
      setItems((current) => withAutoSend(current, next.enabled));
    },
  });

  const commit = (action: PendingAction) => {
    if (action.kind === 'send') {
      validate.onFetch(action.item);
      return;
    }
    skip.onFetch({ item: action.item, reason: action.reason });
  };
  const pendingAction = usePendingAction<PendingAction>({
    delayMs: UNDO_DELAY_MS,
    onCommit: commit,
  });

  const top = items[0];

  const handleSwipe = (direction: SwipeDirection) => {
    if (top === undefined) return;
    setEditing(false);
    setItems((current) => withoutItem(current, top.id));
    if (direction === 'right') {
      if (!isEmailItem(top)) handOffManualMessage(top);
      pendingAction.schedule({ kind: 'send', item: top });
      return;
    }
    pendingAction.schedule({ kind: 'skip', item: top, reason: null });
  };

  const gesture = useSwipeGesture({
    enabled: !editing && top !== undefined,
    onSwipe: handleSwipe,
  });

  const undo = () => {
    const action = pendingAction.undo();
    if (action !== null) restore(action.item);
  };

  const chooseReason = (reason: QueueSkipReason) => {
    const current = pendingAction.pending;
    if (current === null || current.kind !== 'skip') return;
    pendingAction.replace({ ...current, reason });
    pendingAction.commitNow();
  };

  const saveDraft = (item: QueueItemDto, values: DraftFormValues) =>
    edit.onFetch({
      id: item.id,
      message: values.message,
      ...(item.channel === 'email' && {
        subject: values.subject.trim() === '' ? null : values.subject,
      }),
    });

  useQueueShortcuts({
    enabled: !editing,
    onSend: () => {
      if (top !== undefined) gesture.fly('right');
    },
    onSkip: () => {
      if (top !== undefined) gesture.fly('left');
    },
    onEdit: () => {
      if (top !== undefined) setEditing(true);
    },
    onUndo: undo,
    onReason: chooseReason,
  });

  if (queue.status === 'loading') {
    return (
      <AppScreen title={SCREEN_TITLE}>
        <AppLoader />
      </AppScreen>
    );
  }
  if (queue.status === 'error') {
    return (
      <AppScreen title={SCREEN_TITLE}>
        <AppError onRetry={queue.refetch} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title={SCREEN_TITLE}>
      <div className="flex h-full flex-col items-center gap-4 overflow-y-auto px-4 py-6 sm:px-[30px]">
        {autopilot !== null && (
          <div className="w-full max-w-[560px]">
            <AutopilotBar
              autopilot={autopilot}
              updating={update.isLoading}
              onChange={(enabled) => update.onFetch(enabled)}
            />
          </div>
        )}

        {top === undefined ? (
          <div className="flex min-h-[320px] w-full max-w-[560px] flex-1">
            <AppEmpty
              icon={<Inbox size={22} />}
              title="All caught up"
              hint={emptyHint(autopilot?.enabled ?? false)}
            />
          </div>
        ) : (
          <>
            <div className="text-app-faint flex w-full max-w-[560px] items-center justify-between text-xs">
              <span>{items.length} to review</span>
              <span className="hidden sm:inline">
                ← skip · E edit · → send · Z undo
              </span>
            </div>
            <div className="relative h-[min(600px,calc(100vh-420px))] min-h-[420px] w-full max-w-[560px] shrink-0">
              <SwipeDeck
                items={items}
                gesture={gesture}
                editing={editing}
                saving={edit.isLoading}
                onStartEdit={() => setEditing(true)}
                onCancelEdit={() => setEditing(false)}
                onSave={saveDraft}
              />
            </div>
            <div className="relative z-10 flex w-full max-w-[560px] items-center justify-center gap-2.5">
              <Button
                variant="outline"
                size="lg"
                disabled={editing}
                onClick={() => gesture.fly('left')}
              >
                <X size={16} /> Skip
              </Button>
              <Button
                variant="outline"
                size="lg"
                disabled={editing}
                onClick={() => setEditing(true)}
              >
                <PencilLine size={16} /> Edit
              </Button>
              <Button
                size="lg"
                disabled={editing}
                onClick={() => gesture.fly('right')}
              >
                <Check size={16} /> {sendButtonLabel(top)}
              </Button>
            </div>
          </>
        )}

        <div className="flex min-h-[96px] w-full max-w-[560px] shrink-0 justify-center">
          {pendingAction.pending !== null && (
            <PendingActionBar
              pending={pendingAction.pending}
              delayMs={UNDO_DELAY_MS}
              onUndo={undo}
              onReason={chooseReason}
            />
          )}
        </div>
      </div>
    </AppScreen>
  );
};

export default Messages;
