import { type CSSProperties } from 'react';
import {
  SWIPE_EXIT_DURATION_MS,
  type SwipeGesture,
} from '../hooks/useSwipeGesture';

const MAX_ROTATION_DEG = 12;
const EXIT_ROTATION_DEG = 18;
const PEEK_CARDS = 2;

export const visibleDepth = (count: number): number =>
  Math.min(count, PEEK_CARDS + 1);

export const topCardStyle = (gesture: SwipeGesture): CSSProperties => {
  if (gesture.exiting !== null) {
    const direction = gesture.exiting === 'right' ? 1 : -1;
    return {
      transform: `translateX(${direction * 120}%) rotate(${direction * EXIT_ROTATION_DEG}deg)`,
      opacity: 0,
      transition: `transform ${SWIPE_EXIT_DURATION_MS}ms ease-in, opacity ${SWIPE_EXIT_DURATION_MS}ms ease-in`,
    };
  }
  return {
    transform: `translateX(${gesture.offset}px) rotate(${gesture.progress * MAX_ROTATION_DEG}deg)`,
    transition: gesture.dragging ? 'none' : 'transform 200ms ease-out',
  };
};

export const peekCardStyle = (depth: number): CSSProperties => ({
  transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.04})`,
  opacity: 1 - depth * 0.35,
});

export const stampOpacity = (
  progress: number,
  direction: 'left' | 'right',
): number =>
  direction === 'right' ? Math.max(0, progress) : Math.max(0, -progress);
