import { type ReactNode } from 'react';

type SettingsSectionProps = Readonly<{ title: string; children: ReactNode }>;

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <div className="rounded-[18px] border border-app-line bg-app-surface p-[22px_24px]">
    <div className="mb-4 text-[11px] uppercase tracking-[0.06em] text-app-faint">{title}</div>
    {children}
  </div>
);

export default SettingsSection;
