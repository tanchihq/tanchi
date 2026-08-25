import { Check, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ChannelIcon, LinkedinGlyph } from '@/components/ChannelIcon';
import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';
import { CHANNEL_META, STAGE_LABEL } from '@/utils/prospect-display';
import { fullName, initialsOf } from '@/utils/format';
import { cn } from '@/utils/lib/utils';
import { identityLine } from '../utils';
import { channelBadgeAction } from './utils';

type LeadSummaryProps = Readonly<{ lead: LeadDetailDto }>;

const LeadSummary = ({ lead }: LeadSummaryProps) => {
  const channel = CHANNEL_META[lead.channel];
  const isEmail = lead.channel === 'email';
  const badgeAction = channelBadgeAction(lead);
  const badgeBaseClass =
    'flex h-[30px] items-center gap-1.5 rounded-lg border border-app-line bg-app-hover px-3';
  const badgeInner = (
    <>
      <ChannelIcon channel={lead.channel} size={14} style={{ color: channel.color }} />
      <span className="text-[13px] font-medium text-app-fg">{channel.label}</span>
    </>
  );

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="rounded-2xl border border-app-line bg-app-surface p-[20px_22px]">
        <div className="flex items-start gap-3.5">
          <div className="bg-app-accent-bg text-app-accent-fg flex size-[46px] items-center justify-center rounded-[13px] text-[15px] font-medium">
            {initialsOf(lead.firstName, lead.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-medium tracking-tighter text-app-fg">
              {fullName(lead.firstName, lead.lastName)}
            </div>
            <div className="mt-0.5 text-[13px] text-app-soft">
              {lead.role ? `${lead.role} · ` : ''}
              {lead.company.name}
            </div>
            {identityLine(lead) && (
              <div className="mt-1 text-xs leading-snug text-app-faint">{identityLine(lead)}</div>
            )}
          </div>
        </div>
        <div className="mt-[15px] flex flex-wrap items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              {badgeAction.href !== null ? (
                <a
                  href={badgeAction.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    badgeBaseClass,
                    'cursor-pointer no-underline transition-colors hover:bg-app-hover',
                  )}
                >
                  {badgeInner}
                </a>
              ) : (
                <span className={badgeBaseClass}>{badgeInner}</span>
              )}
            </TooltipTrigger>
            <TooltipContent>{badgeAction.tooltip}</TooltipContent>
          </Tooltip>
          <span
            className="flex h-[30px] items-center rounded-lg px-[11px] text-xs font-medium"
            style={{
              background: isEmail ? 'var(--app-accent-bg)' : 'var(--app-warn-bg)',
              color: isEmail ? 'var(--app-accent-fg)' : 'var(--app-warn-fg)',
            }}
          >
            {isEmail ? 'auto send' : 'manual send'}
          </span>
          {lead.hot && (
            <Badge>
              <span className="bg-brand-400 size-1.5 rounded-full" /> hot signal
            </Badge>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {lead.siteUrl && (
            <a
              href={lead.siteUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-md border border-app-line bg-app-hover px-2 py-1 text-xs text-app-soft no-underline"
            >
              <Globe size={13} /> Website
            </a>
          )}
          {lead.linkedinUrl && (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-md border border-app-line bg-app-hover px-2 py-1 text-xs text-app-soft no-underline"
            >
              <LinkedinGlyph size={13} /> LinkedIn
            </a>
          )}
          <span className="whitespace-nowrap rounded-md border border-app-line bg-app-hover px-2 py-1 text-xs text-app-faint">
            {lead.icp}
          </span>
          <span className="ml-auto whitespace-nowrap text-[11.5px] text-app-faint">
            {STAGE_LABEL[lead.stage]}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-app-line bg-app-surface p-[20px_22px]">
        <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-app-faint">
          Intelligence
        </div>
        {lead.facts.length > 0 ? (
          <>
            <div className="mb-3.5 flex flex-col gap-2">
              {lead.facts.map((fact) => (
                <div key={fact.text} className="flex items-start justify-between gap-3">
                  <span className="text-[13px] text-app-fg">{fact.text}</span>
                  {fact.sourceUrl && (
                    <a
                      href={fact.sourceUrl}
                      target="_blank"
                      rel="noopener"
                      className="text-brand-400 shrink-0 text-xs no-underline"
                    >
                      source
                    </a>
                  )}
                </div>
              ))}
            </div>
            <div className="text-app-success-fg flex items-center gap-1.5 text-[13px]">
              <Check size={15} /> {lead.sourcesCount} verified sources
            </div>
          </>
        ) : (
          <div className="text-[13px] text-app-faint">No intelligence gathered yet.</div>
        )}
      </div>

      {lead.angles.length > 0 && (
        <div className="rounded-2xl border border-app-line bg-app-surface p-[20px_22px]">
          <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-app-faint">
            Candidate angles
          </div>
          <div className="flex flex-col gap-2">
            {lead.angles.map((angle) => (
              <div
                key={angle.rank}
                className="flex items-center gap-3 rounded-[10px] border px-[13px] py-[11px]"
                style={{
                  background: angle.chosen ? 'var(--app-accent-bg)' : 'var(--app-hover)',
                  borderColor: angle.chosen ? 'var(--app-accent-line)' : 'var(--app-line)',
                }}
              >
                <span className="w-3.5 text-xs" style={{ color: angle.chosen ? 'var(--app-accent-fg)' : 'var(--app-faint)' }}>
                  {angle.rank}
                </span>
                <div className="flex-1">
                  <div className="text-[13.5px]" style={{ color: angle.chosen ? 'var(--app-fg)' : 'var(--app-soft)' }}>
                    {angle.title}
                  </div>
                  <div className="mt-px text-xs text-app-faint">{angle.note}</div>
                </div>
                {angle.chosen && <Badge>chosen</Badge>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadSummary;
