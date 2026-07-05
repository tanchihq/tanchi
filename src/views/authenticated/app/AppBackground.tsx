import { type CSSProperties } from 'react';

const glow = (style: CSSProperties, color: string, animation: string): CSSProperties => ({
  position: 'fixed',
  zIndex: 0,
  pointerEvents: 'none',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}, rgba(5,1,240,0) 68%)`,
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
        background:
          'radial-gradient(120% 100% at 50% 38%, #13132D 0%, #0D0D22 48%, #0A0A1F 100%)',
      }}
    />
    <div
      style={glow(
        { top: '-18%', left: '-12%', width: '55vw', height: '55vw', filter: 'blur(60px)' },
        'rgba(5,1,240,0.16)',
        'sl-drift-a 26s ease-in-out infinite',
      )}
    />
    <div
      style={glow(
        { bottom: '-22%', right: '-10%', width: '60vw', height: '60vw', filter: 'blur(70px)' },
        'rgba(5,1,240,0.12)',
        'sl-drift-b 32s ease-in-out infinite',
      )}
    />
  </>
);

export { AppBackground };
