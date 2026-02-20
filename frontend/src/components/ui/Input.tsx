import { type InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, style, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div style={styles.wrapper}>
        {label && (
          <label htmlFor={inputId} style={styles.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          style={{
            ...styles.input,
            ...(error ? styles.inputError : {}),
            ...style,
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error && (
          <span id={`${inputId}-error`} style={styles.error} role="alert">
            {error}
          </span>
        )}
        {!error && hint && (
          <span id={`${inputId}-hint`} style={styles.hint}>
            {hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: 'var(--font-size-sm)',
    fontWeight: 'var(--font-weight-medium)' as unknown as number,
    color: 'var(--color-text-secondary)',
  },
  input: {
    height: '36px',
    padding: '0 12px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border-strong)',
    backgroundColor: 'var(--color-white)',
    fontSize: 'var(--font-size-base)',
    color: 'var(--color-text-primary)',
    outline: 'none',
    transition: 'border-color var(--transition-fast), box-shadow var(--transition-fast)',
    fontFamily: 'inherit',
    width: '100%',
  },
  inputError: {
    borderColor: 'var(--color-danger)',
  },
  error: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-danger)',
  },
  hint: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
  },
};
