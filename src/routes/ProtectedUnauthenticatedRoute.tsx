import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';
import { FullPageLoader } from '@/components/FullPageLoader';

const ProtectedUnauthenticatedRoute = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <FullPageLoader />;
  if (state.status === 'authenticated') {
    return <Navigate replace to="/app" />;
  }
  return <Outlet />;
};

export { ProtectedUnauthenticatedRoute };
