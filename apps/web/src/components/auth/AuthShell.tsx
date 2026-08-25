import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AuthBackground } from './AuthBackground';

type AuthShellProps = Readonly<{
  glyph: ReactNode;
  title: string;
  subtitle: string;
  footerText: string;
  footerLinkLabel: string;
  footerTo: string;
  onFooterClick?: () => void;
  children: ReactNode;
}>;

const AuthShell = ({
  glyph,
  title,
  subtitle,
  footerText,
  footerLinkLabel,
  footerTo,
  onFooterClick,
  children,
}: AuthShellProps) => (
  <div className="dark bg-night-900 relative min-h-screen w-full overflow-hidden">
    <AuthBackground />

    <div className="relative z-1 flex min-h-screen items-center justify-center px-5 py-10">
      <div
        className="w-full max-w-[424px]"
        style={{ animation: 'sl-card-in 0.6s cubic-bezier(0.22,1,0.36,1) both' }}
      >
        <div className="glass-card relative overflow-hidden px-9 pt-[42px] pb-[30px]">
          <div className="glass-hairline" />

          <div className="relative mb-[26px] flex flex-col items-center gap-[22px]">
            <div
              className="flex size-[42px] items-center justify-center rounded-xl bg-white"
              style={{
                boxShadow:
                  '0 6px 14px -8px rgba(15,15,35,0.5), inset 0 1px 1px rgba(255,255,255,0.9)',
              }}
            >
              {glyph}
            </div>
            <div className="text-center">
              <div className="text-glass-fg mb-1.5 text-[25px] font-semibold tracking-tighter">
                {title}
              </div>
              <div className="mx-auto max-w-[300px] text-sm leading-[1.45] text-[#A7ACB8]">
                {subtitle}
              </div>
            </div>
          </div>

          {children}

          <div className="text-ink-soft mt-[22px] text-center text-[13px]">
            {footerText}{' '}
            {onFooterClick === undefined ? (
              <Link to={footerTo} className="text-brand-600 no-underline">
                {footerLinkLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onFooterClick}
                className="text-brand-600 cursor-pointer"
              >
                {footerLinkLabel}
              </button>
            )}
          </div>
        </div>

        <div className="text-ink-faint mt-5 text-center text-xs tracking-tight">
          Tanchi · autonomous prospecting
        </div>
      </div>
    </div>
  </div>
);

export { AuthShell };
