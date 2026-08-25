import { NavLink } from 'react-router-dom';
import {
  Ban,
  BarChart3,
  GraduationCap,
  History,
  LogOut,
  MessageSquare,
  Moon,
  Server,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/lib/utils';
import { useAuth } from '@/store/context/auth.context';
import { useTheme } from '@/store/context/theme.context';
import EnginePreparationCard from './engine-preparation-card/EnginePreparationCard';

type NavEntry = Readonly<{ to: string; label: string; icon: LucideIcon; end?: boolean }>;

const NAV: ReadonlyArray<NavEntry> = [
  { to: '/app', label: 'Pipeline', icon: BarChart3, end: true },
  { to: '/app/chat', label: 'Copilot', icon: MessageSquare },
  { to: '/app/messages', label: 'Messages', icon: History },
  { to: '/app/learnings', label: 'Learnings', icon: GraduationCap },
  { to: '/app/exclusions', label: 'Exclusions', icon: Ban },
  { to: '/app/mailbox', label: 'Mailbox', icon: Server },
  { to: '/app/settings', label: 'Settings', icon: Settings },
];

const initialsFromName = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const AppSidebar = () => {
  const { state, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const name = state.user?.name ?? 'You';
  const isDark = theme === 'dark';

  return (
    <aside className="bg-app-surface/60 border-app-line flex w-[236px] shrink-0 flex-col gap-1 border-r px-4 py-5 backdrop-blur-md">
      <div className="mb-5 flex items-center gap-2.5 px-3">
        <svg
          width="24"
          height="24"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="text-app-fg"
        >
          <circle cx="60" cy="60" r="46" stroke="currentColor" strokeWidth="6" />
          <circle
            cx="60"
            cy="60"
            r="28"
            stroke="currentColor"
            strokeWidth="5"
            strokeOpacity="0.6"
          />
          <circle cx="60" cy="60" r="10" fill="currentColor" />
        </svg>
        <span className="text-app-fg text-[15px] font-semibold tracking-[-0.04em]">
          tanchi
        </span>
      </div>

      <nav className="flex flex-col gap-0.5">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'relative flex h-10 items-center gap-3 rounded-[9px] px-3 text-sm tracking-tight transition-colors',
                isActive
                  ? 'bg-app-accent-bg text-app-fg font-medium'
                  : 'text-app-soft hover:bg-app-hover',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={cn(
                    'absolute left-0 top-2.5 bottom-2.5 w-[2.5px] rounded-full',
                    isActive ? 'bg-brand-400' : 'bg-transparent',
                  )}
                />
                <Icon size={17} className={isActive ? 'text-brand-400' : 'text-app-faint'} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto">
        <EnginePreparationCard />
      </div>

      <div className="mt-3.5 flex items-center gap-2.5 px-1 py-1.5">
        <div className="bg-app-accent-bg text-app-accent-fg flex size-[30px] items-center justify-center rounded-full text-xs font-medium">
          {initialsFromName(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-app-fg truncate text-[13px] tracking-tight">{name}</div>
          <div className="text-app-faint truncate text-[11px]">{state.user?.email}</div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          title={isDark ? 'Switch to light' : 'Switch to dark'}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="text-app-faint hover:text-app-fg flex p-1 transition-colors"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          className="text-app-faint hover:text-app-fg flex p-1 transition-colors"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
