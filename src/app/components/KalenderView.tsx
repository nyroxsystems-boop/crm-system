/**
 * KalenderView — Quali- & Sales-Termine im CRM.
 *
 * Gleiche Daten wie im Admin-Dashboard (Bot /api/crm/appointments). Calendly-
 * artiger Flow: Termin anlegen → Kunde bekommt E-Mail-Einladung (+ .ics +
 * Bestätigungs-Link) → bestätigt selbst → Status springt auf „Bestätigt".
 */
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { KALENDER_ZELLE } from './dichte';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Loader2, Clock, User, Mail, Phone,
  MapPin, Check, RotateCcw, CalendarCheck, CalendarX, Link2, CheckCircle2, Ban, MoreHorizontal, ExternalLink, Trash2,
} from 'lucide-react';
import {
  getAppointments, getAppointmentAdmins, createAppointment, updateAppointment, cancelAppointment, deleteAppointment,
  getCurrentUser, type Appointment, type AppointmentAdmin, type AppointmentInput, type AppointmentStatus,
} from '../utils/storage';
import {
  PageHeader, Card, Button, IconButton, Field, Modal, inputSized, EmptyState, cn, SEITEN_RAND,
} from './ui-kit';

const TYPE_META: Record<string, { label: string; chip: string }> = {
  quali: { label: 'Quali', chip: 'bg-violet-500/15 text-violet-300 hell:text-violet-700 border-violet-500/30' },
  sales: { label: 'Sales', chip: 'bg-sky-500/15 text-sky-300 hell:text-sky-700 border-sky-500/30' },
  call: { label: 'Rückruf', chip: 'bg-emerald-500/15 text-emerald-300 hell:text-emerald-700 border-emerald-500/30' },
  other: { label: 'Termin', chip: 'bg-slate-500/15 text-slate-300 hell:text-slate-700 border-slate-500/30' },
};
const STATUS_META: Record<string, { label: string; cls: string }> = {
  proposed: { label: 'Vorgeschlagen', cls: 'bg-amber-500/15 text-amber-300 hell:text-amber-800 border-amber-500/30' },
  confirmed: { label: 'Bestätigt', cls: 'bg-emerald-500/15 text-emerald-300 hell:text-emerald-700 border-emerald-500/30' },
  declined: { label: 'Abgelehnt', cls: 'bg-rose-500/15 text-rose-300 hell:text-rose-700 border-rose-500/30' },
  cancelled: { label: 'Abgesagt', cls: 'bg-slate-500/15 text-slate-400 hell:text-slate-700 border-slate-500/30' },
  completed: { label: 'Erledigt', cls: 'bg-blue-500/15 text-blue-300 hell:text-blue-700 border-blue-500/30' },
  no_show: { label: 'Nicht erschienen', cls: 'bg-orange-500/15 text-orange-300 hell:text-orange-800 border-orange-500/30' },
};
const DURATIONS = [15, 30, 45, 60, 90, 120];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WD = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const pad = (n: number) => String(n).padStart(2, '0');
const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const timeOf = (iso: string) => { const m = iso.match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : ''; };
const dayKeyOf = (iso: string) => iso.slice(0, 10);

function buildGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
}

type FormState = AppointmentInput & { date?: string; time?: string };
const emptyForm = (): FormState => ({ type: 'sales', durationMinutes: 30, sendInvite: true, date: '', time: '10:00' });

export function KalenderView({ onOpenLead }: { onOpenLead?: (leadId: string) => void } = {}) {
  const currentUser = getCurrentUser();
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [admins, setAdmins] = useState<AppointmentAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectedDay, setSelectedDay] = useState<string>(() => toKey(new Date()));
  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [detail, setDetail] = useState<Appointment | null>(null);

  const grid = useMemo(() => buildGrid(cursor), [cursor]);
  const todayKey = toKey(new Date());
  const myAdminId = useMemo(
    () => admins.find((a) => a.username?.toLowerCase() === currentUser?.username?.toLowerCase())?.id || null,
    [admins, currentUser],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = `${toKey(grid[0])}T00:00`;
      const to = `${toKey(grid[grid.length - 1])}T23:59`;
      const params: { from: string; to: string; assigneeId?: string } = { from, to };
      if (assigneeFilter === 'mine' && myAdminId) params.assigneeId = myAdminId;
      else if (assigneeFilter !== 'all' && assigneeFilter !== 'mine') params.assigneeId = assigneeFilter;
      setAppointments(await getAppointments(params));
    } catch {
      toast.error('Termine konnten nicht geladen werden.');
    } finally {
      setLoading(false);
    }
  }, [grid, assigneeFilter, myAdminId]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { getAppointmentAdmins().then(setAdmins).catch(() => undefined); }, []);

  const byDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const a of appointments) (map[dayKeyOf(a.start_at)] ||= []).push(a);
    Object.values(map).forEach((l) => l.sort((x, y) => x.start_at.localeCompare(y.start_at)));
    return map;
  }, [appointments]);
  const selectedList = byDay[selectedDay] || [];
  const selDate = new Date(`${selectedDay}T00:00`);

  function openCreate(dayKey?: string) {
    setEditingId(null);
    setForm({ ...emptyForm(), date: dayKey || selectedDay || todayKey });
    setCreateOpen(true);
  }
  function openEdit(a: Appointment) {
    setEditingId(a.id);
    setForm({
      type: a.type as AppointmentInput['type'], title: a.title, notes: a.notes || '',
      assigneeId: a.assignee_id || undefined, customerName: a.customer_name || '', customerEmail: a.customer_email || '',
      customerPhone: a.customer_phone || '', durationMinutes: a.duration_minutes, location: a.location || '',
      meetingLink: a.meeting_link || '', sendInvite: false, date: dayKeyOf(a.start_at), time: timeOf(a.start_at),
    });
    setDetail(null);
    setCreateOpen(true);
  }

  async function submitForm() {
    if (!form.date || !form.time) { toast.error('Bitte Datum und Uhrzeit angeben.'); return; }
    const payload: AppointmentInput = {
      type: form.type, title: form.title?.trim() || undefined, notes: form.notes, assigneeId: form.assigneeId,
      customerName: form.customerName, customerEmail: form.customerEmail, customerPhone: form.customerPhone,
      durationMinutes: form.durationMinutes, location: form.location, meetingLink: form.meetingLink,
      start: `${form.date}T${form.time}`, sendInvite: form.sendInvite,
    };
    setSaving(true);
    try {
      if (editingId) {
        const res = await updateAppointment(editingId, { ...payload, resendInvite: form.sendInvite });
        if (res.calendarError) toast.warning(`Termin gespeichert, Teams-Synchronisierung ausstehend: ${res.calendarError}`);
        else toast.success(res.inviteSent ? 'Termin aktualisiert · Teams und Einladung aktualisiert.' : 'Termin aktualisiert.');
        if (res.calendarDecision && !res.calendarDecision.eligible) toast.info('Kein Teams-Termin: In den internen Notizen wurde kein eindeutiger digitaler Kundentermin erkannt.');
      } else {
        const res = await createAppointment(payload);
        if (res.calendarError) toast.warning(`Termin angelegt, Teams-Synchronisierung ausstehend: ${res.calendarError}`);
        else if (res.inviteSent) toast.success(res.calendarSynced ? 'Termin und Teams-Call angelegt · Einladung verschickt.' : 'Termin angelegt · Einladung an den Kunden verschickt.');
        else if (form.sendInvite && form.customerEmail) toast.warning(`Termin angelegt, E-Mail nicht versendet: ${res.inviteError || 'unbekannt'}`);
        else toast.success('Termin angelegt.');
        if (res.calendarDecision && !res.calendarDecision.eligible) toast.info('Bewusst ohne Teams angelegt: kein eindeutiger digitaler Kundentermin erkannt.');
      }
      setCreateOpen(false);
      setSelectedDay(form.date!);
      await load();
    } catch (e) {
      toast.error((e as Error)?.message || 'Speichern fehlgeschlagen.');
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(a: Appointment, status: AppointmentStatus) {
    try { await updateAppointment(a.id, { status }); toast.success(`Status: ${STATUS_META[status]?.label || status}`); setDetail(null); await load(); }
    catch { toast.error('Status konnte nicht gesetzt werden.'); }
  }
  async function doCancel(a: Appointment) {
    if (!confirm('Termin wirklich absagen? Der Kunde wird per E-Mail informiert.')) return;
    try { await cancelAppointment(a.id); toast.success('Termin abgesagt.'); setDetail(null); await load(); }
    catch { toast.error('Absagen fehlgeschlagen.'); }
  }
  async function doDelete(a: Appointment) {
    if (!confirm('Termin endgültig löschen? Das kann nicht rückgängig gemacht werden.')) return;
    try { await deleteAppointment(a.id); toast.success('Termin gelöscht.'); setDetail(null); await load(); }
    catch { toast.error('Löschen fehlgeschlagen.'); }
  }
  async function resend(a: Appointment) {
    try { const r = await updateAppointment(a.id, { resendInvite: true }); toast.success(r.inviteSent ? 'Einladung erneut verschickt.' : 'Konnte nicht senden.'); await load(); }
    catch { toast.error('Erneutes Senden fehlgeschlagen.'); }
  }
  function copyLink(a: Appointment) {
    if (!a.public_token) return;
    navigator.clipboard?.writeText(`https://partsunion.de/termin?t=${a.public_token}`).then(() => toast.success('Bestätigungs-Link kopiert.')).catch(() => undefined);
  }

  return (
    <div className={cn(SEITEN_RAND, 'space-y-5')}>
      <PageHeader
        title="Kalender"
        subtitle="Quali- & Sales-Termine planen, einladen und nachhalten."
        actions={
          <div className="flex items-center gap-2">
            <select value={assigneeFilter} onChange={(e) => setAssigneeFilter(e.target.value)} className={cn(inputSized, 'w-[180px]')}>
              <option value="all">Alle Zuständigen</option>
              {myAdminId && <option value="mine">Meine Termine</option>}
              {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <Button onClick={() => openCreate()}><Plus className="size-4" /> Neuer Termin</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* Gitter */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div className="text-lg font-semibold text-text-primary">{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>Heute</Button>
              <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}><ChevronLeft className="size-4" /></Button>
              <Button variant="ghost" size="sm" onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}><ChevronRight className="size-4" /></Button>
              {loading && <Loader2 className="ml-1 size-4 animate-spin text-text-muted" />}
            </div>
          </div>
          <div className="grid grid-cols-7 border-b border-border-subtle text-center text-xs font-medium text-text-muted">
            {WD.map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7">
            {grid.map((d, i) => {
              const k = toKey(d);
              const inMonth = d.getMonth() === cursor.getMonth();
              const list = byDay[k] || [];
              const isToday = k === todayKey;
              const isSel = k === selectedDay;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(k)}
                  onDoubleClick={() => openCreate(k)}
                  className={cn(
                    'border-b border-r border-border-subtle p-1.5 text-left align-top transition-colors', KALENDER_ZELLE,
                    i % 7 === 6 && 'border-r-0',
                    inMonth ? 'bg-transparent' : 'bg-canvas/50 text-text-muted',
                    isSel ? 'ring-2 ring-inset ring-accent-500/60' : 'hover:bg-elevated',
                  )}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className={cn('inline-flex size-6 items-center justify-center rounded-full text-xs', isToday && 'bg-accent-500 font-semibold text-white')}>{d.getDate()}</span>
                    {list.length > 0 && <span className="text-[10px] text-text-muted">{list.length}</span>}
                  </div>
                  <div className="space-y-1">
                    {list.slice(0, 3).map((a) => {
                      const tm = TYPE_META[a.type] || TYPE_META.other;
                      return (
                        <div key={a.id} className={cn('truncate rounded border px-1 py-0.5 text-[10px] leading-tight', tm.chip, a.status === 'cancelled' && 'line-through opacity-60')}>
                          <span className="font-medium">{timeOf(a.start_at)}</span> {a.customer_name || a.title}
                        </div>
                      );
                    })}
                    {list.length > 3 && <div className="px-1 text-[10px] text-text-muted">+{list.length - 3} mehr</div>}
                  </div>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Tages-Panel */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-text-primary">{WD[(selDate.getDay() + 6) % 7]}, {selDate.getDate()}. {MONTHS[selDate.getMonth()]}</div>
              <div className="text-xs text-text-muted">{selectedList.length} Termin{selectedList.length === 1 ? '' : 'e'}</div>
            </div>
            <Button size="sm" variant="outline" onClick={() => openCreate(selectedDay)}><Plus className="size-4" /> Termin</Button>
          </div>
          <div className="max-h-[560px] space-y-2 overflow-auto p-3">
            {selectedList.length === 0 ? (
              <div className="py-8"><EmptyState icon={<CalendarIcon className="size-5" />} title="Keine Termine" description="An diesem Tag ist nichts geplant." /></div>
            ) : selectedList.map((a) => {
              const tm = TYPE_META[a.type] || TYPE_META.other;
              const sm = STATUS_META[a.status] || STATUS_META.proposed;
              return (
                <div
                  key={a.id}
                  role="button"
                  tabIndex={0}
                  // Verknüpfte Termine (Rückrufe aus der Lead-Maske) springen direkt
                  // zum Lead — der Kalender bleibt reine Übersicht. Details/Verschieben
                  // weiterhin über das ⋯-Icon rechts.
                  onClick={() => (a.company_id && onOpenLead ? onOpenLead(a.company_id) : setDetail(a))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (a.company_id && onOpenLead) onOpenLead(a.company_id); else setDetail(a);
                    }
                  }}
                  className="w-full cursor-pointer rounded-md border border-border-subtle bg-canvas p-3 text-left transition-colors hover:bg-elevated"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-text-primary"><Clock className="size-3.5 text-text-muted" />{timeOf(a.start_at)}–{timeOf(a.end_at)}</span>
                    <span className="flex items-center gap-0.5">
                      <span className={cn('mr-1 rounded-full border px-2 py-0.5 text-[10px] font-medium', sm.cls)}>{sm.label}</span>
                      {a.company_id && onOpenLead && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDetail(a); }}
                          className="rounded p-0.5 text-text-muted transition-colors hover:bg-elevated hover:text-text-primary"
                          title="Termin-Details / verschieben"
                          aria-label="Termin-Details"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); void doDelete(a); }}
                        className="rounded p-0.5 text-text-muted transition-colors hover:bg-status-danger/15 hover:text-status-danger"
                        title="Termin löschen"
                        aria-label="Termin löschen"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </span>
                  </div>
                  <div className="mt-1.5 truncate text-sm font-medium text-text-primary">{a.customer_name || a.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
                    <span className={cn('rounded border px-1.5 py-0.5 text-[10px]', tm.chip)}>{tm.label}</span>
                    {a.assignee_name && <span className="inline-flex items-center gap-1"><User className="size-3" />{a.assignee_name}</span>}
                    {a.customer_phone && (
                      <a
                        href={`tel:${a.customer_phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-accent-500 hover:text-accent-500"
                      >
                        <Phone className="size-3" />{a.customer_phone}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Create / Edit */}
      {createOpen && (
        <Modal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          title={editingId ? 'Termin bearbeiten' : 'Neuer Termin'}
          subtitle="Mit Kunden-E-Mail wird automatisch eine Einladung verschickt."
          size="md"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>Abbrechen</Button>
              <Button onClick={submitForm} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : (editingId ? <Check className="size-4" /> : <Plus className="size-4" />)}
                {editingId ? 'Speichern' : 'Anlegen'}
              </Button>
            </div>
          }
        >
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Art">
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as AppointmentInput['type'] }))} className={inputSized}>
                  <option value="quali">Quali-Call</option>
                  <option value="sales">Sales-Call</option>
                  <option value="call">Anruf / Rückruf</option>
                  <option value="other">Sonstiger Termin</option>
                </select>
              </Field>
              <Field label="Zuständig">
                <select value={form.assigneeId || ''} onChange={(e) => setForm((f) => ({ ...f, assigneeId: e.target.value || undefined }))} className={inputSized}>
                  <option value="">— Niemand —</option>
                  {admins.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-[1fr_auto_auto] gap-3">
              <Field label="Datum"><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className={inputSized} /></Field>
              <Field label="Uhrzeit"><input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} className={cn(inputSized, 'w-[120px]')} /></Field>
              <Field label="Dauer">
                <select value={String(form.durationMinutes)} onChange={(e) => setForm((f) => ({ ...f, durationMinutes: Number(e.target.value) }))} className={cn(inputSized, 'w-[110px]')}>
                  {DURATIONS.map((d) => <option key={d} value={d}>{d} Min.</option>)}
                </select>
              </Field>
            </div>
            <Field label="Titel (optional)"><input value={form.title || ''} placeholder="z. B. Erstgespräch Werkstatt Müller" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={inputSized} /></Field>
            <div className="border-t border-border-subtle pt-3 text-xs font-medium uppercase tracking-wide text-text-muted">Kunde</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><input value={form.customerName || ''} placeholder="Firma / Ansprechpartner" onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} className={inputSized} /></Field>
              <Field label="Telefon"><input value={form.customerPhone || ''} placeholder="+49 …" onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} className={inputSized} /></Field>
            </div>
            <Field label="E-Mail (für die Einladung)"><input type="email" value={form.customerEmail || ''} placeholder="kunde@firma.de" onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))} className={inputSized} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ort"><input value={form.location || ''} placeholder="Telefon / vor Ort" onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} className={inputSized} /></Field>
              <Field label="Meeting-Link"><input value={form.meetingLink || ''} placeholder="https://meet…" onChange={(e) => setForm((f) => ({ ...f, meetingLink: e.target.value }))} className={inputSized} /></Field>
            </div>
            <Field label="Notizen (steuern Teams automatisch)">
              <textarea rows={2} value={form.notes || ''} placeholder="z. B. Teams-Beratung / vor Ort / telefonischer Rückruf" onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className={cn(inputSized, 'h-auto py-2')} />
              <p className="mt-1 text-xs text-text-muted">Der Terminmanager liest diese internen Notizen. Digitale Quali-/Sales-Termine erhalten automatisch einen Teams-Link; vor Ort, Telefon und interne Blöcke nicht.</p>
            </Field>
            <label className="flex items-center gap-2 rounded-md border border-border-subtle bg-canvas p-2.5 text-sm text-text-secondary">
              <input type="checkbox" checked={!!form.sendInvite} onChange={(e) => setForm((f) => ({ ...f, sendInvite: e.target.checked }))} className="size-4 accent-accent-500" />
              <Mail className="size-4 text-text-muted" />
              {editingId ? 'Neue Einladung per E-Mail senden' : 'Einladung per E-Mail an den Kunden senden'}
            </label>
          </div>
        </Modal>
      )}

      {/* Detail */}
      {detail && (() => {
        const tm = TYPE_META[detail.type] || TYPE_META.other;
        const sm = STATUS_META[detail.status] || STATUS_META.proposed;
        return (
          <Modal
            open={!!detail}
            onClose={() => setDetail(null)}
            title={
              <span className="flex items-center gap-2">
                <span className={cn('rounded border px-1.5 py-0.5 text-[11px]', tm.chip)}>{tm.label}</span>
                {detail.customer_name || detail.title}
              </span>
            }
            subtitle={<span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-medium', sm.cls)}>{sm.label}</span>}
            size="sm"
            footer={
              <div className="flex flex-wrap justify-end gap-2">
                {detail.company_id && onOpenLead && (
                  <Button size="sm" variant="outline" onClick={() => { setDetail(null); onOpenLead(detail.company_id!); }}>
                    <ExternalLink className="size-4" /> Lead öffnen
                  </Button>
                )}
                {detail.status !== 'confirmed' && detail.status !== 'cancelled' && <Button size="sm" onClick={() => setStatus(detail, 'confirmed')}><CalendarCheck className="size-4" /> Bestätigen</Button>}
                <Button size="sm" variant="outline" onClick={() => openEdit(detail)}><RotateCcw className="size-4" /> Verschieben</Button>
                {detail.public_token && <Button size="sm" variant="outline" onClick={() => copyLink(detail)}><Link2 className="size-4" /> Link</Button>}
                {detail.customer_email && detail.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => resend(detail)}><Mail className="size-4" /> Erneut einladen</Button>}
                {detail.status !== 'completed' && detail.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => setStatus(detail, 'completed')}><CheckCircle2 className="size-4" /> Erledigt</Button>}
                {detail.status !== 'no_show' && detail.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => setStatus(detail, 'no_show')}><Ban className="size-4" /> No-Show</Button>}
                {/* Absagen (mit Kundenmail) nur bei Kunden-Terminen; interne Slots: nur Löschen. */}
                {detail.customer_email && detail.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => doCancel(detail)}><CalendarX className="size-4" /> Absagen</Button>}
                <Button size="sm" variant="danger" onClick={() => doDelete(detail)}><Trash2 className="size-4" /> Löschen</Button>
              </div>
            }
          >
            <div className="space-y-2 text-sm text-text-secondary">
              <Row icon={<Clock className="size-4" />} text={`${dayKeyOf(detail.start_at).split('-').reverse().join('.')} · ${timeOf(detail.start_at)}–${timeOf(detail.end_at)} (${detail.duration_minutes} Min.)`} />
              {detail.assignee_name && <Row icon={<User className="size-4" />} text={`Zuständig: ${detail.assignee_name}`} />}
              {detail.customer_email && <Row icon={<Mail className="size-4" />} text={detail.customer_email} />}
              {detail.customer_phone && <Row icon={<Phone className="size-4" />} text={detail.customer_phone} />}
              {(detail.meeting_link || detail.location) && <Row icon={<MapPin className="size-4" />} text={detail.meeting_link || detail.location || ''} />}
              {detail.invite_sent_at && <div className="text-xs text-text-muted">Einladung verschickt.</div>}
              {detail.notes && <div className="rounded-md border border-border-subtle bg-canvas p-2.5 text-sm text-text-muted">{detail.notes}</div>}
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

function Row({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-text-muted">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  );
}
