import { useState, type CSSProperties, type FormEvent } from 'react';
import { Button, Input, Badge } from '../../ui';
import { usePermissions, useAddPermission, useRemovePermission } from '../../../hooks/usePermissions';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../ui/Toast';
import { sharedStyles } from '../shared-styles';

interface Props {
  eventId: number;
}

const ROLE_LABELS: Record<string, string> = {
  owner: 'Ägare',
  editor: 'Redigerare',
  viewer: 'Läsare',
};

const ROLE_VARIANTS: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'muted'> = {
  owner: 'danger',
  editor: 'warning',
  viewer: 'muted',
};

export function PermissionsPanel({ eventId }: Props) {
  const { user } = useAuth();
  const { data: permissions, isLoading } = usePermissions(eventId);
  const addPermission = useAddPermission(eventId);
  const removePermission = useRemovePermission(eventId);
  const { toast: addToast } = useToast();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('editor');
  const [showForm, setShowForm] = useState(false);

  const isOwner = permissions?.some(
    (p) => p.user_id === user?.id && p.role === 'owner'
  );

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;

    try {
      await addPermission.mutateAsync({ email: email.trim(), name: name.trim(), role });
      addToast('Behörighet tillagd', 'success');
      setEmail('');
      setName('');
      setShowForm(false);
    } catch {
      addToast('Kunde inte lägga till behörighet', 'error');
    }
  };

  const handleRoleChange = async (perm: { user_email: string; user_name: string; role: string }, newRole: string) => {
    if (newRole === perm.role) return;
    try {
      await addPermission.mutateAsync({ email: perm.user_email, name: perm.user_name, role: newRole });
      addToast(`Roll ändrad till ${ROLE_LABELS[newRole] || newRole}`, 'success');
    } catch {
      addToast('Kunde inte ändra roll', 'error');
    }
  };

  const handleRemove = async (userId: number, userName: string) => {
    if (!confirm(`Ta bort behörighet för ${userName}?`)) return;

    try {
      await removePermission.mutateAsync(userId);
      addToast('Behörighet borttagen', 'success');
    } catch {
      addToast('Kunde inte ta bort behörighet', 'error');
    }
  };

  if (isLoading) {
    return <div style={{ padding: '24px', color: 'var(--color-text-muted)' }}>Laddar behörigheter...</div>;
  }

  return (
    <div>
      <div style={sharedStyles.header}>
        <span style={sharedStyles.headerCount}>
          Behörigheter ({permissions?.length ?? 0})
        </span>
        {isOwner && !showForm && (
          <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
            + Lägg till
          </Button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAdd} style={styles.form}>
          <Input
            label="Namn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Användarens namn"
          />
          <Input
            label="E-post"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@consid.se"
          />
          <div>
            <label style={sharedStyles.modalSelectLabel}>Roll</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={sharedStyles.modalSelect}
            >
              <option value="editor">Redigerare</option>
              <option value="viewer">Läsare</option>
            </select>
          </div>
          <div style={styles.formActions}>
            <Button variant="ghost" size="sm" type="button" onClick={() => setShowForm(false)}>
              Avbryt
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={addPermission.isPending}>
              {addPermission.isPending ? 'Lägger till...' : 'Lägg till'}
            </Button>
          </div>
        </form>
      )}

      {permissions && permissions.length > 0 ? (
        <div style={sharedStyles.tableWrapper}>
          <table style={sharedStyles.table}>
            <thead>
              <tr>
                <th style={sharedStyles.th}>Namn</th>
                <th style={sharedStyles.th}>E-post</th>
                <th style={sharedStyles.th}>Roll</th>
                {isOwner && <th style={{ ...sharedStyles.th, width: '60px' }}></th>}
              </tr>
            </thead>
            <tbody>
              {permissions.map((perm) => (
                <tr key={perm.id} style={sharedStyles.tr}>
                  <td style={{ ...sharedStyles.td, ...sharedStyles.participantName }}>
                    {perm.user_name}
                    {perm.user_id === user?.id && (
                      <span style={styles.youTag}> (du)</span>
                    )}
                  </td>
                  <td style={sharedStyles.td}>{perm.user_email}</td>
                  <td style={sharedStyles.td}>
                    {isOwner && perm.user_id !== user?.id ? (
                      <select
                        value={perm.role}
                        onChange={(e) => handleRoleChange(perm, e.target.value)}
                        style={styles.roleSelect}
                      >
                        <option value="editor">Redigerare</option>
                        <option value="viewer">Läsare</option>
                      </select>
                    ) : (
                      <Badge variant={ROLE_VARIANTS[perm.role] || 'default'}>
                        {ROLE_LABELS[perm.role] || perm.role}
                      </Badge>
                    )}
                  </td>
                  {isOwner && (
                    <td style={sharedStyles.td}>
                      {perm.user_id !== user?.id && (
                        <button
                          onClick={() => handleRemove(perm.user_id, perm.user_name)}
                          style={sharedStyles.deleteBtn}
                          title="Ta bort behörighet"
                        >
                          &times;
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={sharedStyles.emptyTab}>
          <div style={sharedStyles.emptyTitle}>Inga behörigheter</div>
          <div style={sharedStyles.emptyText}>
            Bara du har åtkomst till detta event just nu.
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '16px',
    marginBottom: '16px',
    backgroundColor: 'var(--color-bg-card)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--color-border)',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
    marginTop: '4px',
  },
  youTag: {
    fontSize: 'var(--font-size-xs)',
    color: 'var(--color-text-muted)',
    fontWeight: 400,
  },
  roleSelect: {
    padding: '4px 8px',
    fontSize: 'var(--font-size-sm)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--color-border)',
    backgroundColor: 'var(--color-bg-primary)',
    color: 'var(--color-text-primary)',
    fontFamily: 'inherit',
    cursor: 'pointer',
  },
};
