interface ConsidLogoProps {
  variant?: 'full' | 'symbol';
  color?: 'white' | 'black';
  height?: number;
  className?: string;
}

const logoMap = {
  'full-white': 'consid-horizontal-white.png',
  'full-black': 'consid-horizontal-black.png',
  'symbol-white': 'consid-symbol-white.png',
  'symbol-black': 'consid-symbol-black.png',
} as const;

// Horizontal: 1664x420 ≈ 3.96:1, Vertical (symbol): 1772x1924 ≈ 0.92:1
const aspectRatios = { full: 1664 / 420, symbol: 1772 / 1924 };

/**
 * Consid logotype — official PNG assets
 * - `full`: Horizontal logo (symbol + CONSID wordmark)
 * - `symbol`: Vertical logo (symbol + CONSID stacked)
 */
export function ConsidLogo({
  variant = 'full',
  color = 'white',
  height = 32,
  className,
}: ConsidLogoProps) {
  const key = `${variant}-${color}` as keyof typeof logoMap;
  const file = logoMap[key];
  const width = Math.round(height * aspectRatios[variant]);

  return (
    <img
      src={`${import.meta.env.BASE_URL}logos/${file}`}
      alt="Consid"
      width={width}
      height={height}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  );
}
