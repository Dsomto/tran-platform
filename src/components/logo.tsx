interface LogoProps {
  className?: string;
  size?: number;
  color?: string;
}

export function Logo({ className = "", size = 32, color = "#2563EB" }: LogoProps) {
  return (
    <svg
      width={size}
      height={size * 1.5}
      viewBox="0 0 64 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Hexagon head */}
      <path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        stroke={color}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Terminal prompt > */}
      <path
        d="M22 24L30 32L22 40"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Cursor line */}
      <path
        d="M33 38H42"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Stem */}
      <path
        d="M32 60V80"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Left branch */}
      <path
        d="M32 72L18 86"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Right branch */}
      <path
        d="M32 72L46 86"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Center root */}
      <path
        d="M32 80V92"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Circuit nodes */}
      <circle cx="18" cy="86" r="3" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="46" cy="86" r="3" stroke={color} strokeWidth="2" fill="none" />
      <circle cx="32" cy="92" r="2.5" stroke={color} strokeWidth="2" fill="none" />
      {/* Small branch off left */}
      <path
        d="M25 79L20 74"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="19" cy="73" r="2" stroke={color} strokeWidth="1.5" fill="none" />
      {/* Small branch off right */}
      <path
        d="M39 79L44 74"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="45" cy="73" r="2" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export function LogoMark({ className = "", size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        stroke="#2563EB"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M22 24L30 32L22 40"
        stroke="#2563EB"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M33 38H42"
        stroke="#2563EB"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
