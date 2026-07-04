import { type ReactNode, useEffect, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsyncEvent } from '@/hooks/useAsyncEvent';
import { getSessionAxios, getOnboardingStateAxios, signOutAxios } from '@/api/api';
import { authReducer } from '../authenticated/authenticated.reducer';
import { INITIAL_AUTH_STATE } from '../authenticated/authenticated.state';
import { type OnboardingStatusState } from '../authenticated/authenticated.entities';
import { authUserFromMe } from '../authenticated/authenticated.mapper';
import { AuthContext } from './auth.context';

type ResolvedSession = Readonly<{
  user: ReturnType<typeof authUserFromMe>;
  onboarding: OnboardingStatusState;
}>;

const AuthProvider = ({ children }: Readonly<{ children: ReactNode }>) => {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(authReducer, INITIAL_AUTH_STATE);

  // Résout la session complète : utilisateur (/me) + statut d'onboarding.
  const { onFetch: resolveSession } = useAsyncEvent<ResolvedSession, void>({
    onSuccess: ({ returnedData }) =>
      dispatch({
        type: 'AUTHENTICATED',
        user: returnedData.user,
        onboarding: returnedData.onboarding,
      }),
    onError: () => dispatch({ type: 'UNAUTHENTICATED' }),
    promise: async () => {
      const me = await getSessionAxios();
      let onboarding: OnboardingStatusState;
      try {
        onboarding = (await getOnboardingStateAxios()).status;
      } catch {
        onboarding = 'unknown';
      }
      return { user: authUserFromMe(me), onboarding };
    },
  });

  // Bootstrap au chargement de l'app.
  useEffect(() => {
    resolveSession();
  }, []);

  const refreshSession = () => {
    dispatch({ type: 'SESSION_LOADING' });
    resolveSession();
  };

  const { onFetch: fetchSignOut } = useAsyncEvent<void, void>({
    onSuccess: () => {
      dispatch({ type: 'UNAUTHENTICATED' });
      navigate('/sign-in');
    },
    onError: () => {
      // Même en cas d'échec réseau, on déconnecte localement.
      dispatch({ type: 'UNAUTHENTICATED' });
      navigate('/sign-in');
    },
    promise: () => signOutAxios(),
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
