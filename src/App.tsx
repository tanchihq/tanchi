import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedAuthenticatedRoute } from './routes/ProtectedAuthenticatedRoute';
import { ProtectedUnauthenticatedRoute } from './routes/ProtectedUnauthenticatedRoute';
import { RequireOnboarded } from './routes/RequireOnboarded';
import { AuthLanding } from './routes/AuthLanding';
import { useAuth } from '@/store/context/auth.context';
import { Button } from '@/components/ui/button';
import SignIn from './views/unauthenticated/sign-in/SignIn';
import SignUp from './views/unauthenticated/sign-up/SignUp';
import VerifyEmail from './views/authenticated/verify-email/VerifyEmail';
import Onboarding from './views/authenticated/onboarding/Onboarding';

// Placeholder for the authenticated app — replaced by the dashboard later.
const AppHome = () => {
  const { state, signOut } = useAuth();

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">SweeLeads</h1>
        <p className="text-muted-foreground text-sm">
          Signed in{state.user ? ` as ${state.user.name}` : ''}. Dashboard coming
          soon.
        </p>
      </div>
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </main>
  );
};

const App = () => (
  <Routes>
    <Route element={<ProtectedUnauthenticatedRoute />}>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
    </Route>

    <Route element={<ProtectedAuthenticatedRoute />}>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route element={<RequireOnboarded />}>
        <Route path="/app" element={<AppHome />} />
      </Route>
    </Route>

    <Route path="/" element={<AuthLanding />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes>
);

export default App;
