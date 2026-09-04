/**
 * CommandPalette (⌘K) — schnelle Navigation + Aktionen, wie im Admin-Dashboard.
 * Lean auf cmdk, dark-getokent.
 */
import { Command } from 'cmdk';
import {
  LayoutDashboard, Users, Workflow, Mail, BarChart3, Settings as SettingsIcon,
  UserCog, Layers, Plus, Upload, Search, Radar, Calendar,
} from 'lucide-react';
import type { ViewId } from './layout/Sidebar';
import { motion, AnimatePresence } from 'motion/react';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewId) => void;
  onNewLead: () => void;
  onImport: () => void;
}

const NAV: { view: ViewId; label: string; icon: typeof LayoutDashboard; kw?: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, kw: 'übersicht home start' },
  { view: 'leads', label: 'Leads', icon: Users, kw: 'kontakte firmen' },
  { view: 'pipeline', label: 'Pipeline', icon: Workflow, kw: 'kanban stages board' },
  { view: 'scraper', label: 'Lead-Scraper', icon: Radar, kw: 'scraper osm umkreis autoteilehändler leads finden' },
  { view: 'reports', label: 'Berichte', icon: BarChart3, kw: 'analytics statistik funnel' },
  /* Der Kalender FEHLTE hier, obwohl er in der Seitenleiste steht und
     eine eigene Ansicht ist. Wer ihn über das Suchfeld erreichen wollte,
     fand nichts — und schloss daraus vermutlich, dass es ihn nicht gibt.
     Eine Suche, die eine vorhandene Seite verschweigt, ist schlimmer als
     keine: sie beantwortet die Frage falsch statt gar nicht. */
  { view: 'kalender', label: 'Kalender', icon: Calendar, kw: 'termine kalender follow-up wiedervorlage' },
  { view: 'settings', label: 'Einstellungen', icon: SettingsIcon },
  { view: 'users', label: 'Benutzerverwaltung', icon: UserCog, kw: 'team' },
  { view: 'pipelineSettings', label: 'Pipeline-Setup', icon: Layers, kw: 'stages' },
];

export function CommandPalette({ open, onClose, onNavigate, onNewLead, onImport }: CommandPaletteProps) {
  const go = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 p-4 pt-[12vh] backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-xl overflow-hidden rounded-xl border border-border-subtle bg-surface shadow-modal"
          >
            <Command
              label="Befehle"
              className="[&_[cmdk-group-heading]]:label-technical [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-text-muted"
            >
              <div className="flex items-center gap-2 border-b border-border-subtle px-3">
                <Search className="size-4 shrink-0 text-text-muted" />
                <Command.Input
                  autoFocus
                  placeholder="Suchen oder Befehl eingeben…"
                  className="h-12 w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                />
                <kbd className="rounded border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-muted">ESC</kbd>
              </div>
              <Command.List className="max-h-[55vh] overflow-y-auto p-2">
                <Command.Empty className="px-3 py-8 text-center text-sm text-text-muted">
                  Keine Treffer.
                </Command.Empty>

                <Command.Group heading="Navigation">
                  {NAV.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.view}
                        value={`${item.label} ${item.kw ?? ''}`}
                        onSelect={() => go(() => onNavigate(item.view))}
                        className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-secondary data-[selected=true]:bg-elevated data-[selected=true]:text-text-primary"
                      >
                        <Icon className="size-4 text-text-muted" />
                        {item.label}
                      </Command.Item>
                    );
                  })}
                </Command.Group>

                <Command.Group heading="Aktionen">
                  <Command.Item
                    value="Neuer Lead anlegen erstellen"
                    onSelect={() => go(onNewLead)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-secondary data-[selected=true]:bg-elevated data-[selected=true]:text-text-primary"
                  >
                    <Plus className="size-4 text-accent-500" />
                    Neuer Lead
                  </Command.Item>
                  <Command.Item
                    value="Leads importieren csv"
                    onSelect={() => go(onImport)}
                    className="flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-text-secondary data-[selected=true]:bg-elevated data-[selected=true]:text-text-primary"
                  >
                    <Upload className="size-4 text-text-muted" />
                    Leads importieren
                  </Command.Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
