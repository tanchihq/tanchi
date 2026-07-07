import { Navigate } from 'react-router-dom';
import { useAuth } from '@/store/context/auth.context';
import { FullPageLoader } from '@/components/FullPageLoader';

const AuthLanding = () => {
  const { state } = useAuth();

  if (state.status === 'loading') return <FullPageLoader />;
  if (state.status === 'unauthenticated') {
    return <Navigate replace to="/sign-in" />;
  }
  if (state.onboarding === 'completed') {
    return <Navigate replace to="/app" />;
  }
  return <Navigate replace to="/onboarding" />;
};

export { AuthLanding };
