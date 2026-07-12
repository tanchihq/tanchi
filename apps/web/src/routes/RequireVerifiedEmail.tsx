import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';

const RequireVerifiedEmail = () => {
  const { state } = useAuth();

  if (state.user !== null && !state.user.emailVerified) {
    return <Navigate replace to="/verify-email" />;
  }
  return <Outlet />;
};

export { RequireVerifiedEmail };
