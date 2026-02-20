interface ConsidLogoProps {
  variant?: 'full' | 'symbol';
  color?: 'white' | 'black' | 'burgundy';
  height?: number;
  className?: string;
}

/**
 * Consid logotype — inline SVG
 * Based on Consid Brand Guidelines 2025
 * - `full`: Symbol + wordmark (primary logotype)
 * - `symbol`: Symbol only (for compact use, e.g. collapsed sidebar)
 */
export function ConsidLogo({
  variant = 'full',
  color = 'white',
  height = 32,
  className,
}: ConsidLogoProps) {
  const fillColor = {
    white: '#FFFFFF',
    black: '#1C1C1C',
    burgundy: '#701131',
  }[color];

  const accentColor = '#B5223F';

  if (variant === 'symbol') {
    return (
      <svg
        viewBox="0 0 48 48"
        height={height}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="Consid"
        role="img"
      >
        {/* Outer circle */}
        <circle cx="24" cy="24" r="22" stroke={fillColor} strokeWidth="2" fill="none" />
        {/* Focus dot */}
        <circle cx="40" cy="24" r="3" fill={fillColor} />
        {/* Inner helmet shape — stylized C with red accent */}
        <path
          d="M30 16c-1.5-2.5-4.5-4-8-4-6.5 0-11 4.5-11 11s4.5 11 11 11c3.5 0 6.5-1.5 8-4"
          stroke={fillColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Red heart accent inside helmet */}
        <path
          d="M19 20c0-1.5 1.2-2.5 2.5-2.5S24 18.5 24 20c0 1.5-1.2 2.5-2.5 2.5h-4c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5H22c1.5 0 3-1.2 3-3v-5"
          fill={accentColor}
          opacity="0.9"
        />
      </svg>
    );
  }

  // Full logo: symbol + CONSID wordmark
  const aspectRatio = 4.2;
  const width = height * aspectRatio;

  return (
    <svg
      viewBox="0 0 210 48"
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Consid"
      role="img"
    >
      {/* Symbol */}
      <g>
        {/* Outer circle */}
        <circle cx="24" cy="24" r="22" stroke={fillColor} strokeWidth="2" fill="none" />
        {/* Focus dot */}
        <circle cx="40" cy="24" r="3" fill={fillColor} />
        {/* Inner helmet shape */}
        <path
          d="M30 16c-1.5-2.5-4.5-4-8-4-6.5 0-11 4.5-11 11s4.5 11 11 11c3.5 0 6.5-1.5 8-4"
          stroke={fillColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Red accent */}
        <path
          d="M19 20c0-1.5 1.2-2.5 2.5-2.5S24 18.5 24 20c0 1.5-1.2 2.5-2.5 2.5h-4c-1.5 0-2.5 1-2.5 2.5s1 2.5 2.5 2.5H22c1.5 0 3-1.2 3-3v-5"
          fill={accentColor}
          opacity="0.9"
        />
      </g>

      {/* CONSID wordmark */}
      <text
        x="58"
        y="33"
        fontFamily="'Consid Sans', system-ui, sans-serif"
        fontSize="28"
        fontWeight="600"
        letterSpacing="3"
        fill={fillColor}
      >
        CONSID
      </text>
    </svg>
  );
}
