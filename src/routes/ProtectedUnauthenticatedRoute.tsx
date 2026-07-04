import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';
import { FullPageLoader } from '@/components/FullPageLoader';

// Garde des vues publiques d'auth : renvoie vers l'app si déjà connecté.
const ProtectedUnauthenticatedRoute = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <FullPageLoader />;
  if (state.status === 'authenticated') {
    return <Navigate replace to="/app" />;
  }
  return <Outlet />;
};

export { ProtectedUnauthenticatedRoute };
