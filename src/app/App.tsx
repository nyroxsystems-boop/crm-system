import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Login } from './components/Login';
import { Sidebar, VIEW_LABELS, type ViewId } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { isLoggedIn, logout, getCurrentUser, syncSettingsFromServer } from './utils/storage';
import { vergessen } from './utils/zwischenspeicher';
import { ansichtenVorwaermen } from './vorwaermen';

/**
 * Die Befehlspalette oeffnet erst auf ⌘K. Sie eager zu laden hiess: die
 * Bewegungsbibliothek (AnimatePresence) beim Start mitzuziehen, fuer ein
 * Fenster, das die meisten nie aufmachen.
 */
const CommandPalette = lazy(() =>
  import('./components/CommandPalette').then(({ CommandPalette }) => ({ default: CommandPalette })),
);

const Dashboard = lazy(() => import('./components/Dashboard').then(({ Dashboard }) => ({ default: Dashboard })));
const LeadsView = lazy(() => import('./components/LeadsView').then(({ LeadsView }) => ({ default: LeadsView })));
const PipelineView = lazy(() =>
  import('./components/PipelineView').then(({ PipelineView }) => ({ default: PipelineView })),
);
const ScraperView = lazy(() => import('./components/ScraperView').then(({ ScraperView }) => ({ default: ScraperView })));
const ReportsView = lazy(() => import('./components/ReportsView').then(({ ReportsView }) => ({ default: ReportsView })));
const KalenderView = lazy(() =>
  import('./components/KalenderView').then(({ KalenderView }) => ({ default: KalenderView })),
);
const Settings = lazy(() => import('./components/Settings').then(({ Settings }) => ({ default: Settings })));
const UserManagement = lazy(() =>
  import('./components/UserManagement').then(({ UserManagement }) => ({ default: UserManagement })),
);
const PipelineSettings = lazy(() =>
  import('./components/PipelineSettings').then(({ PipelineSettings }) => ({ default: PipelineSettings })),
);

export type LeadAction = 'new' | 'import' | null;

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [pendingLeadAction, setPendingLeadAction] = useState<LeadAction>(null);
  // Lead, der beim Wechsel auf die Leads-Ansicht direkt geöffnet werden soll
  // (Sprung aus Kalender/Tagesplan in die Lead-Maske).
  const [pendingLeadId, setPendingLeadId] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  // Bump erzwingt Remount der aktiven Ansicht → alle Daten + Settings frisch.
  const [refreshTick, setRefreshTick] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const currentUser = getCurrentUser();

  // Geteilte Einstellungen (Status/Pipeline/Quellen) beim Start vom Server holen —
  // sonst sieht jeder Browser nur seinen eigenen localStorage-Stand.
  useEffect(() => {
    if (!loggedIn) return;
    void syncSettingsFromServer().then((changed) => { if (changed) setRefreshTick((t) => t + 1); });
    ansichtenVorwaermen();
  }, [loggedIn]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // ZUERST den Zwischenspeicher leeren, dann neu aufbauen. Andersherum
    // baeke der Neuaufbau die eben gemerkten Daten wieder ein und der Knopf
    // wuerde sich drehen, ohne irgendetwas zu holen.
    vergessen();
    try { await syncSettingsFromServer(); } finally {
      setRefreshTick((t) => t + 1);
      setRefreshing(false);
    }
  }, []);

  const openLead = useCallback((leadId: string) => {
    setActiveView('leads');
    setPendingLeadId(leadId);
  }, []);

  // ⌘K / Ctrl+K → Command Palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!loggedIn) {
    return <Login onLogin={() => setLoggedIn(true)} />;
  }

  const triggerLeadAction = (action: Exclude<LeadAction, null>) => {
    setActiveView('leads');
    setPendingLeadAction(action);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas text-text-primary">
      <Sidebar
        activeView={activeView}
        onNavigate={setActiveView}
        mobileOpen={mobileOpen}
        onMobileOpenChange={setMobileOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          title={VIEW_LABELS[activeView]}
          user={currentUser}
          onOpenMobileSidebar={() => setMobileOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onNewLead={() => triggerLeadAction('new')}
          onLogout={() => {
            logout();
            setLoggedIn(false);
          }}
        />

        <main className="flex-1 overflow-auto" role="main">
          {/* Einblendung als CSS statt ueber die Bewegungsbibliothek — siehe
              .ansicht-herein in premium.css. Der `key` bleibt: er sorgt fuer
              den Neuaufbau beim Wechsel, und damit laeuft die Animation
              ueberhaupt erst an. */}
          <div key={`${activeView}:${refreshTick}`} className="ansicht-herein h-full">
            <Suspense
              fallback={
                <div className="flex h-full min-h-48 items-center justify-center text-sm text-text-muted" role="status">
                  Ansicht wird geladen…
                </div>
              }
            >
              {activeView === 'dashboard' && <Dashboard onOpenKalender={() => setActiveView('kalender')} onOpenLead={openLead} onOpenLeads={() => setActiveView('leads')} />}
              {activeView === 'leads' && (
                <LeadsView
                  pendingAction={pendingLeadAction}
                  onPendingHandled={() => setPendingLeadAction(null)}
                  pendingLeadId={pendingLeadId}
                  onPendingLeadHandled={() => setPendingLeadId(null)}
                />
              )}
              {activeView === 'pipeline' && <PipelineView />}
              {activeView === 'scraper' && <ScraperView />}
              {activeView === 'reports' && <ReportsView />}
              {activeView === 'kalender' && <KalenderView onOpenLead={openLead} />}
              {activeView === 'settings' && <Settings />}
              {activeView === 'users' && <UserManagement />}
              {activeView === 'pipelineSettings' && <PipelineSettings />}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Ohne Rueckfall-Anzeige: bis das Buendel da ist, soll gar nichts zu
          sehen sein — ein Ladehinweis mitten auf dem Bildschirm waere
          stoerender als die Palette einen Wimpernschlag spaeter. */}
      <Suspense fallback={null}>
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={setActiveView}
        onNewLead={() => triggerLeadAction('new')}
        onImport={() => triggerLeadAction('import')}
      />
      </Suspense>
    </div>
  );
}
