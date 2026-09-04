import { useEffect, useState } from 'react';
import { X, Plus } from 'lucide-react';
import { type Lead, getSettings, getStatusOptions, getAppointmentAdmins } from '../utils/storage';
import { CustomSelect } from './CustomSelect';
import { Modal, Button, Field, Badge, inputClass, cn } from './ui-kit';

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
  /** Wenn gesetzt: Zurück-Pfeil oben links (zurück zur Aktivitäten-Ansicht). */
  onBack?: () => void;
}

export function LeadModal({ lead, onClose, onSave, onBack }: LeadModalProps) {
  const settings = getSettings();
  const [formData, setFormData] = useState({
    company: lead?.company || '',
    contactPerson: lead?.contactPerson || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    website: lead?.website || '',
    industry: lead?.industry || '',
    city: lead?.city || '',
    country: lead?.country || 'DE',
    dealerType: lead?.dealerType || 'neuteile',
    address: lead?.address || '',
    status: lead?.status || 'Neu',
    source: lead?.source || 'Website',
    value: lead?.value || 0,
    priority: lead?.priority || 'Mittel',
    assignedTo: lead?.assignedTo || '',
    notes: lead?.notes || '',
    tags: lead?.tags || [],
    leadScore: lead?.leadScore || 0,
    nextFollowUpDate: lead?.nextFollowUpDate || '',
  });
  const [newTag, setNewTag] = useState('');
  // Echte Admin-Accounts für die Zuteilung (statt Freitext — Tippfehler machten
  // Leads im Benutzer-Filter unauffindbar). Ein evtl. Alt-Wert bleibt wählbar.
  const NO_ASSIGNEE = '— nicht zugewiesen —';
  const [adminNames, setAdminNames] = useState<string[]>([]);
  useEffect(() => {
    getAppointmentAdmins().then((a) => setAdminNames(a.map((x) => x.username)));
  }, []);
  const assigneeOptions = [
    NO_ASSIGNEE,
    ...adminNames,
    ...(formData.assignedTo && !adminNames.includes(formData.assignedTo) ? [formData.assignedTo] : []),
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...lead, ...formData });
  };

  const handleChange = (field: string, value: unknown) => setFormData((prev) => ({ ...prev, [field]: value }));

  const addTag = () => {
    const t = newTag.trim();
    if (t && !formData.tags.includes(t)) {
      handleChange('tags', [...formData.tags, t]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => handleChange('tags', formData.tags.filter((t) => t !== tag));

  return (
    <Modal
      onClose={onClose}
      onBack={onBack}
      title={lead ? 'Lead bearbeiten' : 'Neuer Lead'}
      subtitle={onBack ? 'Stammdaten — zurück zu den Aktivitäten oben links.' : 'Geben Sie die Lead-Details ein.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Abbrechen
          </Button>
          <Button type="submit" form="lead-form">
            {lead ? 'Aktualisieren' : 'Lead erstellen'}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={handleSubmit} className="space-y-6">
        {/* Basis */}
        <section className="space-y-4">
          <h4 className="label-technical text-text-muted">Basisinformationen</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Firma / Händler">
              <input
                type="text"
                value={formData.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="z.B. Müller Autoteile GmbH"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Kontaktperson">
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => handleChange('contactPerson', e.target.value)}
                placeholder="z.B. Max Mustermann"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="E-Mail">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="max@beispiel.de"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Telefon">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="+49 123 456789"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Website">
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="https://www.beispiel.de"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Branche">
              <CustomSelect
                value={formData.industry}
                onChange={(value) => handleChange('industry', value)}
                options={settings.industries}
                placeholder="Branche wählen…"
              />
            </Field>
            <Field label="Händlerart">
              <CustomSelect
                value={formData.dealerType === 'gebrauchtteile' ? 'Gebrauchtteilehändler' : 'Neuteilehändler'}
                onChange={(value) => handleChange('dealerType', value === 'Gebrauchtteilehändler' ? 'gebrauchtteile' : 'neuteile')}
                options={['Neuteilehändler', 'Gebrauchtteilehändler']}
              />
            </Field>
          </div>
        </section>

        {/* Adresse */}
        <section className="space-y-4 border-t border-border-subtle pt-5">
          <h4 className="label-technical text-text-muted">Adressinformationen</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Adresse" className="md:col-span-2">
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Straße und Hausnummer"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Stadt">
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="z.B. München"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Land">
              <CustomSelect
                value={({ DE: 'Deutschland', AT: 'Österreich', CH: 'Schweiz', FR: 'Frankreich', PL: 'Polen' } as Record<string, string>)[formData.country] || formData.country || 'Deutschland'}
                onChange={(value) => handleChange('country', ({ Deutschland: 'DE', Österreich: 'AT', Schweiz: 'CH', Frankreich: 'FR', Polen: 'PL' } as Record<string, string>)[value] || value)}
                options={['Deutschland', 'Österreich', 'Schweiz', 'Frankreich', 'Polen']}
              />
            </Field>
          </div>
        </section>

        {/* Vertrieb */}
        <section className="space-y-4 border-t border-border-subtle pt-5">
          <h4 className="label-technical text-text-muted">Vertriebsinformationen</h4>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Status">
              <CustomSelect value={formData.status} onChange={(v) => handleChange('status', v)} options={getStatusOptions()} />
            </Field>
            <Field label="Quelle">
              <CustomSelect value={formData.source} onChange={(v) => handleChange('source', v)} options={settings.sources} />
            </Field>
            <Field label="Geschätzter Wert (€)">
              <input
                type="number"
                min="0"
                value={formData.value}
                onChange={(e) => handleChange('value', Number(e.target.value))}
                placeholder="z.B. 5000"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Priorität">
              <CustomSelect value={formData.priority} onChange={(v) => handleChange('priority', v)} options={['Niedrig', 'Mittel', 'Hoch']} />
            </Field>
            <Field label="Zugewiesen an">
              <CustomSelect
                value={formData.assignedTo || NO_ASSIGNEE}
                onChange={(v) => handleChange('assignedTo', v === NO_ASSIGNEE ? '' : v)}
                options={assigneeOptions}
              />
            </Field>
            <Field label="Nächstes Follow-up">
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) => handleChange('nextFollowUpDate', e.target.value)}
                className={cn(inputClass, 'h-9')}
              />
            </Field>
            <Field label="Lead Score (0–100)">
              <input
                type="number"
                min="0"
                max="100"
                value={formData.leadScore}
                onChange={(e) => handleChange('leadScore', Number(e.target.value))}
                placeholder="0"
                className={cn(inputClass, 'h-9')}
              />
            </Field>
          </div>
        </section>

        {/* Tags */}
        <section className="space-y-3 border-t border-border-subtle pt-5">
          <h4 className="label-technical text-text-muted">Tags</h4>
          {formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <Badge key={tag} tone="accent">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-0.5 hover:text-text-primary">
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Neues Tag hinzufügen…"
              className={cn(inputClass, 'h-9')}
            />
            <Button type="button" variant="secondary" onClick={addTag} className="shrink-0 px-3" aria-label="Tag hinzufügen">
              <Plus className="size-4" />
            </Button>
          </div>
        </section>

        {/* Notizen */}
        <section className="space-y-3 border-t border-border-subtle pt-5">
          <h4 className="label-technical text-text-muted">Notizen</h4>
          <textarea
            value={formData.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={4}
            placeholder="Zusätzliche Informationen über den Lead…"
            className={cn(inputClass, 'resize-none py-2')}
          />
        </section>
      </form>
    </Modal>
  );
}
