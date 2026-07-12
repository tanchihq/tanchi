import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';

const RequireOnboarded = () => {
  const { state } = useAuth();

  if (state.onboarding !== 'completed') {
    return <Navigate replace to="/onboarding" />;
  }
  return <Outlet />;
};

export { RequireOnboarded };
