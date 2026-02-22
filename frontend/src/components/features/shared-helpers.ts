/** Shared helper functions used across feature components */

export function getCategoryLabel(category: string): string {
  const map: Record<string, string> = {
    internal: 'Intern', public_sector: 'Offentlig sektor',
    private_sector: 'Privat sektor', partner: 'Partner', other: 'Övrig',
  };
  return map[category] || category;
}

export function getParticipantStatusLabel(status: string): string {
  const map: Record<string, string> = {
    invited: 'Inbjuden', attending: 'Deltar', declined: 'Avböjd',
    waitlisted: 'Väntelista', cancelled: 'Avbokad',
  };
  return map[status] || status;
}

export function getParticipantStatusVariant(status: string) {
  switch (status) {
    case 'attending': return 'success' as const;
    case 'declined': return 'danger' as const;
    case 'cancelled': return 'danger' as const;
    case 'waitlisted': return 'warning' as const;
    default: return 'muted' as const;
  }
}

export function getFilterLabel(filter: string): string {
  const map: Record<string, string> = {
    all: 'Alla', invited: 'Inbjudna', attending: 'Deltar',
    declined: 'Avböjda', waitlisted: 'Väntelista', cancelled: 'Avbokade',
    internal: 'Interna', public_sector: 'Offentlig sektor',
    private_sector: 'Privat sektor', partner: 'Partners', other: 'Övriga',
  };
  return map[filter] || filter;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export function formatDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  return d.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' }) +
    ' ' + d.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'planning': return { variant: 'muted' as const, label: 'Planering' };
    case 'upcoming': return { variant: 'default' as const, label: 'Kommande' };
    case 'ongoing': return { variant: 'success' as const, label: 'Pågår' };
    case 'completed': return { variant: 'muted' as const, label: 'Avslutad' };
    case 'cancelled': return { variant: 'danger' as const, label: 'Inställd' };
    default: return { variant: 'muted' as const, label: status };
  }
}

export function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    conference: 'Konferens', workshop: 'Workshop', seminar: 'Seminarium',
    networking: 'Networking', internal: 'Internt', other: 'Övrigt',
  };
  return map[type] || type;
}
