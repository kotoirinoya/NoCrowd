const PALETTE = ['#FFD6E8', '#D6C7FF', '#C4F0E4', '#FFE8B8', '#C7E5FF', '#FFD1C2']

function hashSeed(seed: string): number {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return h
}

export function AvatarIllustration({ seed, size = 56 }: { seed: string; size?: number }) {
  const color = PALETTE[hashSeed(seed) % PALETTE.length]
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="32" fill={color} />
      <circle cx="23" cy="29" r="3.2" fill="#5B4B6B" />
      <circle cx="41" cy="29" r="3.2" fill="#5B4B6B" />
      <path d="M22 39c4.5 5 15.5 5 20 0" stroke="#5B4B6B" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="36" r="4" fill="#FF9EC4" opacity="0.6" />
      <circle cx="50" cy="36" r="4" fill="#FF9EC4" opacity="0.6" />
    </svg>
  )
}
