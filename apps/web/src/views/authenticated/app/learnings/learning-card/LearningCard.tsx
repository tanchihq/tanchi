import { type LearningDto } from '@/api/learnings';

type LearningCardProps = Readonly<{ learning: LearningDto }>;

const LearningCard = ({ learning }: LearningCardProps) => (
  <div className="rounded-2xl border border-app-line bg-app-surface p-[20px_22px]">
    <div className="mb-1 text-[11px] uppercase tracking-[0.06em] text-app-faint">
      {learning.icp}
    </div>
    <div className="mb-3.5 text-[15px] font-medium tracking-tighter text-app-fg">
      What works right now
    </div>
    {learning.points.length > 0 ? (
      <div className="flex flex-col gap-2.5">
        {learning.points.map((point) => (
          <div
            key={point}
            className="flex items-start gap-2.5 text-[13px] leading-snug text-app-soft"
          >
            <span className="bg-brand-400 mt-[7px] size-[5px] shrink-0 rounded-full" />
            {point}
          </div>
        ))}
      </div>
    ) : (
      <div className="text-[13px] text-app-faint">Not enough signal yet on this ICP.</div>
    )}
    {learning.stat && (
      <div className="mt-4 border-t border-app-line pt-3.5 text-xs text-app-faint">
        {learning.stat}
      </div>
    )}
  </div>
);

export default LearningCard;
