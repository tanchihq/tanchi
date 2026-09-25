import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent,
} from 'react';

export type SwipeDirection = 'left' | 'right';

const SWIPE_THRESHOLD_PX = 110;
const AXIS_LOCK_DISTANCE_PX = 8;
export const SWIPE_EXIT_DURATION_MS = 220;

const NON_SWIPE_SELECTOR =
  '[data-no-swipe], button, a, input, textarea, select';

type Gesture = Readonly<{
  pointerId: number;
  startX: number;
  startY: number;
  axis: 'x' | 'y' | null;
}>;

type UseSwipeGestureProps = Readonly<{
  enabled: boolean;
  onSwipe: (direction: SwipeDirection) => void;
}>;

const lockAxis = (dx: number, dy: number): 'x' | 'y' | null => {
  if (Math.abs(dx) > AXIS_LOCK_DISTANCE_PX && Math.abs(dx) > Math.abs(dy))
    return 'x';
  if (Math.abs(dy) > AXIS_LOCK_DISTANCE_PX) return 'y';
  return null;
};

const startsOnControl = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest(NON_SWIPE_SELECTOR) !== null;

const useSwipeGesture = ({ enabled, onSwipe }: UseSwipeGestureProps) => {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exiting, setExiting] = useState<SwipeDirection | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const draggedRef = useRef(false);
  const exitingRef = useRef(false);
  const onSwipeRef = useRef(onSwipe);

  useEffect(() => {
    onSwipeRef.current = onSwipe;
  }, [onSwipe]);

  const fly = useCallback((direction: SwipeDirection) => {
    if (exitingRef.current) return;
    exitingRef.current = true;
    setExiting(direction);
    setTimeout(() => {
      onSwipeRef.current(direction);
      exitingRef.current = false;
      setExiting(null);
      setOffset(0);
    }, SWIPE_EXIT_DURATION_MS);
  }, []);

  const reset = () => {
    gestureRef.current = null;
    setDragging(false);
    setOffset(0);
  };

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!enabled || exitingRef.current || event.button !== 0) return;
    if (startsOnControl(event.target)) return;
    draggedRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      axis: null,
    };
  };

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture === null || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    const dy = event.clientY - gesture.startY;

    const axis = gesture.axis ?? lockAxis(dx, dy);
    if (axis !== gesture.axis) {
      gestureRef.current = { ...gesture, axis };
      if (axis === 'x') {
        event.currentTarget.setPointerCapture(event.pointerId);
        setDragging(true);
      }
    }
    if (axis !== 'x') return;
    draggedRef.current = true;
    setOffset(dx);
  };

  const onPointerUp = (event: PointerEvent<HTMLElement>) => {
    const gesture = gestureRef.current;
    if (gesture === null || gesture.pointerId !== event.pointerId) return;
    const dx = event.clientX - gesture.startX;
    if (gesture.axis === 'x' && Math.abs(dx) >= SWIPE_THRESHOLD_PX) {
      gestureRef.current = null;
      setDragging(false);
      fly(dx > 0 ? 'right' : 'left');
      return;
    }
    reset();
  };

  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!draggedRef.current) return;
    draggedRef.current = false;
    event.stopPropagation();
    event.preventDefault();
  };

  return {
    offset,
    dragging,
    exiting,
    progress: Math.max(-1, Math.min(1, offset / SWIPE_THRESHOLD_PX)),
    fly,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      onClickCapture,
    },
  };
};

export type SwipeGesture = ReturnType<typeof useSwipeGesture>;

export default useSwipeGesture;
