import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';

// Garde des vues de l'app : force l'onboarding tant qu'il n'est pas terminé.
// À placer sous ProtectedAuthenticatedRoute (session déjà résolue).
const RequireOnboarded = () => {
  const { state } = useAuth();

  if (state.onboarding !== 'completed') {
    return <Navigate replace to="/onboarding" />;
  }
  return <Outlet />;
};

export { RequireOnboarded };
