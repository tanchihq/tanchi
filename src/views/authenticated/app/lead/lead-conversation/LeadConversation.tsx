import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SelectNative } from '@/components/ui/select-native';
import { ChannelIcon } from '@/components/ChannelIcon';
import { type Stage } from '@/api/shared/enums';
import { type LeadDetailDto } from '@/api/prospects/entities/response.entities';
import { type SenderDto } from '@/api/senders/entities/response.entities';
import { CHANNEL_META } from '@/utils/prospect-display';
import { timelineDotColor } from '@/utils/format';
import { CLOSED_COPY, isClosedStage, timeAgo } from '../utils';

type LeadConversationProps = Readonly<{
  lead: LeadDetailDto;
  senders: ReadonlyArray<SenderDto>;
  sending: boolean;
  onSend: (editedMessage: string | null, senderId: string | undefined) => void;
  onQualify: (stage: Stage) => void;
}>;

const isPendingDraft = (lead: LeadDetailDto): boolean =>
  lead.message !== null &&
  (lead.message.status === 'draft' || lead.message.status === 'edited');

const isWaiting = (lead: LeadDetailDto): boolean =>
  (lead.stage === 'contacted' || lead.stage === 'following-up') &&
  !isPendingDraft(lead);

const LeadConversation = ({
  lead,
  senders,
  sending,
  onSend,
  onQualify,
}: LeadConversationProps) => {
  const channel = CHANNEL_META[lead.channel];
  const isEmail = lead.channel === 'email';
  const closed = CLOSED_COPY[lead.stage];
  const multipleSenders = senders.length > 1;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(lead.message?.body ?? '');
  const [senderId, setSenderId] = useState(senders[0]?.id ?? '');

  const chosenSenderId = multipleSenders ? senderId : undefined;

  const send = () => {
    const edited =
      lead.message !== null && draft !== lead.message.body ? draft : null;
    onSend(edited, chosenSenderId);
    setEditing(false);
  };

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="rounded-2xl border border-white/[0.07] bg-[#171733] p-[20px_22px]">
        <div className="mb-3.5 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
          Conversation
        </div>

        {lead.timeline.length > 0 && (
          <div className="mb-1.5 flex flex-col">
            {lead.timeline.map((event, index) => (
              <div key={index} className="flex gap-3 pb-3.5">
                <div className="flex flex-col items-center pt-[3px]">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: timelineDotColor(event.kind) }}
                  />
                  <span className="mt-[3px] w-px flex-1 bg-white/8" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] text-[#F3F2F8]">
                    {event.title}
                  </div>
                  <div className="mt-px text-xs text-[#6F6C85]">
                    {timeAgo(event.at)}
                  </div>
                </div>
                <span className="h-fit rounded-md border border-white/8 px-[7px] py-0.5 text-[10.5px] text-[#6F6C85]">
                  {event.origin === 'auto' ? 'auto' : 'you'}
                </span>
              </div>
            ))}
          </div>
        )}

        {isPendingDraft(lead) && lead.message && (
          <>
            <div className="my-[6px] mb-2.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.06em] text-[#6F6C85]">
                <ChannelIcon channel={lead.channel} size={13} /> Proposed
                message
              </span>
              {lead.message.subject && (
                <span className="text-xs text-[#6F6C85]">
                  {lead.message.subject}
                </span>
              )}
            </div>
            {editing ? (
              <textarea
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                className="min-h-[168px] w-full resize-y rounded-xl border border-brand-600 bg-[#0E0E22] p-[15px_16px] text-sm leading-relaxed text-[#E7E6F0] outline-none"
                style={{ boxShadow: '0 0 0 3px rgba(5,1,240,0.16)' }}
              />
            ) : (
              <div
                onClick={() => setEditing(true)}
                className="cursor-text whitespace-pre-wrap rounded-xl border border-white/8 bg-[#0E0E22] p-[15px_16px] text-sm leading-relaxed text-[#E7E6F0]"
              >
                {draft}
              </div>
            )}
            {multipleSenders && isEmail && (
              <div className="mt-3">
                <SelectNative
                  value={senderId}
                  onChange={(event) => setSenderId(event.target.value)}
                >
                  {senders.map((sender) => (
                    <option key={sender.id} value={sender.id}>
                      Send from {sender.fromEmail}
                    </option>
                  ))}
                </SelectNative>
              </div>
            )}
            <div className="mt-4 flex items-center gap-2.5">
              <Button className="h-[42px]" isLoading={sending} onClick={send}>
                {!sending && <Check size={16} />}
                {isEmail ? 'Validate & send' : 'Validate draft'}
              </Button>
              <Button
                variant="outline"
                className="h-[42px]"
                onClick={() => setEditing((value) => !value)}
              >
                {editing ? 'Done' : 'Edit'}
              </Button>
            </div>
            <div className="mt-2.5 text-xs text-[#6F6C85]">
              {isEmail
                ? 'Sent automatically on validation'
                : `to send manually from ${channel.label}`}
            </div>
          </>
        )}

        {lead.stage === 'identified' && lead.message === null && (
          <div className="text-[13.5px] leading-relaxed text-[#ABA8C0]">
            Dossier ready. The agent is preparing a message.
          </div>
        )}

        {isWaiting(lead) && (
          <div className="text-[13.5px] leading-relaxed text-[#ABA8C0]">
            Message sent. Waiting for a reply — the agent will draft a follow-up
            if none comes.
          </div>
        )}

        {lead.stage === 'replied' && (
          <>
            {lead.reply && (
              <div className="border-success mb-4 rounded-[10px] border border-white/8 border-l-2 bg-white/[0.03] p-[13px_15px] text-[13.5px] leading-relaxed text-[#D9D7E4]">
                {lead.reply}
              </div>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onQualify('meeting')}
                className="text-brand-300 border-brand-400/40 bg-brand-600/20 h-10 flex-1 cursor-pointer rounded-[9px] border text-[13px] font-medium"
              >
                positive
              </button>
              <button
                type="button"
                onClick={() => onQualify('not-interested')}
                className="h-10 flex-1 cursor-pointer rounded-[9px] border border-white/8 bg-white/[0.04] text-[13px] text-[#ABA8C0]"
              >
                negative
              </button>
              <button
                type="button"
                onClick={() => onQualify('snoozed')}
                className="h-10 flex-1 cursor-pointer rounded-[9px] border border-white/8 bg-white/[0.04] text-[13px] text-[#ABA8C0]"
              >
                later
              </button>
            </div>
          </>
        )}

        {isClosedStage(lead) && closed && (
          <>
            <div className="mb-1.5 text-[15px] font-medium text-[#F3F2F8]">
              {closed.title}
            </div>
            <div className="text-[13.5px] leading-relaxed text-[#ABA8C0]">
              {closed.note}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LeadConversation;
