import { ExternalLink, Radar } from 'lucide-react';
import { type ProspectFactDto } from '@/api/prospects/entities/response.entities';
import { type QueueAngleDto } from '@/api/queue/entities/response.entities';
import { hostOf } from './utils';

type Properties = Readonly<{
  angle: QueueAngleDto | null;
  fallbackFact: ProspectFactDto | null;
}>;

const WhyNow = ({ angle, fallbackFact }: Properties) => {
  const fact = angle?.fact ?? fallbackFact;
  if (angle === null && fact === null) return null;

  return (
    <div className="border-app-accent-line bg-app-accent-bg rounded-xl border p-[12px_14px]">
      <div className="text-app-accent-fg mb-1.5 flex items-center gap-1.5 text-[11px] tracking-[0.06em] uppercase">
        <Radar size={12} /> Why now
      </div>
      {angle !== null && (
        <div className="text-app-fg text-[13.5px] leading-snug font-medium">
          {angle.title}
        </div>
      )}
      {angle !== null && angle.note !== null && angle.note !== '' && (
        <div className="text-app-soft mt-0.5 text-[12.5px] leading-snug">
          {angle.note}
        </div>
      )}
      {fact !== null && (
        <a
          href={fact.sourceUrl}
          target="_blank"
          rel="noreferrer"
          data-no-swipe
          className="text-app-soft hover:text-app-fg mt-2 flex items-start gap-1.5 text-[12.5px] leading-snug transition-colors"
        >
          <span className="min-w-0 flex-1">
            “{fact.text}”{' '}
            <span className="text-app-faint">· {hostOf(fact.sourceUrl)}</span>
          </span>
          <ExternalLink size={12} className="text-app-faint mt-0.5 shrink-0" />
        </a>
      )}
    </div>
  );
};

export default WhyNow;
