import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { initAnalytics } from '@/analytics/posthog';
import { Toaster } from '@/components/ui/sonner';
import AuthProvider from '@/store/context/auth.provider';
import ThemeProvider from '@/store/context/theme.provider';
import App from './App.tsx';
import './index.css';

initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
