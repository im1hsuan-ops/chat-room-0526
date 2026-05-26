export const ACCENTS = [
  'oklch(72% 0.18 25)',   // coral
  'oklch(75% 0.14 220)',  // cyan
  'oklch(82% 0.16 90)',   // butter
  'oklch(74% 0.14 165)',  // mint
  'oklch(72% 0.16 305)',  // violet
  'oklch(78% 0.15 10)',   // rose
  'oklch(76% 0.15 140)',  // grass
  'oklch(75% 0.15 50)',   // tangerine
];

export function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function callsignColor(name: string): string {
  return ACCENTS[hash(name) % ACCENTS.length];
}
