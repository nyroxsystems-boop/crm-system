/**
 * Die Teilbündel der Ansichten vorab holen.
 *
 * ─── Warum ────────────────────────────────────────────────────────────────
 *
 * Jede Ansicht liegt in einem eigenen Bündel — gut, denn beim Anmelden lädt
 * so nur die Übersicht. Der Preis: der ERSTE Klick auf eine Ansicht wartet
 * auf einen Download, bevor überhaupt etwas passieren kann. Genau das fühlt
 * sich an wie ein Knopf, der hängt: man drückt, und eine Sekunde lang tut
 * sich nichts.
 *
 * Nach dem ersten Bild ist die Leitung frei. Dann holen wir nach, und jeder
 * spätere Klick findet sein Bündel bereits vor.
 *
 * ─── Warum das eine eigene Datei ist ──────────────────────────────────────
 *
 * Es stand in App.tsx. Die Seitenleiste braucht `berichteVorwaermen` beim
 * Überfahren — und App.tsx importiert die Seitenleiste. Der Ringschluss
 * funktioniert zwar (Funktionsdeklarationen werden hochgezogen), aber er ist
 * eine Falle: sobald jemand daraus eine Konstante macht, ist sie beim ersten
 * Zugriff undefiniert, und der Fehler zeigt auf die falsche Datei.
 */

/**
 * Alle Ansichten bis auf die Berichte, sobald der Rechner Luft hat.
 *
 * `requestIdleCallback`, damit das Nachladen nicht mit dem konkurriert, was
 * gerade auf dem Bildschirm entsteht. Safari kennt es bis heute nicht —
 * daher der Rückfall auf einen Zeitgeber.
 *
 * Fehler werden verschluckt: schlägt ein Vorabruf fehl, versucht es der
 * echte Klick später erneut. Ein unbehandelter Fehlschlag im Hintergrund
 * würde nur die Konsole vollschreiben, ohne dass jemand etwas davon hat.
 *
 * ─── Warum die Berichte NICHT dabei sind ──────────────────────────────────
 *
 * Sie bringen die Diagrammbibliothek mit: 429 KB, mehr als alles andere hier
 * zusammen. Die bei jeder Anmeldung im Hintergrund zu ziehen — auch für alle,
 * die nie auf „Berichte" klicken — ist genau die Sorte Verbesserung, die
 * woanders Kosten verursacht. Auf einer Mobilverbindung wäre es Datenvolumen
 * für nichts.
 *
 * Die Regel dahinter: vorgewärmt wird, was über eine TASTE erreichbar ist
 * oder klein genug, dass es nicht auffällt. Was gross ist UND einen Knopf
 * hat, den man überfahren kann, hängt am Überfahren — dort liegen ein paar
 * hundert Millisekunden, die sonst ungenutzt verstreichen.
 */
export function ansichtenVorwaermen(): void {
    const holen = () => {
        void import('./components/LeadsView').catch(() => {});
        void import('./components/KalenderView').catch(() => {});
        void import('./components/PipelineView').catch(() => {});
        void import('./components/ScraperView').catch(() => {});
        void import('./components/Settings').catch(() => {});
        void import('./components/UserManagement').catch(() => {});
        void import('./components/PipelineSettings').catch(() => {});
        // Die Befehlspalette bleibt wegen cmdk nachgeladen. Sie ist trotzdem
        // im Leerlauf dabei, weil sie ueber ⌘K aufgeht: eine Tastenkombination
        // bietet kein Ueberfahren, auf das man das Holen legen koennte.
        void import('./components/CommandPalette').catch(() => {});
    };
    const ric = (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback;
    if (typeof ric === 'function') ric(holen);
    else window.setTimeout(holen, 1200);
}

/**
 * Die Berichte — erst beim Überfahren des Knopfes.
 *
 * Zwischen Überfahren und Klicken liegen typischerweise ein paar hundert
 * Millisekunden. Die reichen für den grössten Teil der 430 KB, und niemand
 * zahlt dafür, der nicht hinwill.
 *
 * Mehrfach aufzurufen ist harmlos: der Browser gibt beim zweiten Mal
 * dasselbe Versprechen zurück, ohne erneut zu laden.
 */
export function berichteVorwaermen(): void {
    void import('./components/ReportsView').catch(() => {});
}
