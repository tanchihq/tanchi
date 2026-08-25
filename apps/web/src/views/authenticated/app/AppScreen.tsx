import { type ReactNode } from 'react';
import AgentStatus from './agent-status/AgentStatus';

const AppScreen = ({
  title,
  children,
}: Readonly<{ title: string; children: ReactNode }>) => (
  <>
    <header className="bg-app-raised/55 relative z-30 flex h-[60px] shrink-0 items-center justify-between border-b border-app-line px-[26px] backdrop-blur-[22px]">
      <span className="text-[18px] font-medium tracking-tighter text-app-fg">
        {title}
      </span>
      <AgentStatus />
    </header>
    <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
  </>
);

export { AppScreen };
