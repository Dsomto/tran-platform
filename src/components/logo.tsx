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

/* The official UBI symbol (built from public/brand/ubi-logo-official.jpg by
   scripts/build-brand-assets.mjs). `size` is the old square-icon size; the
   symbol is drawn a little taller than that and about 1.9x as wide.
   tone: "auto" follows the site theme; "dark" is for always-dark surfaces
   (the footer); "light" for always-light ones (printed letters). */
const MARK_RATIO = 300 / 160;

export function LogoMark({
  className = "",
  size = 24,
  tone = "auto",
}: {
  className?: string;
  size?: number;
  tone?: "auto" | "light" | "dark";
}) {
  const height = Math.round(size * 1.2);
  const width = Math.round(height * MARK_RATIO);
  const img = (src: string, extra = "") => (
    // eslint-disable-next-line @next/next/no-img-element -- tiny static PNG, no optimisation needed
    <img
      src={src}
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      className={`max-w-full object-contain ${extra} ${className}`}
      style={{ height, width: "auto" }}
    />
  );
  if (tone === "light") return img("/brand/ubi-mark.png");
  if (tone === "dark") return img("/brand/ubi-mark-dark.png");
  return (
    <>
      {img("/brand/ubi-mark.png", "dark:hidden")}
      {img("/brand/ubi-mark-dark.png", "hidden dark:block")}
    </>
  );
}
