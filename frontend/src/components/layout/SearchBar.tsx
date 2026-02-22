import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSearch } from '../../hooks/useSearch';

export function SearchBar() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data: results } = useSearch(query);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((eventId: number) => {
    navigate(`/events/${eventId}`);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(-1);
  }, [navigate]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!results || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  const showDropdown = isOpen && query.length >= 2 && results && results.length > 0;

  return (
    <div ref={containerRef} style={styles.container}>
      <div style={styles.inputWrapper}>
        <svg style={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Sök event..."
          style={styles.input}
        />
      </div>

      {showDropdown && (
        <div style={styles.dropdown}>
          {results.map((event, i) => (
            <button
              key={event.id}
              type="button"
              onClick={() => handleSelect(event.id)}
              style={{
                ...styles.resultItem,
                ...(i === selectedIndex ? styles.resultItemActive : {}),
              }}
            >
              <div style={styles.resultName}>
                {event.emoji && <span>{event.emoji} </span>}
                {event.name}
              </div>
              <div style={styles.resultMeta}>
                {event.date} &middot; {event.location}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results && results.length === 0 && (
        <div style={styles.dropdown}>
          <div style={styles.noResults}>Inga resultat</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '280px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    color: 'var(--color-text-muted)',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '7px 12px 7px 32px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-primary)',
    fontSize: 'var(--font-size-sm)',
    fontFamily: 'inherit',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast)',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: '4px',
    backgroundColor: 'var(--color-bg-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 100,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  resultItem: {
    display: 'block',
    width: '100%',
    padding: '10px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    textAlign: 'left' as const,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color var(--transition-fast)',
  },
  resultItemActive: {
    backgroundColor: 'rgba(112, 17, 49, 0.06)',
  },
  resultName: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 500,
    color: 'var(--color-text-primary)',
  },
  resultMeta: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  noResults: {
    padding: '12px',
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
};
