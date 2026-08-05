import { type AuthAction } from './authenticated.action';
import { type AuthState } from './authenticated.entities';

export const authReducer = (
  state: AuthState,
  action: AuthAction,
): AuthState => {
  switch (action.type) {
    case 'SESSION_LOADING':
      return { ...state, status: 'loading', user: null, onboarding: 'unknown' };
    case 'AUTHENTICATED':
      return {
        status: 'authenticated',
        user: action.user,
        onboarding: action.onboarding,
        isEmailVerificationRequired: action.isEmailVerificationRequired,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.user };
    case 'ONBOARDING_COMPLETED':
      return { ...state, onboarding: 'completed' };
    case 'UNAUTHENTICATED':
      return {
        ...state,
        status: 'unauthenticated',
        user: null,
        onboarding: 'unknown',
      };
  }
};
