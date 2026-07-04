import { createContext, useContext, type Dispatch } from 'react';
import { type AuthAction } from '../authenticated/authenticated.action';
import { type AuthState } from '../authenticated/authenticated.entities';
import { INITIAL_AUTH_STATE } from '../authenticated/authenticated.state';

export type AuthContextValue = Readonly<{
  state: AuthState;
  dispatch: Dispatch<AuthAction>;
  refreshSession: () => void;
  signOut: () => void;
}>;

export const AuthContext = createContext<AuthContextValue>({
  state: INITIAL_AUTH_STATE,
  dispatch: () => {},
  refreshSession: () => {},
  signOut: () => {},
});

export const useAuth = () => useContext(AuthContext);
