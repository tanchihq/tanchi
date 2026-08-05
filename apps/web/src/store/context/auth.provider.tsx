import { type ReactNode, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { identifyUser, resetAnalytics } from '@/analytics/posthog';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { getSessionAxios, getOnboardingStateAxios } from '@/api/api';
import { authClient } from '@/api/auth-client';
import { authReducer } from '../authenticated/authenticated.reducer';
import { INITIAL_AUTH_STATE } from '../authenticated/authenticated.state';
import { type OnboardingStatusState } from '../authenticated/authenticated.entities';
import { authUserFromMe } from '../authenticated/authenticated.mapper';
import { AuthContext } from './auth.context';

type ResolvedSession = Readonly<{
  user: ReturnType<typeof authUserFromMe>;
  onboarding: OnboardingStatusState;
  isEmailVerificationRequired: boolean;
}>;

const AuthProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);

  const { onFetch: resolveSession } = useAsyncEvent<ResolvedSession, void>({
    onSuccess: ({ returnedData }) => {
      identifyUser(returnedData.user);
      dispatch({
        type: 'AUTHENTICATED',
        user: returnedData.user,
        onboarding: returnedData.onboarding,
        isEmailVerificationRequired: returnedData.isEmailVerificationRequired,
      });
    },
    onError: () => dispatch({ type: 'UNAUTHENTICATED' }),
    promise: async () => {
      const me = await getSessionAxios();
      let onboarding: OnboardingStatusState;
      try {
        onboarding = (await getOnboardingStateAxios()).status;
      } catch {
        onboarding = 'unknown';
      }
      return {
        user: authUserFromMe(me),
        onboarding,
        isEmailVerificationRequired: me.requireEmailVerification,
      };
    },
  });

  useEffect(() => {
    resolveSession();
  }, []);

  const refreshSession = () => {
    dispatch({ type: 'SESSION_LOADING' });
    resolveSession();
  };

  const { onFetch: fetchSignOut } = useAsyncEvent<void, void>({
    onSuccess: () => {
      resetAnalytics();
      dispatch({ type: 'UNAUTHENTICATED' });
      navigate('/sign-in');
    },
    onError: () => {
      resetAnalytics();
      dispatch({ type: 'UNAUTHENTICATED' });
      navigate('/sign-in');
    },
    promise: async () => {
      await authClient.signOut();
    },
  });

  const value = useMemo(
    () => ({
      state,
      dispatch,
      refreshSession,
      signOut: () => fetchSignOut(),
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
