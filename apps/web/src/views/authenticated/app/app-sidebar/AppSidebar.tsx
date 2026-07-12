import { NavLink } from 'react-router-dom';
import {
  Ban,
  BarChart3,
  GraduationCap,
  History,
  LogOut,
  MessageSquare,
  Server,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/utils/lib/utils';
import { useAuth } from '@/store/context/auth.context';
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
  const name = state.user?.name ?? 'You';

  return (
    <aside className="bg-night-800/60 flex w-[236px] shrink-0 flex-col gap-1 border-r border-white/8 px-4 py-5 backdrop-blur-md">
      <div className="mb-5 flex items-center gap-2 px-3">
        <div className="bg-brand-600 flex size-7 items-center justify-center rounded-lg text-[13px] font-semibold text-white">
          S
        </div>
        <span className="text-glass-fg text-[15px] font-medium tracking-tighter">
          SweeLeads
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
                  ? 'bg-brand-600/[0.16] text-[#F3F2F8] font-medium'
                  : 'text-[#ABA8C0] hover:bg-white/5',
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
                <Icon size={17} className={isActive ? 'text-brand-400' : 'text-glass-dim'} />
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
        <div className="bg-brand-600/[0.22] text-brand-300 flex size-[30px] items-center justify-center rounded-full text-xs font-medium">
          {initialsFromName(name)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-glass-fg truncate text-[13px] tracking-tight">{name}</div>
          <div className="truncate text-[11px] text-[#6F6C85]">{state.user?.email}</div>
        </div>
        <button
          type="button"
          onClick={signOut}
          title="Sign out"
          className="flex p-1 text-[#6F6C85] transition-colors hover:text-white"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
