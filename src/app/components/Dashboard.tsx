import { useState, useEffect, useMemo } from 'react';
import { Users, DollarSign, CheckCircle, Clock, Mail, Phone, Wallet, ArrowUpRight, TrendingUp, CalendarClock, PhoneCall, ChevronRight } from 'lucide-react';
import { getLeads, getAppointmentAdmins, getAppointments, getStatusOptions, type Lead, type Appointment } from '../utils/storage';
import { Reveal, Item, AnimatedNumber } from './anim';
import { Card, EmptyState, PageHeader, SEITEN_RAND, SectionLabel, StatCard, StatusBadge, cn, statusColor } from './ui-kit';
import { SEITEN_TITEL } from './dichte';

const EUR = (n: number): string => '€' + (n || 0).toLocaleString('de-DE', { maximumFractionDigits: 0 });

/**
 * Überschrift des Begrüßungsbereichs.
 *
 * Im Entwurf steht "484 Leads. 11 warten auf dich." — beide Zahlen echt, aber
 * der zweite Satz gilt nur, wenn wirklich etwas wartet. Bei null fälligen
 * Follow-ups stünde dort "0 warten auf dich.", was gleichzeitig falsch klingt
 * und schlechte Laune macht.
 */
function ueberschrift(gesamt: number, faellig: number): string {
  const leads = `${gesamt.toLocaleString('de-DE')} ${gesamt === 1 ? 'Lead' : 'Leads'}.`;
  if (faellig === 0) return `${leads} Alles abgearbeitet.`;
  return `${leads} ${faellig} ${faellig === 1 ? 'wartet' : 'warten'} auf dich.`;
}

/**
 * Der Satz darunter — im Entwurf "262 Leads sind noch keinem Vertriebler
 * zugewiesen — der größte Hebel diese Woche."
 *
 * Er wird aus den Zahlen gebildet, statt fest zu stehen: fest verdrahtet wäre
 * er eine Behauptung, die auch dann noch dasteht, wenn alles zugewiesen ist.
 * Genannt wird der jeweils grösste Posten.
 */
function lageSatz(gesamt: number, nichtZugewiesen: number, faellig: number): string {
  if (gesamt === 0) return 'Noch keine Leads erfasst. Über „Neuer Lead" oder den Import geht es los.';
  if (nichtZugewiesen > 0 && nichtZugewiesen >= faellig) {
    return `${nichtZugewiesen.toLocaleString('de-DE')} ${nichtZugewiesen === 1 ? 'Lead ist' : 'Leads sind'} noch keinem Vertriebler zugewiesen — der grösste Hebel.`;
  }
  if (faellig > 0) {
    return `${faellig} ${faellig === 1 ? 'Follow-up ist' : 'Follow-ups sind'} fällig. Danach ist der Posteingang der Pipeline leer.`;
  }
  return 'Alles zugewiesen, keine Follow-ups offen. Guter Zeitpunkt für neue Leads.';
}

/** Zahl-Kachel im Begrüßungsbereich. Dunkler als die Karte, damit sie sich vom
 *  Akzentverlauf abhebt statt darin zu verschwimmen — so macht es der Entwurf. */
function HeroKachel({
  wert,
  label,
  ton,
  onClick,
}: {
  wert: number;
  label: string;
  ton: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-[7px] rounded-[14px] border border-overlay/[0.09] bg-canvas/55 px-[18px] py-4 text-left',
        'backdrop-blur-[6px] transition-[border-color,transform] motion-safe:hover:-translate-y-0.5 hover:border-accent-500/50',
      )}
    >
      <span className={cn('font-mono text-[23px] font-bold leading-none tabular-nums', ton)}>
        {wert.toLocaleString('de-DE')}
      </span>
      <span className="text-[11px] font-semibold leading-[1.3] text-text-tertiary">{label}</span>
    </button>
  );
}

// ── Tagesplan-Helfer ─────────────────────────────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0');
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const timeOf = (iso: string) => { const m = iso.match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : ''; };
const nowSlot = () => { const d = new Date(); return `${todayKey()}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

const APPT_TYPE_META: Record<string, { label: string; chip: string }> = {
  quali: { label: 'Quali', chip: 'bg-violet-500/15 text-violet-300 hell:text-violet-700' },
  sales: { label: 'Sales', chip: 'bg-sky-500/15 text-sky-300 hell:text-sky-700' },
  call: { label: 'Rückruf', chip: 'bg-emerald-500/15 text-emerald-300 hell:text-emerald-700' },
  other: { label: 'Termin', chip: 'bg-slate-500/15 text-slate-300 hell:text-slate-700' },
};

/** Kompakte, immer gefüllte Verteilungszeile (ersetzt leere Chart-Voids). */
function DistRow({ name, count, max, color }: { name: string; count: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <li className="flex items-center gap-3">
      <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="w-24 shrink-0 truncate text-sm text-text-secondary">{name}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
        <div className="h-full rounded-full transition-[width] duration-500 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="w-7 shrink-0 text-right text-sm font-medium tabular-nums text-text-primary">{count}</span>
    </li>
  );
}

export function Dashboard({
  onOpenKalender,
  onOpenLead,
  onOpenLeads,
}: {
  onOpenKalender?: () => void;
  onOpenLead?: (leadId: string) => void;
  /** Wechselt in die Lead-Liste — die Kacheln im Begrüßungsbereich führen dorthin. */
  onOpenLeads?: () => void;
} = {}) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [adminNames, setAdminNames] = useState<string[]>([]);
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getLeads();
        setLeads(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Failed to load leads:', error);
        setLeads([]);
      }
    })();
    // `filter(Boolean)`: ein Eintrag ohne `username` hat die ganze Ansicht mit
    // weissem Bildschirm abgeschossen (`r.name.slice` auf undefined). Ein
    // fehlender Name ist kein Grund, das Dashboard nicht zu zeigen.
    getAppointmentAdmins()
      .then((a) => setAdminNames(a.map((x) => x.username).filter((n): n is string => !!n)))
      .catch(() => setAdminNames([]));
    // Tagesplan: alle heutigen Termine/Anrufe, nach Uhrzeit sortiert.
    getAppointments({ from: `${todayKey()}T00:00`, to: `${todayKey()}T23:59` })
      .then((rows) => setTodayAppts(rows.filter((a) => a.status !== 'cancelled' && a.status !== 'declined').sort((x, y) => x.start_at.localeCompare(y.start_at))))
      .catch(() => setTodayAppts([]));
  }, []);

  const total = leads.length;
  const won = leads.filter((l) => l.status === 'Gewonnen').length;
  const lost = leads.filter((l) => l.status === 'Verloren').length;
  const inProgress = total - won - lost;
  const totalValue = leads.reduce((sum, l) => sum + (l.value || 0), 0);
  const avgValue = total > 0 ? totalValue / total : 0;
  const withEmail = leads.filter((l) => l.email && l.email !== 'nicht gefunden' && l.email !== '').length;
  const withPhone = leads.filter((l) => !!l.phone).length;
  const unassigned = leads.filter((l) => !l.assignedTo).length;
  const winRate = total > 0 ? Math.round((won / total) * 100) : 0;

  const now = Date.now();
  const new30 = leads.filter((l) => now - new Date(l.createdAt).getTime() < 30 * 864e5).length;

  // Kanonische Statusliste (aus Pipeline-Setup abgeleitet) statt hartkodiert —
  // neue Stages wie „Broschüre" erscheinen damit auch hier.
  const STAGES = getStatusOptions();
  const pipelineData = STAGES.map((status) => ({ name: status, count: leads.filter((l) => l.status === status).length }));
  const pipeMax = Math.max(1, ...pipelineData.map((s) => s.count));

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    leads.forEach((l) => map.set(l.source || 'Unbekannt', (map.get(l.source || 'Unbekannt') || 0) + 1));
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [leads]);
  const srcMax = Math.max(1, ...bySource.map((s) => s.value));
  // Töne aus dem Redesign; vorher standen hier die Werte der alten Palette.
  const SOURCE_PALETTE = ['#5B8CFF', '#3DDC97', '#F5B544', '#A78BFA', '#38BDF8', '#8A90A3'];

  /**
   * Die Liste fuellt ihre Rasterzelle — deshalb mehr als die alten sechs.
   *
   * Sechs waren eine feste Zahl ohne Bezug zum Platz: die Karte endete auf
   * halber Hoehe, waehrend links noch zwei Karten weiterliefen, und unten
   * rechts blieb eine Kante ohne Gegenueber. Jetzt gibt es genug Nachschub,
   * damit die Karte bis zur Zeilenkante gefuellt ist; was nicht mehr
   * hineinpasst, ist ueber die Liste erreichbar.
   *
   * Zwanzig ist keine Anzeige-, sondern eine Vorratsgrenze — sichtbar sind so
   * viele, wie die Hoehe hergibt.
   */
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 20);

  // Team-Verteilung: Leads + fällige Follow-ups je (echtem) Admin-Account.
  const today = new Date().toISOString().slice(0, 10);
  const isDue = (l: Lead): boolean => !!l.nextFollowUpDate && l.nextFollowUpDate.slice(0, 10) <= today;
  const dueTotal = leads.filter(isDue).length;
  const byUser = useMemo(() => {
    const names = new Set<string>(adminNames);
    leads.forEach((l) => { if (l.assignedTo?.trim()) names.add(l.assignedTo); });
    const rows = [...names].map((name) => {
      const mine = leads.filter((l) => l.assignedTo === name);
      return { name, count: mine.length, due: mine.filter(isDue).length };
    });
    rows.push({ name: 'Nicht zugewiesen', count: leads.filter((l) => !l.assignedTo).length, due: leads.filter((l) => !l.assignedTo && isDue(l)).length });
    return rows.sort((a, b) => b.count - a.count);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads, adminNames]);
  const userMax = Math.max(1, ...byUser.map((r) => r.count));

  return (
    <div className={cn(SEITEN_RAND, 'space-y-5')}>
      {/* ── Begrüßungsbereich nach dem Redesign ──
          Der Entwurf zeigt hier "484 Leads. 11 warten auf dich." und drei
          Kacheln. Die Zahlen kommen aus den echten Leads, nicht aus dem
          Entwurf — im Entwurf sind sie Beispielwerte. */}
      <section className="relative overflow-hidden rounded-[22px] border border-[var(--hero-rand)] bg-[image:var(--hero-verlauf)] px-6 py-7 md:px-9 md:py-8">
        <span
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-32 size-[420px] rounded-full bg-[radial-gradient(closest-side,var(--hero-schein),transparent)]"
        />
        <div className="relative flex flex-wrap items-end gap-9">
          <div className="flex min-w-[min(100%,21rem)] flex-1 flex-col gap-3">
            <p className="flex items-center gap-2.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-accent-500">
              <span
                aria-hidden
                className="size-1.5 shrink-0 rounded-full bg-status-success shadow-[0_0_10px_var(--success)] motion-safe:animate-pulse"
              />
              Live · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <h1 className={cn('font-display font-semibold leading-[1.05] tracking-[-0.025em] text-pretty text-text-primary', SEITEN_TITEL)}>
              {ueberschrift(total, dueTotal)}
            </h1>
            <p className="max-w-[56ch] text-pretty text-[14px] leading-[1.55] text-text-tertiary">
              {lageSatz(total, unassigned, dueTotal)}
            </p>
          </div>

          {/* Drei Kacheln wie im Entwurf. Jede führt dorthin, wo man die
              Sache bearbeitet — eine Zahl ohne Weg ist nur Dekoration. */}
          <div className="grid min-w-[min(100%,20rem)] flex-1 gap-2.5 [grid-template-columns:repeat(auto-fit,minmax(min(132px,100%),1fr))]">
            <HeroKachel wert={dueTotal} label="Follow-ups fällig" ton="text-status-warning" onClick={onOpenLeads} />
            <HeroKachel wert={unassigned} label="Nicht zugewiesen" ton="text-accent-500" onClick={onOpenLeads} />
            <HeroKachel wert={withPhone} label="Mit Telefonnummer" ton="text-status-success" onClick={onOpenLeads} />
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <Reveal className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Item>
          <StatCard
            icon={<Users className="size-4" />}
            label="Gesamt Leads"
            value={<AnimatedNumber value={total} />}
            hint={new30 > 0 ? <span className="inline-flex items-center gap-0.5 text-status-success"><ArrowUpRight className="size-3" />+{new30} in 30 Tagen</span> : 'Alle Pipelines'}
          />
        </Item>
        <Item><StatCard icon={<Clock className="size-4" />} label="In Bearbeitung" value={<AnimatedNumber value={inProgress} />} hint={`${total > 0 ? Math.round((inProgress / total) * 100) : 0}% der Leads`} /></Item>
        <Item><StatCard icon={<CheckCircle className="size-4" />} label="Gewonnen" value={<AnimatedNumber value={won} />} hint={<span className="inline-flex items-center gap-1"><TrendingUp className="size-3" />{winRate}% Quote · {lost} verloren</span>} /></Item>
        <Item><StatCard icon={<DollarSign className="size-4" />} label="Gesamtwert" value={<AnimatedNumber value={totalValue} format={EUR} />} hint={`Ø ${EUR(avgValue)} / Lead`} /></Item>
      </Reveal>

      {/**
        * Zwei Spalten mit ZWEI echten Zeilen — nicht zwei unabhaengige Stapel.
        *
        * Vorher waren das zwei <section> mit je eigenem space-y. Jede stapelte
        * ihre Karten fuer sich, und weil die Karten verschieden hoch sind,
        * konnte keine waagerechte Kante zusammenfallen: der Tagesplan endete
        * mitten in der Pipeline-Karte, "Neueste Leads" begann auf einer Hoehe,
        * der links nichts entsprach. Das Auge sucht in einem Raster nach
        * durchgehenden Linien; findet es keine, wirkt die Seite unaufgeraeumt,
        * auch wenn jede Karte fuer sich in Ordnung ist.
        *
        * Jetzt liegen vier Kacheln in einem Raster:
        *
        *     Pipeline-Verteilung  |  Tagesplan
        *     ---------------------+---------------------  <- gemeinsame Kante
        *     Kennzahlen, Team,    |  Neueste Leads
        *     Quelle               |
        *
        * Die Plaetze stehen AUSDRUECKLICH (col-start/row-start) statt ueber die
        * Reihenfolge im Markup. Das hat einen zweiten Grund: so bleibt die
        * Reihenfolge im Dokument die sinnvolle fuer schmale Bildschirme und
        * Vorlesehilfen — Pipeline, Kennzahlen, Team, Quelle, dann Tagesplan und
        * neueste Leads. Ueber die Anordnung im Markup gesteuert muesste der
        * Tagesplan mitten zwischen die Kennzahlen rutschen.
        *
        * Die erste Zeile dehnt sich (Vorgabe des Rasters), beide Karten enden
        * also auf derselben Linie. In der zweiten Zeile steht "Neueste Leads"
        * mit `self-start` oben an — die linke Spalte ist dort deutlich hoeher,
        * und eine mitgedehnte Liste mit sechs Eintraegen waere nur Leerraum.
        */}
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          {/* Pipeline-Verteilung — immer gefüllt (kein leerer Chart-Void mehr) */}
          <Card className="p-4 lg:col-start-1 lg:row-start-1">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Pipeline-Verteilung</SectionLabel>
              <span className="text-xs text-text-muted tabular-nums">{total} Leads gesamt</span>
            </div>
            <ul className="space-y-3">
              {pipelineData.map((s) => (
                <DistRow key={s.name} name={s.name} count={s.count} max={pipeMax} color={statusColor(s.name)} />
              ))}
            </ul>
          </Card>

        {/* Die uebrigen Karten der linken Spalte — zweite Rasterzeile. */}
        <section className="space-y-5 lg:col-start-1 lg:row-start-2">
          {/* Datenqualität — 3 kompakte KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard icon={<Mail className="size-4" />} label="Mit E-Mail" value={<AnimatedNumber value={withEmail} />} hint={`${total > 0 ? Math.round((withEmail / total) * 100) : 0}% von ${total}`} />
            <StatCard icon={<Phone className="size-4" />} label="Mit Telefon" value={<AnimatedNumber value={withPhone} />} hint={`${total > 0 ? Math.round((withPhone / total) * 100) : 0}% von ${total}`} />
            <StatCard icon={<Wallet className="size-4" />} label="Ø Lead-Wert" value={<AnimatedNumber value={avgValue} format={EUR} />} hint="Pipeline-Schnitt" />
          </div>

          {/* Team-Verteilung — wer hat wie viele Leads + fällige Follow-ups */}
          <Card className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <SectionLabel>Team-Verteilung</SectionLabel>
              {dueTotal > 0 && (
                <span className="inline-flex items-center gap-1 text-xs text-status-warning">
                  <CalendarClock className="size-3.5" />{dueTotal} Follow-up(s) fällig
                </span>
              )}
            </div>
            <ul className="space-y-3">
              {byUser.map((r) => (
                <li key={r.name} className="flex items-center gap-3">
                  <span className={r.name === 'Nicht zugewiesen'
                    ? 'flex size-6 shrink-0 items-center justify-center rounded-full bg-elevated text-[10px] font-semibold text-text-muted'
                    : 'flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-500/20 text-[10px] font-semibold text-accent-500'}>
                    {r.name === 'Nicht zugewiesen' ? '—' : r.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="w-32 shrink-0 truncate text-sm text-text-secondary">{r.name}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
                    <div className="h-full rounded-full bg-accent-500 transition-[width] duration-500 ease-out" style={{ width: `${Math.round((r.count / userMax) * 100)}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-sm font-medium tabular-nums text-text-primary">{r.count}</span>
                  <span className={`w-16 shrink-0 text-right text-xs tabular-nums ${r.due > 0 ? 'text-status-warning' : 'text-text-muted'}`}>
                    {r.due > 0 ? `${r.due} fällig` : '—'}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Leads nach Quelle — kompakte Balkenliste */}
          <Card className="p-4">
            <SectionLabel className="mb-4 block">Leads nach Quelle</SectionLabel>
            {bySource.length > 0 ? (
              <ul className="space-y-3">
                {bySource.map((s, i) => (
                  <DistRow key={s.name} name={s.name} count={s.value} max={srcMax} color={SOURCE_PALETTE[i % SOURCE_PALETTE.length]} />
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-text-muted">Noch keine Quellen-Daten.</p>
            )}
          </Card>
        </section>

          {/* Tagesplan — alle heutigen Anrufe & Termine nach Uhrzeit.
              `flex flex-col`, damit der Leerzustand die gedehnte Hoehe
              ausfuellt statt oben zu kleben. */}
          <Card className="flex flex-col p-4 lg:col-start-2 lg:row-start-1">
            <div className="mb-3 flex items-center justify-between">
              <SectionLabel>
                Tagesplan · {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' })}
              </SectionLabel>
              {onOpenKalender && (
                <button
                  type="button"
                  onClick={onOpenKalender}
                  className="inline-flex items-center gap-0.5 text-xs font-medium text-accent-500 transition-colors hover:text-accent-500"
                >
                  Kalender<ChevronRight className="size-3.5" />
                </button>
              )}
            </div>
            {todayAppts.length === 0 ? (
              <EmptyState
                /* flex-1: fuellt die gedehnte Karte statt oben zu kleben.
                   Ohne das stuende der Hinweis am oberen Rand und darunter
                   klaffte die halbe Karte — genau der Eindruck von
                   "unaufgeraeumt", der behoben werden sollte. */
                className="flex-1 py-6"
                icon={<CalendarClock className="size-5" />}
                title="Heute nichts geplant"
                description={'Anrufe & Termine legst du im Lead („Anruf planen“) oder im Kalender an.'}
              />
            ) : (
              <ul className="space-y-2">
                {todayAppts.map((a) => {
                  const tm = APPT_TYPE_META[a.type] || APPT_TYPE_META.other;
                  const done = a.status === 'completed';
                  const overdue = !done && a.start_at < nowSlot();
                  const openLead = a.company_id && onOpenLead ? () => onOpenLead(a.company_id!) : undefined;
                  return (
                    <li
                      key={a.id}
                      onClick={openLead}
                      className={cn(
                        'flex items-center gap-3 rounded-lg border border-border-subtle bg-elevated p-2.5',
                        done && 'opacity-55',
                        openLead && 'cursor-pointer transition-colors hover:border-border-strong',
                      )}
                    >
                      <span className={cn(
                        'w-12 shrink-0 text-sm font-semibold tabular-nums',
                        overdue ? 'text-status-danger' : done ? 'text-text-muted line-through' : 'text-text-primary',
                      )}>
                        {timeOf(a.start_at)}
                      </span>
                      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', tm.chip)}>{tm.label}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-text-primary">{a.customer_name || a.title}</p>
                        <p className="truncate text-xs text-text-muted">
                          {overdue && <span className="font-semibold text-status-danger">Überfällig · </span>}
                          {done && 'Erledigt · '}
                          {a.assignee_name || '—'}
                          {a.notes ? ` · ${a.notes}` : ''}
                        </p>
                      </div>
                      {a.customer_phone && (
                        <a
                          href={`tel:${a.customer_phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-500/10 text-accent-500 transition-colors hover:bg-accent-500/20"
                          title={`Anrufen: ${a.customer_phone}`}
                        >
                          <PhoneCall className="size-4" />
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/**
            * Neueste Leads — zweite Rasterzeile, fuellt die Zelle genau.
            *
            * Die Karte liegt in einer Huelle und ist ab `lg` absolut darin
            * gesetzt. Grund: eine Rasterzelle waechst mit ihrem Inhalt. Stuende
            * die Karte direkt in der Zelle, wuerde die Liste die ZEILENHOEHE
            * bestimmen — bei zwanzig Leads waere sie hoeher als die linke
            * Spalte, und die Luecke waere einfach auf die andere Seite
            * gewandert.
            *
            * Die Huelle ist leer und traegt damit nichts zur Hoehe bei; die
            * Zeile bemisst sich allein an der linken Spalte, und die Karte
            * fuellt sie auf den Pixel genau. Was nicht hineinpasst, rollt.
            */}
          <div className="lg:relative lg:col-start-2 lg:row-start-2">
          <Card className="flex min-h-0 flex-col p-4 lg:absolute lg:inset-0">
          <div className="mb-3 flex items-center justify-between">
            <SectionLabel>Neueste Leads</SectionLabel>
            {total > 0 && <span className="text-xs text-text-muted tabular-nums">{total}</span>}
          </div>
          {recentLeads.length > 0 ? (
            /* `flex-1 min-h-0` fuellt die gedehnte Karte, `overflow-y-auto`
               faengt ab, was nicht mehr hineinpasst. Ohne `min-h-0` wuerde
               der Inhalt die Karte auseinanderdruecken statt zu rollen — das
               ist die uebliche Falle bei Flex-Kindern. */
            <Reveal as="ul" className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-0.5">
              {recentLeads.map((lead) => (
                <Item as="li" key={lead.id}>
                  <div className="flex items-center gap-3 rounded-lg border border-border-subtle bg-elevated p-2.5 transition-colors hover:border-border-strong">
                    <div className="flex size-9 flex-shrink-0 items-center justify-center rounded-lg bg-accent-500/15 text-sm font-semibold text-accent-500">
                      {(lead.company || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{lead.company}</p>
                      <p className="truncate text-xs text-text-muted">{lead.contactPerson || lead.city || '—'}</p>
                    </div>
                    <StatusBadge status={lead.status} />
                  </div>
                </Item>
              ))}
            </Reveal>
          ) : (
            <EmptyState
              className="flex-1 py-10"
              icon={<Users className="size-5" />}
              title="Noch keine Leads"
              description="Neue Anfragen & gescrapte Händler erscheinen hier automatisch."
            />
          )}
          </Card>
          </div>
      </div>
    </div>
  );
}
