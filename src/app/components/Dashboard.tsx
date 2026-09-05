import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, CheckCircle2, Phone, RefreshCw } from 'lucide-react';
import { getLeads, getAppointments, getCurrentUser, getStatusOptions, type Lead, type Appointment } from '../utils/storage';
import { leadCategory } from '../utils/stages';
import { LoadError } from './LoadError';
import { qualityOf, localDayKey, timestamp } from '../utils/leadQuality';
import { Card, PageHeader, StatusBadge, Button, EmptyState, SEITEN_RAND } from './ui-kit';

export function Dashboard({ onOpenKalender, onOpenLead, onOpenLeads }: { onOpenKalender?: () => void; onOpenLead?: (id: string) => void; onOpenLeads?: () => void } = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState(false);
  const [scope, setScope] = useState<'mine' | 'team'>('mine');
  const today = localDayKey(new Date());
  const user = getCurrentUser();
  async function load() {
    setBusy(true); setError(false);
    try {
      const [rows, events] = await Promise.all([getLeads(), getAppointments({ from: today + 'T00:00', to: today + 'T23:59' })]);
      setLeads(rows); setAppointments(events.filter((a) => !['cancelled', 'declined'].includes(a.status)));
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  useEffect(() => { void load(); }, []);
  const active = leads.filter((lead) => leadCategory(lead) === 'open');
  const working = scope === 'mine' ? active.filter((lead) => lead.assignedTo?.toLowerCase() === user?.username.toLowerCase()) : active;
  const due = working.filter((lead) => lead.nextFollowUpDate && lead.nextFollowUpDate.slice(0, 10) <= today)
    .sort((a, b) => (a.nextFollowUpDate || '').localeCompare(b.nextFollowUpDate || '') || a.company.localeCompare(b.company));
  const unassigned = active.filter((lead) => !lead.assignedTo);
  const missingNext = working.filter((lead) => !lead.nextFollowUpDate);
  const qualityIssues = active.filter((lead) => qualityOf(lead).missing.length > 0);
  const queue = [...due, ...missingNext.filter((lead) => !due.includes(lead)).sort((a, b) => timestamp(a.updatedAt) - timestamp(b.updatedAt))].slice(0, 8);
  const scopedAppointments = appointments.filter((a) => scope === 'team' || a.assignee_id === user?.id).sort((a, b) => a.start_at.localeCompare(b.start_at));
  const stages = getStatusOptions();

  if (error) return <div className={SEITEN_RAND + ' space-y-5'}><PageHeader title="Arbeitsübersicht" subtitle="Deine tägliche Vertriebsarbeit" /><LoadError message="Die Arbeitsübersicht konnte nicht vollständig geladen werden." onRetry={() => void load()} /></div>;
  return <div className={SEITEN_RAND + ' space-y-6'}>
    <PageHeader title="Arbeitsübersicht" subtitle={new Intl.DateTimeFormat('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
      actions={<div className="flex items-center gap-2"><div className="flex rounded-md border border-border-subtle bg-surface p-1">{(['mine', 'team'] as const).map((value) => <button key={value} onClick={() => setScope(value)} aria-pressed={scope === value} className={'rounded px-3 py-1.5 text-sm ' + (scope === value ? 'bg-elevated font-medium text-text-primary' : 'text-text-secondary')}>{value === 'mine' ? 'Meine Arbeit' : 'Gesamtes Team'}</button>)}</div><Button variant="secondary" onClick={() => void load()} disabled={busy} aria-label="Arbeitsübersicht aktualisieren"><RefreshCw className="size-4" /></Button></div>} />
    {error && <LoadError message="Die Arbeitsübersicht konnte nicht vollständig geladen werden." onRetry={() => void load()} />}
    <div className="grid grid-cols-2 gap-y-5 py-2 lg:grid-cols-4">
      {[{ label: 'Offene Leads', value: working.length }, { label: 'Wiedervorlagen fällig', value: due.length }, { label: 'Ohne nächsten Schritt', value: missingNext.length }, { label: 'Noch nicht zugewiesen', value: unassigned.length }].map((item) => <div className="crm-metric" key={item.label}><div className="text-sm text-text-secondary">{item.label}</div><div className="mt-2 text-3xl font-semibold tabular-nums">{busy || error ? '—' : item.value}</div></div>)}
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <Card className="overflow-hidden"><div className="flex items-center justify-between px-5 py-4"><div><h2 className="font-semibold">Nächste Schritte</h2><p className="mt-1 text-sm text-text-muted">Fällige Wiedervorlagen zuerst, danach Leads ohne Termin.</p></div><Button variant="ghost" size="sm" onClick={onOpenLeads}>Alle Leads <ArrowRight className="size-4" /></Button></div>
        {busy ? <p className="p-5 text-sm text-text-muted" role="status">Arbeitsliste wird geladen…</p> : queue.length ? queue.map((lead) => <button key={lead.id} className="crm-work-row" onClick={() => onOpenLead?.(lead.id)}><span><span className="block font-medium">{lead.company}</span><span className="mt-1 block text-sm text-text-muted">{lead.contactPerson || 'Ansprechpartner ergänzen'}</span></span><span><StatusBadge status={lead.status} /><span className="mt-1 block text-xs text-text-muted">{lead.assignedTo || 'Nicht zugewiesen'}</span></span><span className={'text-sm ' + (lead.nextFollowUpDate ? 'text-status-warning' : 'text-text-secondary')}>{lead.nextFollowUpDate ? new Date(lead.nextFollowUpDate).toLocaleDateString('de-DE') : 'Nächsten Schritt planen'}</span></button>) : !error && <EmptyState icon={<CheckCircle2 className="size-5" />} title={scope === 'mine' && !working.length ? 'Keine offenen Leads zugewiesen' : 'Keine offenen Wiedervorlagen'} description="In der Leadliste findest du den vollständigen Bestand und die Zuständigkeiten." />}
      </Card>
      <Card className="overflow-hidden"><div className="flex items-center justify-between px-5 py-4"><h2 className="font-semibold">Termine heute</h2><Button variant="ghost" size="sm" onClick={onOpenKalender}><CalendarDays className="size-4" /> Kalender</Button></div>
        {scopedAppointments.length ? scopedAppointments.map((a) => <button className="flex w-full items-start gap-4 border-t border-border-subtle px-5 py-4 text-left hover:bg-elevated" key={a.id} onClick={() => a.company_id && onOpenLead ? onOpenLead(a.company_id) : onOpenKalender?.()}><span className="font-medium tabular-nums text-accent-500">{new Date(a.start_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span><span className="min-w-0"><span className="block truncate font-medium">{a.customer_name || a.title}</span><span className="mt-1 block text-sm text-text-muted">{a.duration_minutes} Min. · {a.assignee_name || 'Ohne Zuständigkeit'}</span></span></button>) : !error && <EmptyState icon={<CalendarDays className="size-5" />} title="Keine Termine für heute" description="Termine, Einladungen und Rückrufe zentral im Kalender planen." />}
      </Card>
    </div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(300px,1fr)]">
      <Card className="p-4"><h2 className="font-semibold">Pipeline-Bestand</h2><p className="mt-1 text-sm text-text-muted">Aktuelle Verteilung aller Leads. Keine historische Conversion-Rate.</p><div className="mt-5 space-y-3">{stages.map((stage) => { const count = leads.filter((l) => l.status === stage).length; return <div className="grid grid-cols-[120px_1fr_40px] items-center gap-3 text-sm" key={stage}><span className="truncate text-text-secondary">{stage}</span><span className="h-2 overflow-hidden rounded bg-elevated"><span className="block h-full rounded bg-accent-500/70" style={{ width: (leads.length ? count / leads.length * 100 : 0) + '%' }} /></span><span className="text-right tabular-nums">{count}</span></div>; })}</div></Card>
      <Card className="p-4"><h2 className="font-semibold">Datenqualität</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{qualityIssues.length} offene Leads haben Lücken in den Basisdaten. Erfasste Daten bedeuten noch keine verifizierten Kontakte.</p><div className="my-5 space-y-3 text-sm"><p className="flex justify-between"><span>Ohne erreichbaren Kontakt</span><strong>{active.filter((lead) => !qualityOf(lead).contactable).length}</strong></p><p className="flex justify-between"><span>Ohne Händlerart</span><strong>{active.filter((lead) => !lead.dealerType).length}</strong></p><p className="flex justify-between"><span>Ohne Ansprechpartner</span><strong>{active.filter((lead) => !lead.contactPerson?.trim()).length}</strong></p></div><Button variant="secondary" onClick={onOpenLeads}><Phone className="size-4" /> Leads qualifizieren</Button></Card>
    </div>
  </div>;
}
