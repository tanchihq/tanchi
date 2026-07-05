import { Check, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ChannelIcon, LinkedinGlyph } from '@/components/ChannelIcon';
import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';
import { CHANNEL_META, STAGE_LABEL } from '@/utils/prospect-display';
import { fullName, initialsOf } from '@/utils/format';
import { identityLine } from '../utils';

type LeadSummaryProps = Readonly<{ lead: LeadDetailDto }>;

const LeadSummary = ({ lead }: LeadSummaryProps) => {
  const channel = CHANNEL_META[lead.channel];
  const isEmail = lead.channel === 'email';

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#171733] p-[20px_22px]">
        <div className="flex items-start gap-3.5">
          <div className="bg-brand-600/20 text-brand-300 flex size-[46px] items-center justify-center rounded-[13px] text-[15px] font-medium">
            {initialsOf(lead.firstName, lead.lastName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[19px] font-medium tracking-tighter text-[#F3F2F8]">
              {fullName(lead.firstName, lead.lastName)}
            </div>
            <div className="mt-0.5 text-[13px] text-[#ABA8C0]">
              {lead.role ? `${lead.role} · ` : ''}
              {lead.company.name}
            </div>
            {identityLine(lead) && (
              <div className="mt-1 text-xs leading-snug text-[#6F6C85]">{identityLine(lead)}</div>
            )}
          </div>
        </div>
        <div className="mt-[15px] flex flex-wrap items-center gap-2">
          <span className="flex h-[30px] items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 px-3">
            <ChannelIcon channel={lead.channel} size={14} style={{ color: channel.color }} />
            <span className="text-[13px] font-medium text-[#F3F2F8]">{channel.label}</span>
          </span>
          <span
            className="flex h-[30px] items-center rounded-lg px-[11px] text-xs font-medium"
            style={{
              background: isEmail ? 'rgba(5,1,240,0.18)' : 'rgba(251,191,119,0.14)',
              color: isEmail ? '#A9A6FF' : '#FBBF77',
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
              className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-[#ABA8C0] no-underline"
            >
              <Globe size={13} /> Website
            </a>
          )}
          {lead.linkedinUrl && (
            <a
              href={lead.linkedinUrl}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-[#ABA8C0] no-underline"
            >
              <LinkedinGlyph size={13} /> LinkedIn
            </a>
          )}
          <span className="whitespace-nowrap rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-xs text-[#6F6C85]">
            {lead.icp}
          </span>
          <span className="ml-auto whitespace-nowrap text-[11.5px] text-[#6F6C85]">
            {STAGE_LABEL[lead.stage]}
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/[0.07] bg-[#171733] p-[20px_22px]">
        <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
          Intelligence
        </div>
        {lead.facts.length > 0 ? (
          <>
            <div className="mb-3.5 flex flex-col gap-2">
              {lead.facts.map((fact) => (
                <div key={fact.text} className="flex items-start justify-between gap-3">
                  <span className="text-[13px] text-[#F3F2F8]">{fact.text}</span>
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
            <div className="text-success flex items-center gap-1.5 text-[13px]">
              <Check size={15} /> {lead.sourcesCount} verified sources
            </div>
          </>
        ) : (
          <div className="text-[13px] text-[#6F6C85]">No intelligence gathered yet.</div>
        )}
      </div>

      {lead.angles.length > 0 && (
        <div className="rounded-2xl border border-white/[0.07] bg-[#171733] p-[20px_22px]">
          <div className="mb-3 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
            Candidate angles
          </div>
          <div className="flex flex-col gap-2">
            {lead.angles.map((angle) => (
              <div
                key={angle.rank}
                className="flex items-center gap-3 rounded-[10px] border px-[13px] py-[11px]"
                style={{
                  background: angle.chosen ? 'rgba(5,1,240,0.16)' : 'rgba(255,255,255,0.03)',
                  borderColor: angle.chosen ? 'rgba(124,121,246,0.4)' : 'rgba(255,255,255,0.07)',
                }}
              >
                <span className="w-3.5 text-xs" style={{ color: angle.chosen ? '#7c79f6' : '#6f6c85' }}>
                  {angle.rank}
                </span>
                <div className="flex-1">
                  <div className="text-[13.5px]" style={{ color: angle.chosen ? '#F3F2F8' : '#ABA8C0' }}>
                    {angle.title}
                  </div>
                  <div className="mt-px text-xs text-[#6F6C85]">{angle.note}</div>
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
