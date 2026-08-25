import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ChannelIcon } from '@/components/ChannelIcon';
import { type LeadHistoryEntryDto } from '@/api/prospects/entities/response.entities';
import { timeAgo } from '../../utils';
import {
  entryLabel,
  historyEntryKey,
  lastSentKey,
  previewOf,
  withoutLastReply,
} from './utils';

type LeadHistoryProps = Readonly<{
  entries: ReadonlyArray<LeadHistoryEntryDto>;
  contactName: string;
  hideLastReply: boolean;
}>;

const LeadHistory = ({
  entries,
  contactName,
  hideLastReply,
}: LeadHistoryProps) => {
  const shown = hideLastReply ? withoutLastReply(entries) : entries;
  if (shown.length === 0) return null;

  const openByDefault = lastSentKey(shown);

  return (
    <div className="mb-4">
      <div className="text-app-faint mb-1 text-[11px] tracking-[0.06em] uppercase">
        History · {shown.length}
      </div>
      <Accordion
        type="multiple"
        defaultValue={openByDefault === null ? [] : [openByDefault]}
        className="border-app-line divide-app-line divide-y rounded-xl border"
      >
        {shown.map((entry, index) => (
          <AccordionItem
            key={historyEntryKey(entry, index)}
            value={historyEntryKey(entry, index)}
            className="border-b-0 px-3"
          >
            <AccordionTrigger className="py-2.5 hover:no-underline">
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex items-center gap-1.5">
                  {entry.kind === 'sent' && entry.channel !== null && (
                    <ChannelIcon channel={entry.channel} size={12} />
                  )}
                  <span
                    className={
                      entry.kind === 'sent'
                        ? 'text-app-fg text-[13px] font-medium'
                        : 'text-app-success-fg text-[13px] font-medium'
                    }
                  >
                    {entryLabel(entry, contactName)}
                  </span>
                  <span className="text-app-faint text-[11px] font-normal">
                    {timeAgo(entry.at)}
                  </span>
                </span>
                <span className="text-app-faint truncate text-[12px] font-normal group-data-[state=open]:hidden">
                  {entry.subject ?? previewOf(entry.body)}
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent className="pb-3">
              {entry.subject !== null && entry.subject !== '' && (
                <div className="text-app-soft mb-2 text-[12.5px]">
                  <span className="text-app-faint">Subject: </span>
                  {entry.subject}
                </div>
              )}
              <div className="bg-app-well border-app-line text-app-soft rounded-lg border p-[12px_14px] text-[13px] leading-relaxed whitespace-pre-wrap">
                {entry.body}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default LeadHistory;
