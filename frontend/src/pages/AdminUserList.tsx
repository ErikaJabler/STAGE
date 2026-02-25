import { useState } from 'react';
import { useAdminUsers, useToggleAdmin, useDeleteUser } from '../hooks/useAdmin';
import { useAuth } from '../hooks/useAuth';

export function AdminUserList() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAdminUsers();
  const toggleAdmin = useToggleAdmin();
  const deleteUserMut = useDeleteUser();
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  if (isLoading) {
    return <div style={styles.loading}>Laddar användare...</div>;
  }

  if (!users) return null;

  const adminCount = users.filter((u) => u.is_admin).length;

  return (
    <section>
      <div style={styles.header}>
        <h2 style={styles.title}>Användare</h2>
        <span style={styles.summary}>
          {users.length} användare, {adminCount} admin
        </span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Email</th>
              <th style={styles.th}>Namn</th>
              <th style={styles.th}>Roll</th>
              <th style={styles.th}>Registrerad</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Åtgärder</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              return (
                <tr key={u.id} style={styles.row}>
                  <td style={styles.td}>{u.email}</td>
                  <td style={styles.td}>{u.name}</td>
                  <td style={styles.td}>
                    <span style={u.is_admin ? styles.badgeAdmin : styles.badgeUser}>
                      {u.is_admin ? 'Admin' : 'Användare'}
                    </span>
                  </td>
                  <td style={styles.td}>{new Date(u.created_at).toLocaleDateString('sv-SE')}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    {isSelf ? (
                      <span style={styles.selfNote}>Du</span>
                    ) : (
                      <div style={styles.actions}>
                        <button
                          style={u.is_admin ? styles.btnDemote : styles.btnPromote}
                          disabled={toggleAdmin.isPending}
                          onClick={() => toggleAdmin.mutate({ id: u.id, isAdmin: !u.is_admin })}
                        >
                          {u.is_admin ? 'Ta bort admin' : 'Gör admin'}
                        </button>

                        {confirmDeleteId === u.id ? (
                          <span style={styles.confirmGroup}>
                            <span style={styles.confirmText}>Säker?</span>
                            <button
                              style={styles.btnConfirmYes}
                              disabled={deleteUserMut.isPending}
                              onClick={() => {
                                deleteUserMut.mutate(u.id, {
                                  onSuccess: () => setConfirmDeleteId(null),
                                });
                              }}
                            >
                              Ja
                            </button>
                            <button
                              style={styles.btnConfirmNo}
                              onClick={() => setConfirmDeleteId(null)}
                            >
                              Nej
                            </button>
                          </span>
                        ) : (
                          <button style={styles.btnDelete} onClick={() => setConfirmDeleteId(u.id)}>
                            Ta bort
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: 'var(--color-burgundy)',
    margin: 0,
  },
  summary: {
    fontSize: 'var(--font-size-sm)',
    color: 'var(--color-text-secondary)',
  },
  loading: {
    padding: '24px',
    textAlign: 'center' as const,
    color: 'var(--color-text-secondary)',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    border: '1px solid var(--color-border, #e0d6cf)',
    borderRadius: 'var(--radius-md)',
    backgroundColor: 'white',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: 'var(--font-size-sm)',
  },
  th: {
    textAlign: 'left' as const,
    padding: '10px 14px',
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    color: 'var(--color-text-secondary)',
    borderBottom: '1px solid var(--color-border, #e0d6cf)',
    whiteSpace: 'nowrap' as const,
  },
  row: {
    borderBottom: '1px solid var(--color-border, #e0d6cf)',
  },
  td: {
    padding: '10px 14px',
    whiteSpace: 'nowrap' as const,
  },
  badgeAdmin: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 600,
    backgroundColor: 'var(--color-raspberry-red, #B5223F)',
    color: 'white',
  },
  badgeUser: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: 'var(--color-border, #e0d6cf)',
    color: 'var(--color-text-secondary)',
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  selfNote: {
    fontSize: '12px',
    color: 'var(--color-text-secondary)',
    fontStyle: 'italic',
  },
  btnPromote: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid var(--color-burgundy)',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: 'transparent',
    color: 'var(--color-burgundy)',
    cursor: 'pointer',
  },
  btnDemote: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid var(--color-text-secondary)',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
  btnDelete: {
    padding: '4px 10px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid #c33',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: 'transparent',
    color: '#c33',
    cursor: 'pointer',
  },
  confirmGroup: {
    display: 'inline-flex',
    gap: '4px',
    alignItems: 'center',
  },
  confirmText: {
    fontSize: '12px',
    color: '#c33',
    fontWeight: 500,
  },
  btnConfirmYes: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: '#c33',
    color: 'white',
    cursor: 'pointer',
  },
  btnConfirmNo: {
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 500,
    border: '1px solid var(--color-border, #e0d6cf)',
    borderRadius: 'var(--radius-sm, 4px)',
    backgroundColor: 'transparent',
    color: 'var(--color-text-secondary)',
    cursor: 'pointer',
  },
};
