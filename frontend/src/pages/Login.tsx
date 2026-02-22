import { useState, type CSSProperties, type FormEvent } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button, Input } from '../components/ui';

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !name.trim()) {
      setError('Fyll i både namn och e-post');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), name.trim());
    } catch (err) {
      setError((err as Error).message || 'Inloggning misslyckades');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoMark}>S</div>
          <h1 style={styles.title}>Stage</h1>
          <p style={styles.subtitle}>Consid Eventplattform</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Input
            label="Namn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ditt namn"
          />
          <Input
            label="E-post"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din.email@consid.se"
          />

          {error && <p style={styles.error}>{error}</p>}

          <Button
            variant="primary"
            size="lg"
            type="submit"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Loggar in...' : 'Logga in'}
          </Button>
        </form>

        <p style={styles.hint}>
          Ange din e-postadress för att komma igång. Om kontot inte finns skapas det automatiskt.
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  wrapper: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--color-bg-primary)',
    padding: '24px',
  },
  card: {
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '32px',
  },
  logoMark: {
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    backgroundColor: 'var(--color-burgundy)',
    color: 'var(--color-white)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
    marginBottom: '16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: 'var(--color-burgundy)',
    margin: '0 0 4px',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    margin: 0,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  error: {
    color: 'var(--color-raspberry-red)',
    fontSize: '14px',
    margin: '0',
    textAlign: 'center' as const,
  },
  hint: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    textAlign: 'center' as const,
    marginTop: '24px',
    lineHeight: '1.5',
  },
};
