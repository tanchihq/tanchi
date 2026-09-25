import { History } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { type QueuePreviousMessageDto } from '@/api/queue/entities/response.entities';
import { relativeTime } from '@/utils/format';

type Properties = Readonly<{
  message: QueuePreviousMessageDto;
  followUpNumber: number;
}>;

const PreviousMessage = ({ message, followUpNumber }: Properties) => (
  <Accordion type="single" collapsible data-no-swipe>
    <AccordionItem
      value="previous"
      className="border-app-line rounded-xl border px-3 last:border-b"
    >
      <AccordionTrigger className="py-2.5 hover:no-underline">
        <span className="flex min-w-0 flex-1 items-center gap-1.5 text-[12.5px] font-normal">
          <History size={13} className="text-app-faint shrink-0" />
          <span className="text-app-soft">
            {followUpNumber > 1 ? 'Last message' : 'First message'}
          </span>
          <span className="text-app-faint truncate">
            {message.sentAt === null
              ? ''
              : `· sent ${relativeTime(message.sentAt)} · no reply`}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent className="pb-3">
        {message.subject !== null && message.subject !== '' && (
          <div className="text-app-soft mb-2 text-[12.5px]">
            <span className="text-app-faint">Subject: </span>
            {message.subject}
          </div>
        )}
        <div className="bg-app-well border-app-line text-app-soft max-h-[180px] overflow-y-auto rounded-lg border p-[12px_14px] text-[13px] leading-relaxed whitespace-pre-wrap">
          {message.body}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default PreviousMessage;
