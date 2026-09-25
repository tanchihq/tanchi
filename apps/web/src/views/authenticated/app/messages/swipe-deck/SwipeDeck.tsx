import { Check, X } from 'lucide-react';
import { type QueueItemDto } from '@/api/queue/entities/response.entities';
import { cn } from '@/utils/lib/utils';
import SwipeCard from '../swipe-card/SwipeCard';
import { type DraftFormValues } from '../swipe-card/draft-editor/utils';
import { type SwipeGesture } from '../hooks/useSwipeGesture';
import { isEmailItem } from '../utils';
import {
  peekCardStyle,
  stampOpacity,
  topCardStyle,
  visibleDepth,
} from './utils';

type Properties = Readonly<{
  items: ReadonlyArray<QueueItemDto>;
  gesture: SwipeGesture;
  editing: boolean;
  saving: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (item: QueueItemDto, values: DraftFormValues) => void;
}>;

const CARD_CLASS =
  'border-app-line bg-app-surface absolute inset-0 overflow-hidden rounded-[22px] border';

const TOP_CARD_SHADOW = 'shadow-[0_18px_40px_-26px_var(--app-drop)]';

const SwipeDeck = ({
  items,
  gesture,
  editing,
  saving,
  onStartEdit,
  onCancelEdit,
  onSave,
}: Properties) => {
  const top = items[0];
  if (top === undefined) return null;
  const peeks = items.slice(1, visibleDepth(items.length));

  return (
    <div className="relative h-full w-full">
      {[...peeks].reverse().map((item, index) => (
        <div
          key={item.id}
          aria-hidden
          className={cn(CARD_CLASS, 'pointer-events-none')}
          style={peekCardStyle(peeks.length - index)}
        />
      ))}
      <div
        key={top.id}
        {...gesture.handlers}
        className={cn(
          CARD_CLASS,
          TOP_CARD_SHADOW,
          'touch-pan-y select-none',
          editing && 'select-text',
        )}
        style={topCardStyle(gesture)}
      >
        <div
          aria-hidden
          className="text-app-success-fg border-app-success-fg bg-app-surface pointer-events-none absolute top-[42%] left-6 z-10 flex -rotate-12 items-center gap-2 rounded-xl border-[3px] px-4 py-2 text-lg font-bold tracking-wider uppercase shadow-[0_8px_20px_-14px_var(--app-drop)]"
          style={{ opacity: stampOpacity(gesture.progress, 'right') }}
        >
          <Check size={20} /> {isEmailItem(top) ? 'Send' : 'Mark sent'}
        </div>
        <div
          aria-hidden
          className="text-app-danger-fg border-app-danger-fg bg-app-surface pointer-events-none absolute top-[42%] right-6 z-10 flex rotate-12 items-center gap-2 rounded-xl border-[3px] px-4 py-2 text-lg font-bold tracking-wider uppercase shadow-[0_8px_20px_-14px_var(--app-drop)]"
          style={{ opacity: stampOpacity(gesture.progress, 'left') }}
        >
          <X size={20} /> Skip
        </div>
        <SwipeCard
          item={top}
          editing={editing}
          saving={saving}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSave={(values) => onSave(top, values)}
        />
      </div>
    </div>
  );
};

export default SwipeDeck;
