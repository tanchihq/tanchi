import { type CSSProperties } from 'react';

const layer: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 0,
  pointerEvents: 'none',
};

const glow = (
  style: CSSProperties,
  color: string,
  animation?: string,
): CSSProperties => ({
  position: 'fixed',
  zIndex: 0,
  pointerEvents: 'none',
  borderRadius: '50%',
  background: `radial-gradient(circle, ${color}, rgba(5,1,240,0) 68%)`,
  ...style,
  ...(animation !== undefined ? { animation } : {}),
});

const ring = (size: number, alpha: number): CSSProperties => ({
  position: 'fixed',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%,-50%)',
  width: size,
  height: size,
  zIndex: 0,
  pointerEvents: 'none',
  borderRadius: '50%',
  border: `1px solid rgba(130,150,255,${alpha})`,
});

const AuthBackground = () => (
  <>
    <div
      style={{
        ...layer,
        background:
          'radial-gradient(125% 105% at 50% 42%, #16143A 0%, #100E29 44%, #0A0A1F 100%)',
      }}
    />
    <div
      style={glow(
        { top: '-22%', left: '-14%', width: '62vw', height: '56vw', filter: 'blur(60px)' },
        'rgba(5,1,240,0.16)',
        'sl-drift-a 26s ease-in-out infinite',
      )}
    />
    <div
      style={glow(
        { bottom: '-22%', right: '-10%', width: '60vw', height: '60vw', filter: 'blur(70px)' },
        'rgba(5,1,240,0.13)',
        'sl-drift-b 32s ease-in-out infinite',
      )}
    />
    <div
      style={glow(
        { top: '30%', right: '22%', width: '34vw', height: '34vw', filter: 'blur(64px)' },
        'rgba(5,1,240,0.07)',
        'sl-drift-c 38s ease-in-out infinite',
      )}
    />
    <div style={ring(880, 0.09)} />
    <div style={ring(1200, 0.06)} />
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        width: 1260,
        height: 1260,
        zIndex: 0,
        pointerEvents: 'none',
        borderRadius: '50%',
        background:
          'conic-gradient(from 0deg, rgba(5,1,240,0) 0deg, rgba(5,1,240,0.20) 14deg, rgba(5,1,240,0.06) 84deg, rgba(5,1,240,0) 155deg, rgba(5,1,240,0) 360deg)',
        WebkitMask:
          'radial-gradient(circle, rgba(0,0,0,0) 8%, #000 27%, #000 52%, rgba(0,0,0,0) 80%)',
        mask: 'radial-gradient(circle, rgba(0,0,0,0) 8%, #000 27%, #000 52%, rgba(0,0,0,0) 80%)',
        filter: 'blur(8px)',
        animation: 'sl-radar 11s linear infinite',
      }}
    />
  </>
);

export { AuthBackground };
