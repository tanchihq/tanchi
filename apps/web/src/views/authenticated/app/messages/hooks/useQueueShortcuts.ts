import { useEffect, useRef } from 'react';
import { type QueueSkipReason } from '@/api/queue/entities/response.entities';
import { SKIP_REASON_OPTIONS, isDialogOpen, isTypingTarget } from '../utils';

type QueueShortcutHandlers = Readonly<{
  enabled: boolean;
  onSend: () => void;
  onSkip: () => void;
  onEdit: () => void;
  onUndo: () => void;
  onReason: (reason: QueueSkipReason) => void;
}>;

const useQueueShortcuts = (handlers: QueueShortcutHandlers) => {
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const current = handlersRef.current;
      if (!current.enabled || isTypingTarget(event.target) || isDialogOpen())
        return;
      if (event.metaKey || event.ctrlKey || event.altKey) {
        if (event.key.toLowerCase() === 'z') {
          event.preventDefault();
          current.onUndo();
        }
        return;
      }
      const reason = SKIP_REASON_OPTIONS.find(
        (option) => option.shortcut === event.key,
      );
      if (reason !== undefined) {
        current.onReason(reason.reason);
        return;
      }
      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          current.onSend();
          return;
        case 'ArrowLeft':
          event.preventDefault();
          current.onSkip();
          return;
        case 'e':
        case 'E':
          event.preventDefault();
          current.onEdit();
          return;
        case 'z':
        case 'Z':
          current.onUndo();
          return;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);
};

export default useQueueShortcuts;
