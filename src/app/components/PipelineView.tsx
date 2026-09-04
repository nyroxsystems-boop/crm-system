import { useState, useEffect } from 'react';
import { getLeads, saveLead, deleteLead, getSettings, type Lead, type PipelineStage } from '../utils/storage';
import { LeadDetailModal } from './LeadDetailModal';
import { LeadModal } from './LeadModal';
import { Plus, Check, Phone, Mail, Inbox } from 'lucide-react';
import { Badge, Card, EmptyState, IconButton, PageHeader, PriorityPill, SEITEN_RAND, cn, inputClass, statusColor } from './ui-kit';
import { LEER_INNEN } from './dichte';

const EUR = (n: number) => '€' + (n || 0).toLocaleString('de-DE');

export function PipelineView() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [detailLead, setDetailLead] = useState<Lead | null>(null);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Stammdaten-Maske aus dem Aktivitäten-Overlay geöffnet? → Zurück-Pfeil.
  const [editFromDetail, setEditFromDetail] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const allLeads = await getLeads();
      const activeStages = getSettings().pipelineStages.filter((s) => s.isActive).sort((a, b) => a.order - b.order);
      setLeads(Array.isArray(allLeads) ? allLeads : []);
      setStages(activeStages);
    } catch (error) {
      console.error('Failed to load pipeline data:', error);
      setLeads([]);
    }
  };

  // Standard-Auswahl: erste Pipeline-Stufe, sobald die Stages geladen sind.
  useEffect(() => {
    if (!selectedStage && stages.length) setSelectedStage(stages[0].name);
  }, [stages, selectedStage]);

  const quickAdd = async (company: string, status: string) => {
    const c = company.trim();
    if (!c) return;
    const now = new Date().toISOString();
    const optimistic: Lead = {
      id: `tmp-${Date.now()}`, company: c, contactPerson: '', email: '', status,
      source: 'Manuell', priority: 'Mittel', value: 0, tags: [], createdAt: now, updatedAt: now,
    };
    setLeads((prev) => [...prev, optimistic]);
    try {
      await saveLead({ company: c, status, source: 'Manuell' });
      await loadData();
    } catch {
      /* optimistic */
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Möchten Sie diesen Lead wirklich löschen?')) {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      await deleteLead(id);
    }
  };

  const handleSaveLead = (lead: Partial<Lead>) => {
    saveLead(lead);
    loadData();
    setIsModalOpen(false);
    setEditingLead(null);
    setEditFromDetail(false);
  };

  const selectedLeads = leads.filter((l) => l.status === selectedStage);
  const selectedSum = selectedLeads.reduce((s, l) => s + (l.value || 0), 0);

  return (
    <div className={cn(SEITEN_RAND, 'space-y-5')}>
      <PageHeader title="Pipeline" subtitle="Pipeline-Stufe oben wählen — darunter erscheinen die zugehörigen Leads." />

      {/* Pipeline-Stufen als Karten (klickbar)
       *
       * `auto-fit` statt einer festen Spaltenzahl. Hier stand `xl:grid-cols-7`
       * bei acht Stufen — die achte ("Verloren") stand allein in einer zweiten
       * Reihe und die erste Reihe war voll. Das sieht nach Versehen aus, weil
       * es eines ist.
       *
       * Eine feste Zahl kann hier auch gar nicht stimmen: die Stufen werden im
       * Pipeline-Setup frei angelegt und gelöscht. Jede fest verdrahtete
       * Spaltenzahl ist ab der nächsten Änderung wieder falsch, und zwar
       * unbemerkt. `auto-fit` mit einer Mindestbreite füllt die Reihe mit so
       * vielen Karten, wie hineinpassen, und verteilt den Rest gleichmässig —
       * bei sechs Stufen genauso wie bei zwölf.
       */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-3">
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.name);
          const sum = stageLeads.reduce((s, l) => s + (l.value || 0), 0);
          const color = statusColor(stage.name);
          const active = selectedStage === stage.name;
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => setSelectedStage(stage.name)}
              className={cn(
                'rounded-xl border p-4 text-left transition-colors',
                active
                  ? 'border-accent-500 bg-accent-500/5 ring-1 ring-accent-500'
                  : 'border-border-subtle bg-surface hover:border-border-strong',
              )}
            >
              <div className="flex items-center gap-2">
                <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} aria-hidden />
                <span className="truncate text-sm font-medium text-text-primary">{stage.name}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <span className="font-display text-2xl font-semibold tabular-nums text-text-primary">{stageLeads.length}</span>
                <span className="truncate text-xs text-text-muted tabular-nums">{EUR(sum)}</span>
              </div>
            </button>
          );
        })}
        {stages.length === 0 && (
          <Card className={cn('col-span-full text-sm text-text-muted', LEER_INNEN)}>
            Keine aktiven Pipeline-Stufen. Lege welche unter „Pipeline-Setup" an.
          </Card>
        )}
      </div>

      {/* Leads der gewählten Stufe */}
      {selectedStage && (
        <Card className="overflow-visible">
          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle px-4 py-3">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: statusColor(selectedStage) }} aria-hidden />
            <h3 className="text-sm font-semibold text-text-primary">{selectedStage}</h3>
            <Badge tone="neutral">{selectedLeads.length} Leads</Badge>
            <span className="text-xs text-text-muted tabular-nums">· {EUR(selectedSum)}</span>
            <div className="ml-auto">
              <QuickAdd onAdd={(c) => quickAdd(c, selectedStage)} />
            </div>
          </div>

          {selectedLeads.length === 0 ? (
            <EmptyState icon={<Inbox className="size-5" />} title="Keine Leads in dieser Stufe" description="Wähle eine andere Stufe oder füge oben rechts einen Lead hinzu." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle bg-elevated/50">
                    <th className="label-technical px-4 py-3 text-left text-text-muted">Firma</th>
                    <th className="label-technical px-4 py-3 text-left text-text-muted">Kontakt</th>
                    <th className="label-technical px-4 py-3 text-left text-text-muted">Quelle</th>
                    <th className="label-technical px-4 py-3 text-left text-text-muted">Priorität</th>
                    <th className="label-technical px-4 py-3 text-right text-text-muted">Wert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {selectedLeads.map((lead) => (
                    <tr
                      key={lead.id}
                      onClick={() => setDetailLead(lead)}
                      className="cursor-pointer transition-colors hover:bg-elevated"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-accent-500/15 text-sm font-semibold text-accent-500">
                            {(lead.company || '?')[0]}
                          </div>
                          <span className="font-medium text-text-primary">{lead.company || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">
                        <div className="flex flex-col gap-0.5">
                          {lead.contactPerson && <span>{lead.contactPerson}</span>}
                          <span className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                            {lead.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{lead.phone}</span>}
                            {lead.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{lead.email}</span>}
                            {!lead.contactPerson && !lead.phone && !lead.email && '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{lead.source ? <Badge tone="neutral">{lead.source}</Badge> : <span className="text-text-muted">—</span>}</td>
                      <td className="px-4 py-3">{lead.priority ? <PriorityPill priority={lead.priority} /> : <span className="text-text-muted">—</span>}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums text-text-primary">€{(lead.value || 0).toLocaleString('de-DE')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {isModalOpen && (
        <LeadModal
          lead={editingLead}
          onClose={() => {
            setIsModalOpen(false);
            setEditingLead(null);
            setEditFromDetail(false);
          }}
          onSave={handleSaveLead}
          onBack={editFromDetail && editingLead ? () => {
            const l = editingLead;
            setIsModalOpen(false);
            setEditingLead(null);
            setEditFromDetail(false);
            setDetailLead(l);
          } : undefined}
        />
      )}

      {detailLead && (
        <LeadDetailModal
          lead={detailLead}
          onClose={() => setDetailLead(null)}
          onEdit={(lead) => {
            setDetailLead(null);
            setEditingLead(lead);
            setEditFromDetail(true);
            setIsModalOpen(true);
          }}
          onLeadChanged={loadData}
          onDelete={() => {
            handleDeleteLead(detailLead.id);
            setDetailLead(null);
          }}
        />
      )}
    </div>
  );
}

function QuickAdd({ onAdd }: { onAdd: (company: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const commit = () => {
    if (value.trim()) onAdd(value);
    setValue('');
    setOpen(false);
  };
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-sm text-text-muted transition-colors hover:bg-elevated hover:text-text-secondary"
      >
        <Plus className="size-4" />
        Lead hinzufügen
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') {
            setValue('');
            setOpen(false);
          }
        }}
        placeholder="Firmenname…"
        className={cn(inputClass, 'h-8')}
      />
      <IconButton className="size-8 shrink-0" onClick={commit} aria-label="Hinzufügen"><Check className="size-4" /></IconButton>
    </div>
  );
}
