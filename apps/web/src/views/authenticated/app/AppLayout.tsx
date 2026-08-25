import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@/store/context/theme.context';
import { AppBackground } from './AppBackground';
import AppSidebar from './app-sidebar/AppSidebar';
import BillingGate from './billing-gate/BillingGate';
import AppStatusProvider from './store/app-status.provider';

const AppLayout = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    return () => root.classList.remove('dark');
  }, [theme]);

  return (
    <AppStatusProvider>
      <div className="bg-app-bg relative flex h-screen overflow-hidden">
        <AppBackground />
        <div className="relative z-1 flex h-full w-full">
          <AppSidebar />
          <main className="flex min-w-0 flex-1 flex-col">
            <BillingGate>
              <Outlet />
            </BillingGate>
          </main>
        </div>
      </div>
    </AppStatusProvider>
  );
};

export default AppLayout;
