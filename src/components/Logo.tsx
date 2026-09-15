export function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="logo">
      <svg width={size} height={size} viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="nocrowd-logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFD6E8" />
            <stop offset="50%" stopColor="#D6C7FF" />
            <stop offset="100%" stopColor="#C4F0E4" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#nocrowd-logo-gradient)" />
        <path
          d="M20 40c0-9 5.5-16 12-16s12 7 12 16"
          stroke="#7A6B99"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        <rect x="17" y="40" width="30" height="10" rx="5" fill="#FFFFFF" opacity="0.9" />
        <circle cx="25" cy="27" r="2.6" fill="#7A6B99" />
        <circle cx="39" cy="27" r="2.6" fill="#7A6B99" />
      </svg>
      <span className="logo__wordmark">NoCrowd</span>
    </div>
  )
}
