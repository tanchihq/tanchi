import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getActivityAxios, getActivityStatusAxios } from '@/api/api';
import {
  type ActivityItemDto,
  type ActivityStatusDto,
} from '@/api/activity/entities/response.entities';
import { AppStatusContext, type AppStatusValue } from './app-status.context';

const RUNNING_POLL_MS = 4000;
const SEEN_STORAGE_KEY = 'tanchi-activity-seen';

const AppStatusProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
  const [status, setStatus] = useState<ActivityStatusDto | null>(null);
  const [activity, setActivity] = useState<ReadonlyArray<ActivityItemDto>>([]);
  const [polling, setPolling] = useState(false);
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(() =>
    localStorage.getItem(SEEN_STORAGE_KEY),
  );

  const loadStatus = useCallback(async () => {
    const next = await getActivityStatusAxios().catch(() => null);
    if (next !== null) {
      setStatus(next);
      setPolling(next.isRunning);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivity(await getActivityAxios(50).catch(() => []));
  }, []);

  const refetch = useCallback(() => {
    void loadStatus();
    void loadActivity();
  }, [loadStatus, loadActivity]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    if (!polling) return;
    const timer = setInterval(refetch, RUNNING_POLL_MS);
    return () => clearInterval(timer);
  }, [polling, refetch]);

  const notifyRunStarted = useCallback(() => {
    setPolling(true);
    setStatus((current) => (current === null ? current : { ...current, isRunning: true }));
    refetch();
  }, [refetch]);

  const markSeen = useCallback(() => {
    const latest = activity[0]?.createdAt ?? null;
    setLastSeenAt(latest);
    if (latest !== null) localStorage.setItem(SEEN_STORAGE_KEY, latest);
  }, [activity]);

  const hasUnread =
    activity.length > 0 && (lastSeenAt === null || activity[0].createdAt > lastSeenAt);

  const value = useMemo<AppStatusValue>(
    () => ({ status, activity, hasUnread, markSeen, notifyRunStarted, refetch }),
    [status, activity, hasUnread, markSeen, notifyRunStarted, refetch],
  );

  return <AppStatusContext.Provider value={value}>{children}</AppStatusContext.Provider>;
};

export default AppStatusProvider;
