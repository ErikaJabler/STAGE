/** Shared SVG icons used across feature components */

export function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '4px' }}>
      <path
        d="M7 10V2M7 2L4 5M7 2l3 3M2 12h10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 3.5h10M5 3.5V2.5a1 1 0 011-1h2a1 1 0 011 1v1M11 3.5l-.5 8a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 11.5L3 3.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M1 7s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M12.5 1.5L6 8M12.5 1.5l-4 11-2.5-5.5L1.5 5.5l11-4z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '4px' }}>
      <path
        d="M7 2v8M7 10l3-3M7 10L4 7M2 12h10"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PeopleEmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity: 0.4, marginBottom: '8px' }}
    >
      <circle cx="20" cy="16" r="6" stroke="var(--color-greige)" strokeWidth="2" />
      <path
        d="M8 40c0-6.6 5.4-12 12-12s12 5.4 12 40"
        stroke="var(--color-greige)"
        strokeWidth="2"
      />
      <circle cx="34" cy="18" r="4" stroke="var(--color-greige)" strokeWidth="2" />
      <path
        d="M34 26c4.4 0 8 3.6 8 8"
        stroke="var(--color-greige)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MailEmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity: 0.4, marginBottom: '8px' }}
    >
      <rect
        x="4"
        y="10"
        width="40"
        height="28"
        rx="3"
        stroke="var(--color-greige)"
        strokeWidth="2"
      />
      <path d="M4 14l20 14 20-14" stroke="var(--color-greige)" strokeWidth="2" />
    </svg>
  );
}

export function SettingsEmptyIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ opacity: 0.4, marginBottom: '8px' }}
    >
      <circle cx="24" cy="24" r="8" stroke="var(--color-greige)" strokeWidth="2" />
      <path
        d="M24 4v6M24 38v6M4 24h6M38 24h6M9.5 9.5l4.2 4.2M34.3 34.3l4.2 4.2M38.5 9.5l-4.2 4.2M13.7 34.3l-4.2 4.2"
        stroke="var(--color-greige)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 3L5 8l5 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function DragHandleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ cursor: 'grab' }}>
      <circle cx="5" cy="3" r="1" fill="currentColor" />
      <circle cx="9" cy="3" r="1" fill="currentColor" />
      <circle cx="5" cy="7" r="1" fill="currentColor" />
      <circle cx="9" cy="7" r="1" fill="currentColor" />
      <circle cx="5" cy="11" r="1" fill="currentColor" />
      <circle cx="9" cy="11" r="1" fill="currentColor" />
    </svg>
  );
}
