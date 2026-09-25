import { useCallback, useEffect, useRef, useState } from 'react';

type UsePendingActionProps<Action> = Readonly<{
  delayMs: number;
  onCommit: (action: Action) => void;
}>;

const usePendingAction = <Action>({
  delayMs,
  onCommit,
}: UsePendingActionProps<Action>) => {
  const [pending, setPending] = useState<Action | null>(null);
  const pendingRef = useRef<Action | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  const clearTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const settle = useCallback((): Action | null => {
    clearTimer();
    const action = pendingRef.current;
    pendingRef.current = null;
    setPending(null);
    return action;
  }, []);

  const commitNow = useCallback(() => {
    const action = settle();
    if (action !== null) onCommitRef.current(action);
  }, [settle]);

  const schedule = useCallback(
    (action: Action) => {
      commitNow();
      pendingRef.current = action;
      setPending(action);
      timerRef.current = setTimeout(commitNow, delayMs);
    },
    [commitNow, delayMs],
  );

  const replace = useCallback((action: Action) => {
    pendingRef.current = action;
    setPending(action);
  }, []);

  const undo = useCallback((): Action | null => settle(), [settle]);

  useEffect(() => commitNow, [commitNow]);

  return { pending, schedule, replace, commitNow, undo };
};

export default usePendingAction;
