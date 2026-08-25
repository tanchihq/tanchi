import { type CSSProperties } from 'react';

const glow = (style: CSSProperties, color: string, animation: string): CSSProperties => ({
  position: 'fixed',
  zIndex: 0,
  pointerEvents: 'none',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}, rgba(5, 1, 240, 0) 68%)`,
  ...style,
  animation,
});

const AppBackground = () => (
  <>
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'var(--app-aurora)',
      }}
    />
    <div
      style={glow(
        { top: '-18%', left: '-12%', width: '55vw', height: '55vw', filter: 'blur(60px)' },
        'var(--app-glow-a)',
        'sl-drift-a 26s ease-in-out infinite',
      )}
    />
    <div
      style={glow(
        { bottom: '-22%', right: '-10%', width: '60vw', height: '60vw', filter: 'blur(70px)' },
        'var(--app-glow-b)',
        'sl-drift-b 32s ease-in-out infinite',
      )}
    />
  </>
);

export { AppBackground };
