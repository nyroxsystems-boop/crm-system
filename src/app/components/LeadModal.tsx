import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { type Lead } from '../utils/storage';
import { getSettings } from '../utils/storage';
import { CustomSelect } from './CustomSelect';

interface LeadModalProps {
  lead: Lead | null;
  onClose: () => void;
  onSave: (lead: Partial<Lead>) => void;
}

export function LeadModal({ lead, onClose, onSave }: LeadModalProps) {
  const settings = getSettings();
  const [formData, setFormData] = useState({
    company: lead?.company || '',
    contactPerson: lead?.contactPerson || '',
    email: lead?.email || '',
    phone: lead?.phone || '',
    website: lead?.website || '',
    industry: lead?.industry || '',
    city: lead?.city || '',
    country: lead?.country || '',
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

  // Prevent body scroll when modal is open
  useState(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...lead,
      ...formData,
    });
  };

  const handleChange = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      handleChange('tags', [...formData.tags, newTag]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    handleChange('tags', formData.tags.filter(t => t !== tag));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-start justify-center z-50 overflow-y-auto"
      onClick={onClose}
    >
      <div className="min-h-full w-full flex items-center justify-center p-4 py-8">
        <div 
          className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900">
                {lead ? 'Lead bearbeiten' : 'Neuer Lead'}
              </h3>
              <p className="text-gray-500 mt-1 text-sm">Geben Sie die Lead-Details ein</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Basisinformationen</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Firma / Händler *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => handleChange('company', e.target.value)}
                    placeholder="z.B. Müller Autoteile GmbH"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kontaktperson *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.contactPerson}
                    onChange={(e) => handleChange('contactPerson', e.target.value)}
                    placeholder="z.B. Max Mustermann"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    E-Mail *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="max@beispiel.de"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+49 123 456789"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www.beispiel.de"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branche
                  </label>
                  <CustomSelect
                    value={formData.industry}
                    onChange={(value) => handleChange('industry', value)}
                    options={settings.industries}
                    placeholder="Branche wählen..."
                  />
                </div>
              </div>
            </div>

            {/* Address Info */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Adressinformationen</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Straße und Hausnummer"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stadt
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="z.B. Mnchen"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Land
                  </label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    placeholder="z.B. Deutschland"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Sales Info */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Vertriebsinformationen</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <CustomSelect
                    value={formData.status}
                    onChange={(value) => handleChange('status', value)}
                    options={settings.statuses}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quelle
                  </label>
                  <CustomSelect
                    value={formData.source}
                    onChange={(value) => handleChange('source', value)}
                    options={settings.sources}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geschätzter Wert (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.value}
                    onChange={(e) => handleChange('value', Number(e.target.value))}
                    placeholder="z.B. 5000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priorität
                  </label>
                  <CustomSelect
                    value={formData.priority}
                    onChange={(value) => handleChange('priority', value)}
                    options={['Niedrig', 'Mittel', 'Hoch']}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zugewiesen an
                  </label>
                  <input
                    type="text"
                    value={formData.assignedTo}
                    onChange={(e) => handleChange('assignedTo', e.target.value)}
                    placeholder="Vertriebsmitarbeiter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nächstes Follow-up
                  </label>
                  <input
                    type="date"
                    value={formData.nextFollowUpDate}
                    onChange={(e) => handleChange('nextFollowUpDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.leadScore}
                    onChange={(e) => handleChange('leadScore', Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Tags</h4>
              
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-purple-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Neues Tag hinzufügen..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Notizen</h4>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={4}
                placeholder="Zusätzliche Informationen über den Lead..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7c3aed] focus:ring-opacity-20 focus:border-[#7c3aed] transition-all resize-none text-sm"
              />
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-all font-medium text-sm"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg hover:bg-[#6d28d9] transition-all font-medium text-sm"
              >
                {lead ? 'Aktualisieren' : 'Lead erstellen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}