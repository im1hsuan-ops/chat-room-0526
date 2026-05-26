import { ACCENTS, hash } from '../utils/avatar';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 36 }: AvatarProps) {
  const h = hash(name || 'x');
  const accent = ACCENTS[h % ACCENTS.length];
  const shape = (h >> 3) % 4; // 0 circle, 1 squircle, 2 diamond, 3 hex
  const glyph = (name || '?').replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '??';
  const fs = Math.round(size * 0.42);

  const common: React.CSSProperties = {
    width: size,
    height: size,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: accent,
    color: 'oklch(18% 0.03 290)',
    fontFamily: '"JetBrains Mono", ui-monospace, monospace',
    fontWeight: 700,
    fontSize: fs,
    letterSpacing: '-0.02em',
    flex: '0 0 auto',
    userSelect: 'none',
  };

  let style: React.CSSProperties = { ...common };
  if (shape === 0) style.borderRadius = '50%';
  else if (shape === 1) style.borderRadius = '34%';
  else if (shape === 2) { style.borderRadius = '14%'; style.transform = 'rotate(45deg)'; }
  else style.clipPath = 'polygon(25% 6%, 75% 6%, 100% 50%, 75% 94%, 25% 94%, 0% 50%)';

  const text = shape === 2
    ? <span style={{ transform: 'rotate(-45deg)', display: 'inline-block' }}>{glyph}</span>
    : glyph;

  return <div style={style} aria-hidden="true">{text}</div>;
}
