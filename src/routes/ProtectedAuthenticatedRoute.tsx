import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';
import { FullPageLoader } from '@/components/FullPageLoader';

// Garde des vues authentifiées : redirige vers /sign-in si pas de session.
const ProtectedAuthenticatedRoute = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <FullPageLoader />;
  if (state.status === 'unauthenticated') {
    return <Navigate replace to="/sign-in" />;
  }
  return <Outlet />;
};

export { ProtectedAuthenticatedRoute };
