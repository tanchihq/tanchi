import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedAuthenticatedRoute } from './routes/ProtectedAuthenticatedRoute';
import { ProtectedUnauthenticatedRoute } from './routes/ProtectedUnauthenticatedRoute';
import { RequireVerifiedEmail } from './routes/RequireVerifiedEmail';
import { RequireOnboarded } from './routes/RequireOnboarded';
import { AuthLanding } from './routes/AuthLanding';
import SignIn from './views/unauthenticated/sign-in/SignIn';
import SignUp from './views/unauthenticated/sign-up/SignUp';
import ForgotPassword from './views/unauthenticated/forgot-password/ForgotPassword';
import ResetPassword from './views/unauthenticated/reset-password/ResetPassword';
import VerifyEmail from './views/unauthenticated/verify-email/VerifyEmail';
import Onboarding from './views/authenticated/onboarding/Onboarding';
import AppLayout from './views/authenticated/app/AppLayout';
import Pipeline from './views/authenticated/app/pipeline';
import Messages from './views/authenticated/app/messages';
import Learnings from './views/authenticated/app/learnings';
import Suppression from './views/authenticated/app/suppression';
import Mailbox from './views/authenticated/app/mailbox';
import Settings from './views/authenticated/app/settings';
import LeadPanel from './views/authenticated/app/lead';

const App = () => (
  <Routes>
    <Route element={<ProtectedUnauthenticatedRoute />}>
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
    </Route>

    <Route path="/verify-email" element={<VerifyEmail />} />

    <Route element={<ProtectedAuthenticatedRoute />}>
      <Route element={<RequireVerifiedEmail />}>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<RequireOnboarded />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Pipeline />} />
            <Route path="messages" element={<Messages />} />
            <Route path="learnings" element={<Learnings />} />
            <Route path="suppression" element={<Suppression />} />
            <Route path="mailbox" element={<Mailbox />} />
            <Route path="settings" element={<Settings />} />
            <Route path="lead/:id" element={<LeadPanel />} />
          </Route>
        </Route>
      </Route>
    </Route>

    <Route path="/" element={<AuthLanding />} />
    <Route path="*" element={<Navigate replace to="/" />} />
  </Routes>
);

export default App;
