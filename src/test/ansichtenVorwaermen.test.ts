/**
 * Jede nachgeladene Ansicht wird auch vorgewärmt.
 *
 * ─── Warum das leicht auseinanderläuft ─────────────────────────────────────
 *
 * Die Ansichten liegen je in einem eigenen Teilbündel. Das ist richtig — beim
 * Anmelden lädt so nur die Übersicht statt aller neun. Der Preis ist, dass der
 * ERSTE Klick auf eine Ansicht auf einen Download wartet. Bei den Berichten
 * sind das 430 KB, und genau so fühlt es sich an: man drückt, und eine
 * Sekunde lang passiert nichts.
 *
 * `ansichtenVorwaermen` holt die Bündel deshalb im Leerlauf nach dem ersten
 * Bild. Wer später eine zehnte Ansicht hinzufügt, denkt an das `lazy(...)`
 * und nicht an die Liste darunter — und dann ist genau diese eine Ansicht
 * wieder langsam, während alle anderen sofort da sind. Das ist der
 * unangenehmste Fehler: er sieht nach Zufall aus.
 *
 * Der Test vergleicht beide Listen gegeneinander. Er prüft die Quelle, nicht
 * das Verhalten — er soll ja gerade bei einer Ansicht anschlagen, die es
 * heute noch nicht gibt.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const APP = readFileSync('src/app/App.tsx', 'utf8');
const QUELLE = readFileSync('src/app/vorwaermen.ts', 'utf8');
const SIDEBAR = readFileSync('src/app/components/layout/Sidebar.tsx', 'utf8');

/** Namen aus `lazy(() => import('./components/X')...)` in App.tsx. */
function nachgeladen(): string[] {
    return [...APP.matchAll(/lazy\(\s*\(\)\s*=>\s*\r?\n?\s*import\('\.\/components\/(\w+)'\)/g)]
        .map((t) => t[1]);
}

/** Namen aus dem Rumpf von `ansichtenVorwaermen`. */
function vorgewaermt(): string[] {
    const start = QUELLE.indexOf('function ansichtenVorwaermen(');
    const ende = QUELLE.indexOf('\n}', start);
    return [...QUELLE.slice(start, ende).matchAll(/import\('\.\/components\/(\w+)'\)/g)]
        .map((t) => t[1]);
}

describe('Vorwärmen der Ansichten', () => {
    it('findet ueberhaupt Ansichten (sonst prueft der Test nichts)', () => {
        expect(nachgeladen().length).toBeGreaterThanOrEqual(8);
    });

    it('waermt jede nachgeladene Ansicht vor — bis auf zwei', () => {
        // Die Uebersicht ist die Startansicht; sie ist schon da, wenn das
        // Vorwaermen losgeht. Die Berichte bringen 430 KB Diagrammbibliothek
        // mit und werden erst beim Ueberfahren geholt — sonst zahlt jeder
        // dafuer, der nie hinwill.
        const fehlen = nachgeladen()
            .filter((n) => n !== 'Dashboard' && n !== 'ReportsView')
            .filter((n) => !vorgewaermt().includes(n));
        expect(
            fehlen,
            `nicht vorgewaermt: ${fehlen.join(', ')} — der erste Klick darauf `
            + 'wartet auf einen Download, waehrend alle anderen sofort da sind',
        ).toEqual([]);
    });

    it('waermt nichts vor, das es gar nicht mehr gibt', () => {
        const ueberzaehlig = vorgewaermt().filter((n) => !nachgeladen().includes(n));
        expect(ueberzaehlig, 'holt ein Buendel, das keine Ansicht mehr ist').toEqual([]);
    });

    it('laeuft im Leerlauf und nicht sofort', () => {
        // Sofort geholt, konkurriert es mit dem, was der Nutzer gerade sieht.
        const rumpf = QUELLE.slice(QUELLE.indexOf('function ansichtenVorwaermen('));
        expect(rumpf).toContain('requestIdleCallback');
        // Safari kennt requestIdleCallback bis heute nicht.
        expect(rumpf).toContain('setTimeout');
    });

    it('wird nach dem Anmelden auch aufgerufen', () => {
        expect(APP).toMatch(/ansichtenVorwaermen\(\);/);
    });

    it('die Berichte haengen am Ueberfahren des Knopfes', () => {
        // Sonst waeren sie gar nicht vorgewaermt und der erste Klick wartet
        // auf 430 KB — schlimmer als der Zustand vorher.
        expect(QUELLE).toMatch(/export function berichteVorwaermen/);
        expect(SIDEBAR, 'die Seitenleiste ruft es nicht auf')
            .toMatch(/onMouseEnter=\{item\.view === 'reports' \? berichteVorwaermen/);
        // Auch ueber die Tastatur erreichbar, nicht nur mit der Maus.
        expect(SIDEBAR).toMatch(/onFocus=\{item\.view === 'reports' \? berichteVorwaermen/);
    });

    it('das Vorwaermen liegt NICHT in App.tsx', () => {
        // App.tsx importiert die Seitenleiste; wenn die Seitenleiste
        // zurueckimportiert, entsteht ein Ringschluss. Der funktioniert bei
        // Funktionsdeklarationen zufaellig — bis jemand eine Konstante daraus
        // macht und der Fehler auf die falsche Datei zeigt.
        expect(APP).not.toMatch(/export function (ansichten|berichte)Vorwaermen/);
    });
});
