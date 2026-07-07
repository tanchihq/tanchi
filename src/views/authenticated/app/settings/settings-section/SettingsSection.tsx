import { type ReactNode } from 'react';

type SettingsSectionProps = Readonly<{ title: string; children: ReactNode }>;

const SettingsSection = ({ title, children }: SettingsSectionProps) => (
  <div className="rounded-[18px] border border-white/[0.07] bg-[#171733] p-[22px_24px]">
    <div className="mb-4 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">{title}</div>
    {children}
  </div>
);

export default SettingsSection;
