import { useState } from 'react';
import { Badge, Button, Modal, useToast } from '../../ui';
import { useMailings, useSendMailing, useSendTestMailing } from '../../../hooks/useMailings';
import type { Mailing } from '@stage/shared';
import { getFilterLabel, formatDateTime } from '../shared-helpers';
import { sharedStyles } from '../shared-styles';
import { EyeIcon, SendIcon, MailEmptyIcon } from '../shared-icons';
import { CreateMailingModal } from './CreateMailingModal';

function TestMailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 4.5l7 4.5 7-4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12.5" cy="4" r="2.5" fill="var(--color-accent)" stroke="var(--color-bg-card)" strokeWidth="1" />
    </svg>
  );
}

export function MailingsTab({ eventId }: { eventId: number }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [previewMailing, setPreviewMailing] = useState<Mailing | null>(null);
  const { data: mailings, isLoading } = useMailings(eventId);
  const sendMailing = useSendMailing(eventId);
  const sendTestMailing = useSendTestMailing(eventId);
  const { toast } = useToast();

  function handleSendTest(mailing: Mailing) {
    sendTestMailing.mutate(mailing.id, {
      onSuccess: (result) => {
        toast(`Testmail skickat till ${result.sentTo}`, 'success');
      },
      onError: () => toast('Kunde inte skicka testmail', 'error'),
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateMailingModal eventId={eventId} open={showCreateModal} onClose={() => setShowCreateModal(false)} />

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
