import { createContext, useContext } from 'react';
import {
  type ActivityItemDto,
  type ActivityStatusDto,
} from '@/api/activity/entities/response.entities';

export type AppStatusValue = Readonly<{
  status: ActivityStatusDto | null;
  activity: ReadonlyArray<ActivityItemDto>;
  hasUnread: boolean;
  markSeen: () => void;
  notifyRunStarted: () => void;
  refetch: () => void;
}>;

export const AppStatusContext = createContext<AppStatusValue | null>(null);

export const useAppStatus = (): AppStatusValue => {
  const value = useContext(AppStatusContext);
  if (value === null) {
    throw new Error('useAppStatus must be used within AppStatusProvider');
  }
  return value;
};
