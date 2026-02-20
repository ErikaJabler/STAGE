type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'muted';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children }: BadgeProps) {
  return (
    <span
      style={{
        ...baseStyle,
        ...variantStyles[variant],
      }}
    >
      {children}
    </span>
  );
}

const baseStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '2px 8px',
  borderRadius: 'var(--radius-full)',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 'var(--font-weight-medium)' as unknown as number,
  lineHeight: '1.6',
  whiteSpace: 'nowrap',
};

const variantStyles: Record<BadgeVariant, React.CSSProperties> = {
  default: {
    backgroundColor: 'rgba(112, 17, 49, 0.08)',
    color: 'var(--color-burgundy)',
  },
  success: {
    backgroundColor: 'rgba(45, 122, 79, 0.1)',
    color: 'var(--color-success)',
  },
  warning: {
    backgroundColor: 'rgba(236, 107, 106, 0.12)',
    color: '#B8562E',
  },
  danger: {
    backgroundColor: 'rgba(181, 34, 63, 0.1)',
    color: 'var(--color-danger)',
  },
  muted: {
    backgroundColor: 'rgba(169, 155, 148, 0.15)',
    color: 'var(--color-text-muted)',
  },
};
