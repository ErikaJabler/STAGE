import { useState } from 'react';
import { Badge, Button, Modal, useToast } from '../../ui';
import { useMailings, useSendMailing, useSendTestMailing, useSendToNewParticipants } from '../../../hooks/useMailings';
import type { Mailing } from '@stage/shared';
import { getFilterLabel, formatDateTime } from '../shared-helpers';
import { sharedStyles } from '../shared-styles';
import { EyeIcon, SendIcon, MailEmptyIcon } from '../shared-icons';
import { CreateMailingModal } from './CreateMailingModal';
import { EditMailingModal } from './EditMailingModal';

function TestMailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 4.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="4" r="2.5" fill="var(--color-accent)" stroke="var(--color-bg-card)" strokeWidth="1" />
    </svg>
  );
}

function SendToNewIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 3l7 5 7-5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M12 9v4m-2-2h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M11.5 1.5l3 3-9 9H2.5v-3l9-9z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MailingsTab({ eventId }: { eventId: number }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingMailing, setEditingMailing] = useState<Mailing | null>(null);
  const [previewMailing, setPreviewMailing] = useState<Mailing | null>(null);
  const { data: mailings, isLoading } = useMailings(eventId);
  const sendMailing = useSendMailing(eventId);
  const sendTestMailing = useSendTestMailing(eventId);
  const sendToNew = useSendToNewParticipants(eventId);
  const { toast } = useToast();

  function handleSendTest(mailing: Mailing) {
    sendTestMailing.mutate(mailing.id, {
      onSuccess: (result) => {
        toast(`Testmail skickat till ${result.sentTo}`, 'success');
      },
      onError: () => toast('Kunde inte skicka testmail', 'error'),
    });
  }

  function handleSendToNew(mailing: Mailing) {
    sendToNew.mutate(mailing.id, {
      onSuccess: (result) => {
        if (result.total === 0) {
          toast('Inga nya mottagare', 'info');
        } else if (result.failed > 0) {
          toast(`Skickat till ${result.sent}/${result.total} nya (${result.failed} misslyckades)`, 'error');
        } else {
          toast(`Skickat till ${result.total} nya mottagare`, 'success');
        }
      },
      onError: () => toast('Kunde inte skicka till nya', 'error'),
    });
  }

  function handleSend(mailing: Mailing) {
    sendMailing.mutate(mailing.id, {
      onSuccess: (result) => {
        if (result.failed > 0) {
          toast(`Skickat till ${result.sent}/${result.total} (${result.failed} misslyckades)`, 'error');
        } else {
          toast(`Utskickat till ${result.sent} mottagare`, 'success');
        }
        setPreviewMailing(null);
      },
      onError: () => toast('Kunde inte skicka utskicket', 'error'),
    });
  }

  if (isLoading) {
    return (
      <div style={sharedStyles.emptyTab}>
        <p style={sharedStyles.emptyText}>Laddar utskick...</p>
      </div>
    );
  }

  if (!mailings || mailings.length === 0) {
    return (
      <>
        <div style={sharedStyles.emptyTab}>
          <MailEmptyIcon />
          <h3 style={sharedStyles.emptyTitle}>Inga utskick ännu</h3>
          <p style={sharedStyles.emptyText}>Skapa mailutskick för att nå dina deltagare.</p>
          <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
            + Nytt utskick
          </Button>
        </div>
        <CreateMailingModal eventId={eventId} open={showCreateModal} onClose={() => setShowCreateModal(false)} />
      </>
    );
  }

  return (
    <div>
      <div style={sharedStyles.header}>
        <span style={sharedStyles.headerCount}>{mailings.length} utskick</span>
        <Button variant="primary" size="sm" onClick={() => setShowCreateModal(true)}>
          + Nytt utskick
        </Button>
      </div>

      <div style={sharedStyles.tableWrapper}>
        <table style={sharedStyles.table}>
          <thead>
            <tr>
              <th style={sharedStyles.th}>Ämne</th>
              <th style={sharedStyles.th}>Mottagare</th>
              <th style={sharedStyles.th}>Status</th>
              <th style={sharedStyles.th}>Skapad</th>
              <th style={{ ...sharedStyles.th, width: '120px' }}></th>
            </tr>
          </thead>
          <tbody>
            {mailings.map((m) => (
              <tr key={m.id} style={sharedStyles.tr}>
                <td style={sharedStyles.td}>
                  <span style={sharedStyles.participantName}>{m.subject}</span>
                </td>
                <td style={sharedStyles.td}>
                  <span style={sharedStyles.categoryTag}>{getFilterLabel(m.recipient_filter)}</span>
                </td>
                <td style={sharedStyles.td}>
                  <Badge variant={m.status === 'sent' ? 'success' : 'muted'}>
                    {m.status === 'sent' ? 'Skickat' : 'Utkast'}
                  </Badge>
                </td>
                <td style={sharedStyles.td}>
                  <span style={sharedStyles.categoryTag}>{formatDateTime(m.created_at)}</span>
                </td>
                <td style={sharedStyles.td}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                    {m.status === 'draft' && (
                      <button
                        onClick={() => setEditingMailing(m)}
                        style={sharedStyles.actionBtn}
                        title="Redigera"
                      >
                        <EditIcon />
                      </button>
                    )}
                    <button onClick={() => setPreviewMailing(m)} style={sharedStyles.actionBtn} title="Förhandsgranska">
                      <EyeIcon />
                    </button>
                    <button
                      onClick={() => handleSendTest(m)}
                      style={sharedStyles.actionBtn}
                      title="Skicka testmail till mig"
                      disabled={sendTestMailing.isPending}
                    >
                      <TestMailIcon />
                    </button>
                    {m.status === 'draft' && (
                      <button
                        onClick={() => handleSend(m)}
                        style={{ ...sharedStyles.actionBtn, color: 'var(--color-accent)' }}
                        title="Skicka"
                        disabled={sendMailing.isPending}
                      >
                        <SendIcon />
                      </button>
                    )}
                    {m.status === 'sent' && (
                      <button
                        onClick={() => handleSendToNew(m)}
                        style={{ ...sharedStyles.actionBtn, color: 'var(--color-accent)' }}
                        title="Skicka till nya deltagare"
                        disabled={sendToNew.isPending}
                      >
                        <SendToNewIcon />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateMailingModal eventId={eventId} open={showCreateModal} onClose={() => setShowCreateModal(false)} />

      {editingMailing && (
        <EditMailingModal
          eventId={eventId}
          mailing={editingMailing}
          open={!!editingMailing}
          onClose={() => setEditingMailing(null)}
        />
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewMailing}
        onClose={() => setPreviewMailing(null)}
        title={previewMailing?.subject ?? 'Förhandsgranskning'}
        footer={
          <>
            <Button variant="secondary" size="md" onClick={() => setPreviewMailing(null)}>Stäng</Button>
            {previewMailing?.status === 'draft' && (
              <Button variant="primary" size="md" onClick={() => previewMailing && handleSend(previewMailing)} loading={sendMailing.isPending}>
                Skicka utskick
              </Button>
            )}
          </>
        }
      >
        {previewMailing && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span style={sharedStyles.detailLabel}>Mottagare</span>
              <span style={sharedStyles.detailValue}>{getFilterLabel(previewMailing.recipient_filter)}</span>
            </div>
            <div>
              <span style={sharedStyles.detailLabel}>Status</span>
              <Badge variant={previewMailing.status === 'sent' ? 'success' : 'muted'}>
                {previewMailing.status === 'sent' ? 'Skickat' : 'Utkast'}
              </Badge>
              {previewMailing.sent_at && (
                <span style={{ ...sharedStyles.categoryTag, marginLeft: '8px' }}>
                  {formatDateTime(previewMailing.sent_at)}
                </span>
              )}
            </div>
            <div>
              <span style={sharedStyles.detailLabel}>Meddelande</span>
              <div style={{
                padding: '12px',
                backgroundColor: 'var(--color-bg-primary)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                lineHeight: 'var(--line-height-relaxed)',
                color: 'var(--color-text-primary)',
                whiteSpace: 'pre-wrap',
              }}>
                {previewMailing.body}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
