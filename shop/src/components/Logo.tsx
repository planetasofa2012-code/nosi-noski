// Логотип «Носи носки» — стикер: лайм, чёрная обводка, розовый носок
export const SOCK_PATH = 'M30 8q0-4 4-4h22q4 0 4 4v40l23 12q12 7 6 20t-17 8H42q-14 0-14-14z';

export function Sock({ fill = '#ff3d8b', stripe = '#111', className }: { fill?: string; stripe?: string; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      <path d={SOCK_PATH} fill={fill} />
      <rect x="30" y="12" width="30" height="7" fill={stripe} />
      <rect x="30" y="23" width="30" height="4" fill={stripe} />
      <path d="M28 74q0 14 14 14h6V70q-10 0-20 4z" fill={stripe} opacity=".85" />
      <path d="M78 63q12 6 9 18t-15 7z" fill={stripe} opacity=".85" />
    </svg>
  );
}

/** Горизонтальный стикер для шапки и подвала */
export function Logo({ className = 'h-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 280 66" className={className} role="img" aria-label="Носи носки">
      <g transform="rotate(-3 140 33)">
        <rect x="9" y="11" width="262" height="46" rx="6" fill="#111" />
        <rect x="5" y="7" width="262" height="46" rx="6" fill="#dcff3a" stroke="#111" strokeWidth="3" />
        <text
          x="16"
          y="39"
          fontSize="21"
          fontWeight="900"
          fill="#111"
          letterSpacing="-0.5"
          style={{ fontFamily: 'var(--font-unbounded), sans-serif' }}
        >
          НОСИ НОСКИ!
        </text>
        <g transform="translate(222 9) scale(0.42)">
          <path d={SOCK_PATH} fill="#ff3d8b" />
          <rect x="30" y="12" width="30" height="7" fill="#111" />
          <rect x="30" y="23" width="30" height="4" fill="#111" />
          <path d="M28 74q0 14 14 14h6V70q-10 0-20 4z" fill="#111" opacity=".85" />
          <path d="M78 63q12 6 9 18t-15 7z" fill="#111" opacity=".85" />
        </g>
      </g>
    </svg>
  );
}
