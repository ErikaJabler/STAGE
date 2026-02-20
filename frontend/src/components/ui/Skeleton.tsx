import type { CSSProperties } from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: CSSProperties;
}

export function Skeleton({ width = '100%', height = '16px', borderRadius = 'var(--radius-md)', style }: SkeletonProps) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: 'var(--color-greige)',
        opacity: 0.4,
        animation: 'skeleton-pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

/** Skeleton card matching EventCard layout */
export function EventCardSkeleton() {
  return (
    <div style={cardStyles.card}>
      <div style={cardStyles.header}>
        <Skeleton width={32} height={32} borderRadius="var(--radius-full)" />
        <Skeleton width={80} height={24} borderRadius="var(--radius-full)" />
      </div>
      <Skeleton height={20} width="75%" />
      <div style={cardStyles.meta}>
        <Skeleton height={14} width="60%" />
        <Skeleton height={14} width="50%" />
        <Skeleton height={14} width="40%" />
      </div>
      <div style={cardStyles.footer}>
        <Skeleton height={12} width="30%" />
        <Skeleton height={12} width="20%" />
      </div>
    </div>
  );
}

/** Skeleton grid for Overview page */
export function EventGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
      {Array.from({ length: count }, (_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton for event detail page */
export function EventDetailSkeleton() {
  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={detailStyles.statCard}>
            <Skeleton height={14} width="40%" />
            <Skeleton height={28} width="60%" style={{ marginTop: '8px' }} />
          </div>
        ))}
      </div>
      {/* Details card */}
      <div style={detailStyles.detailsCard}>
        <Skeleton height={20} width="40%" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginTop: '16px' }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i}>
              <Skeleton height={12} width="30%" />
              <Skeleton height={16} width="70%" style={{ marginTop: '4px' }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const cardStyles: Record<string, CSSProperties> = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid var(--color-border)',
  },
};

const detailStyles: Record<string, CSSProperties> = {
  statCard: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '20px',
    border: '1px solid var(--color-border)',
  },
  detailsCard: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    padding: '24px',
    border: '1px solid var(--color-border)',
  },
};
