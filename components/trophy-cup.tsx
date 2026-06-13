/**
 * Cúp vàng CÁCH ĐIỆU CHUNG (hình chiếc cúp cổ điển: bầu cúp + 2 quai + chân đế).
 * KHÔNG sao chép thiết kế cúp World Cup chính thức của FIFA → an toàn bản quyền.
 */
export function TrophyCup({
  size = 112,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 76"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Cúp vàng"
    >
      <defs>
        <linearGradient id="cup-gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFF1BC" />
          <stop offset="0.45" stopColor="#F4C84B" />
          <stop offset="1" stopColor="#B27A12" />
        </linearGradient>
        <linearGradient id="cup-gold-h" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFF7D9" />
          <stop offset="1" stopColor="#DDA228" />
        </linearGradient>
        <radialGradient id="cup-glow" cx="0.5" cy="0.4" r="0.6">
          <stop offset="0" stopColor="#FFE89A" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FFE89A" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle cx="32" cy="26" r="30" fill="url(#cup-glow)" />

      {/* quai trái & phải */}
      <path
        d="M17 13 C6 13 6 30 20 28"
        fill="none"
        stroke="url(#cup-gold-h)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />
      <path
        d="M47 13 C58 13 58 30 44 28"
        fill="none"
        stroke="url(#cup-gold-h)"
        strokeWidth="3.6"
        strokeLinecap="round"
      />

      {/* bầu cúp */}
      <path
        d="M16 9 H48 V18 C48 31.5 41 40 32 40 C23 40 16 31.5 16 18 Z"
        fill="url(#cup-gold)"
      />
      {/* miệng cúp */}
      <ellipse cx="32" cy="9.5" rx="16" ry="3.1" fill="#FFF1BC" />
      <ellipse cx="32" cy="9.5" rx="12" ry="1.8" fill="#C98E1E" opacity="0.6" />

      {/* ánh sáng */}
      <path
        d="M22 13 C21 24 24.5 33 30.5 37"
        fill="none"
        stroke="#FFFCEC"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.55"
      />

      {/* ngôi sao */}
      <path
        d="M32 16.5 L33.5 20.3 L37.6 20.6 L34.4 23.2 L35.5 27.2 L32 24.9 L28.5 27.2 L29.6 23.2 L26.4 20.6 L30.5 20.3 Z"
        fill="#FFFBEA"
        opacity="0.9"
      />

      {/* thân & đế */}
      <rect x="29" y="39.5" width="6" height="9" fill="url(#cup-gold)" />
      <path d="M23 48.5 H41 L43.5 56 H20.5 Z" fill="url(#cup-gold)" />
      <rect x="16.5" y="56" width="31" height="7" rx="2.2" fill="url(#cup-gold)" />
      <rect x="16.5" y="56" width="31" height="2.4" rx="1.2" fill="#FFF1BC" opacity="0.7" />
    </svg>
  );
}
