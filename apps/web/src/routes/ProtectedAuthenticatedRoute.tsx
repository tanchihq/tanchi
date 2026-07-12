import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';
import { FullPageLoader } from '@/components/FullPageLoader';

const ProtectedAuthenticatedRoute = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <FullPageLoader />;
  if (state.status === 'unauthenticated') {
    return <Navigate replace to="/sign-in" />;
  }
  return <Outlet />;
};

export { ProtectedAuthenticatedRoute };
