/**
 * Topbar nach dem Redesign vom 2026-07-30.
 *
 * Durchscheinend mit Weichzeichner, Brotkrumen mit "/", breites Suchfeld,
 * Aktionspillen und EINE gefüllte Verlaufsschaltfläche ("Neuer Lead").
 * Aufbau und Ziele sind unverändert — nur das Aussehen kommt vom Entwurf.
 */

import { Menu, LogOut, Search, ShieldCheck, RefreshCw, Plus, Sun, Moon } from 'lucide-react';
import { useState } from 'react';

import { getTheme, toggleTheme, type Theme } from '../../utils/theme';
import { IconButton } from '../ui-kit';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import type { User } from '../../utils/storage';
import { cn } from '../ui/utils';

/** Zurückhaltende Pille in der Kopfzeile — dieselbe Form wie im Admin. */
const NEBEN_PILLE = cn(
  'inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px]',
  'border border-overlay/[0.07] bg-overlay/[0.04] px-3.5 py-2.5',
  'text-[12px] font-semibold text-text-secondary transition-colors',
  'hover:bg-overlay/[0.07] hover:text-text-primary',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50',
);

/**
 * Feste Breite des Wechselknopfs.
 *
 * "Admin" und "CRM" sind unterschiedlich lang. Ohne feste Breite läge der
 * Wechsel im Admin-Dashboard ein paar Pixel woanders — nach dem Wechsel soll
 * der Zeiger auf dem Knopf zurück stehen. Gleicher Wert wie in
 * Admin-Dashboard/src/components/layout/AdminTopbar.tsx.
 */
const WECHSEL_BREITE = 'md:w-[104px] md:justify-center';

interface TopbarProps {
  title: string;
  user: User | null;
  onOpenMobileSidebar: () => void;
  onOpenPalette: () => void;
  /** Lädt geteilte Einstellungen + Daten der aktiven Ansicht neu. */
  onRefresh?: () => void;
  refreshing?: boolean;
  onLogout: () => void;
  /** Öffnet die Maske für einen neuen Lead. */
  onNewLead?: () => void;
}

export function Topbar({ title, user, onOpenMobileSidebar, onOpenPalette, onRefresh, refreshing, onLogout, onNewLead }: TopbarProps) {
  const [theme, setTheme] = useState<Theme>(() => getTheme());
  const name = user?.name || user?.username || 'Admin';
  const initials = name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center gap-2.5 border-b border-border-subtle bg-canvas/95 px-3 py-3.5 supports-[backdrop-filter]:bg-canvas/[0.82] supports-[backdrop-filter]:backdrop-blur-[18px] md:px-8"
      role="banner"
    >
      <IconButton className="md:hidden" onClick={onOpenMobileSidebar} aria-label="Navigation öffnen">
        <Menu size={18} />
      </IconButton>

      {/* Breadcrumb / Titel */}
      <nav aria-label="Breadcrumb" className="flex min-w-0 shrink-0 items-center gap-2 text-[12px] font-medium">
        <span className="hidden text-text-muted sm:inline">CRM</span>
        <span aria-hidden className="hidden shrink-0 text-border-strong sm:inline">/</span>
        <span className="truncate font-bold text-text-primary" aria-current="page">
          {title}
        </span>
      </nav>

      <div className="min-w-0 flex-1" />

      {/* Suchfeld nach dem Entwurf. Der Platzhaltertext nennt, wonach man
          suchen kann — "Suchen…" liess offen, ob Firmen, Kontakte oder Mails
          gemeint sind. */}
      <button
        type="button"
        onClick={onOpenPalette}
        className="inline-flex min-w-0 items-center gap-[9px] rounded-[10px] border border-overlay/[0.07] bg-overlay/[0.04] px-3 py-2.5 transition-colors hover:border-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 lg:w-[300px]"
        aria-label="Befehlspalette öffnen"
      >
        <Search size={16} className="shrink-0 text-text-muted" aria-hidden />
        <span className="hidden min-w-0 flex-1 truncate text-left text-[12px] font-medium text-text-muted lg:inline">
          Firma, Kontakt, E-Mail…
        </span>
        <kbd className="hidden shrink-0 items-center rounded-[5px] bg-overlay/[0.06] px-1.5 py-[3px] font-mono text-[10px] font-medium text-text-muted md:inline-flex">
          ⌘K
        </kbd>
      </button>

      {/* Aktualisieren — holt geteilte Einstellungen (Status/Pipeline) + Daten neu */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className={cn(NEBEN_PILLE, 'disabled:opacity-60')}
          title="Daten & Einstellungen neu laden"
          aria-label="Aktualisieren"
        >
          <RefreshCw size={15} className={cn('shrink-0 text-text-tertiary', refreshing && 'animate-spin')} />
          <span className="hidden lg:inline">Aktualisieren</span>
        </button>
      )}

      {/* Hell/Dunkel. Ein Knopf, kein Menü: es gibt zwei Zustände, und ein
          Aufklappmenü für zwei Einträge ist ein Klick zu viel. Das Symbol
          zeigt, was NACH dem Klick kommt — so halten es Browser und
          Betriebssysteme. */}
      <button
        type="button"
        onClick={() => setTheme(toggleTheme())}
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] border border-overlay/[0.07] bg-overlay/[0.04] text-text-tertiary transition-colors hover:bg-overlay/[0.07] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
        aria-label={theme === 'dark' ? 'Zu hellem Erscheinungsbild wechseln' : 'Zu dunklem Erscheinungsbild wechseln'}
        title={theme === 'dark' ? 'Helles Erscheinungsbild' : 'Dunkles Erscheinungsbild'}
      >
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      {/* Neuer Lead — die EINZIGE gefüllte Fläche in der Kopfzeile, wie im
          Entwurf. Der Verlauf läuft von accent-600 nach 700 und nicht von 500
          aus: Weiss auf accent-500 ergibt nur 3,16 Kontrast. */}
      {onNewLead && (
        <button
          type="button"
          onClick={onNewLead}
          className={cn(
            'inline-flex shrink-0 items-center gap-[7px] whitespace-nowrap rounded-[10px]',
            'bg-gradient-to-br from-accent-600 to-accent-700 px-3.5 py-2.5',
            'text-[12px] font-bold text-white',
            /* Der Verlauf bleibt UNVERÄNDERT und es wird nur der Schatten
               überblendet.

               Vorher stand hier `transition-all` mit einem Verlaufswechsel beim
               Überfahren. Verläufe kann kein Browser stufenlos überblenden — er
               springt hart. Beim Klick fallen Überfahren, Gedrückt und Fokusring
               zusammen, und man sieht das Springen als Flackern. Genau das war
               zu sehen.

               Ein Schatten ist überblendbar, deshalb bleibt er. */
            'shadow-[0_6px_20px_rgba(92,141,255,0.34)]',
            'transition-shadow duration-150 hover:shadow-[0_8px_26px_rgba(92,141,255,0.5)]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50',
          )}
        >
          <Plus size={15} className="shrink-0" />
          <span className="hidden sm:inline">Neuer Lead</span>
        </button>
      )}

      {/* Workspace-Wechsel → Admin-Panel (separate App/Domain)

          Sitzt UNMITTELBAR links vom Avatar und hat eine feste Breite — im
          Admin-Dashboard steht der Wechsel hierher ("CRM") an genau derselben
          Stelle mit genau derselben Breite. Wer dort klickt, hat den Zeiger
          danach direkt auf diesem Knopf. Der Wert steht in beiden Anwendungen
          als WECHSEL_BREITE; wer ihn ändert, muss es dort auch tun. */}
      <a
        href="https://admin.partsunion.de"
        className={cn(NEBEN_PILLE, WECHSEL_BREITE)}
        title="Zum Admin-Panel wechseln"
      >
        <ShieldCheck size={15} className="shrink-0 text-accent-500" />
        <span className="hidden md:inline">Admin</span>
      </a>

      {/* User-Menü — 1:1 wie im Admin: Avatar-Quadrat öffnet Dropdown mit Abmelden */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="ml-1 inline-flex size-[34px] shrink-0 items-center justify-center rounded-full border border-overlay/10 bg-gradient-to-br from-elevated-hover to-surface font-display text-[12px] font-bold text-text-secondary transition-[color,box-shadow] duration-150 hover:text-text-primary hover:ring-2 hover:ring-accent-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50"
            aria-label="Benutzermenü"
          >
            {initials}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-56">
          <DropdownMenuLabel className="flex flex-col">
            <span className="text-sm font-medium text-text-primary">{name}</span>
            <span className="text-xs text-text-muted">{user?.role || 'Admin'}</span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className="flex cursor-pointer items-center gap-2 text-status-danger focus:text-status-danger"
          >
            <LogOut size={14} /> Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
