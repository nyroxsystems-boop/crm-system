import { useState } from 'react';
import { Lock, User } from 'lucide-react';
import { authenticate } from '../utils/storage';
import { Input } from './ui/input';
import { Label } from './ui/label';

/**
 * Login — Partsunion CRM.
 *
 * Visuell 1:1 identisch zum Admin-Dashboard Login (LoginView.tsx).
 * Gleiche Tailwind-Klassen, gleiche Bubble-Strukturen, gleiche shadcn-Inputs.
 * Einziger inhaltlicher Unterschied: Titel „Partsunion · CRM" statt „· Admin".
 */

interface LoginProps {
    onLogin: () => void;
}

export function Login({ onLogin }: LoginProps) {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const trimmed = identifier.trim();
    const canSubmit = trimmed.length >= 3 && password.length > 0 && !busy;

    async function submit(e: React.FormEvent): Promise<void> {
        e.preventDefault();
        if (!canSubmit) return;
        setBusy(true);
        setError(null);

        try {
            const user = await authenticate(trimmed, password);
            if (user) {
                onLogin();
            } else {
                setError('Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.');
            }
        } catch {
            setError('Anmeldung fehlgeschlagen. Bitte später erneut versuchen.');
        } finally {
            setBusy(false);
        }
    }

    return (
        <main
            role="main"
            className="min-h-screen flex items-center justify-center px-4"
            style={{ background: 'var(--bg-canvas)' }}
        >
            <div
                className="w-full max-w-md rounded-md p-8"
                style={{
                    // Tokenbasiert statt fixem Dunkel-Glas — funktioniert in Light UND Dark.
                    background: 'color-mix(in srgb, var(--bg-surface) 65%, transparent)',
                    border: '1px solid var(--border-strong)',
                }}
            >
                <header className="mb-6 text-center">
                    <h1
                        className="text-xl font-semibold tracking-tight"
                        style={{
                            color: 'var(--text-primary)',
                            fontFamily: '"Inter Variable", "Inter", system-ui, sans-serif',
                            letterSpacing: '-0.01em',
                        }}
                    >
                        Partsunion · CRM
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                        Bitte melde dich an.
                    </p>
                </header>

                <form onSubmit={submit} className="space-y-4" noValidate>
                    <div className="space-y-2">
                        <Label htmlFor="login-id" style={{ color: 'var(--text-primary)' }}>
                            Benutzername oder E-Mail
                        </Label>
                        <div className="relative">
                            <User
                                className="size-4 absolute left-3 top-1/2 -translate-y-1/2 z-10"
                                style={{ color: 'var(--text-muted)' }}
                            />
                            <Input
                                id="login-id"
                                type="text"
                                autoComplete="username"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                className="pl-9 focus-visible:ring-2"
                                placeholder="admin oder admin@partsunion.de"
                                autoCapitalize="off"
                                autoCorrect="off"
                                spellCheck={false}
                                required
                                style={{
                                    background: 'var(--bg-canvas)',
                                    border: '1px solid rgba(232, 236, 241, 0.12)',
                                    color: 'var(--text-primary)',
                                    height: '40px',
                                    borderRadius: '8px',
                                }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="login-pw" style={{ color: 'var(--text-primary)' }}>
                            Passwort
                        </Label>
                        <div className="relative">
                            <Lock
                                className="size-4 absolute left-3 top-1/2 -translate-y-1/2 z-10"
                                style={{ color: 'var(--text-muted)' }}
                            />
                            <Input
                                id="login-pw"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="pl-9 focus-visible:ring-2"
                                style={{
                                    background: 'var(--bg-canvas)',
                                    border: '1px solid rgba(232, 236, 241, 0.12)',
                                    color: 'var(--text-primary)',
                                    height: '40px',
                                    borderRadius: '8px',
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div role="alert" className="text-sm" style={{ color: 'var(--danger)' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                        style={{
                            background: 'var(--accent-500)',
                            color: '#FFFFFF',
                            height: '40px',
                            paddingLeft: '16px',
                            paddingRight: '16px',
                        }}
                    >
                        {busy ? 'Anmelden…' : 'Anmelden'}
                    </button>
                </form>

                {/*
                  Kein „Passwort vergessen?"-Link: Dieses interne Operator-CRM ist ein
                  reines SPA ohne Router — /reset-password war ein toter Pfad (lädt nur
                  wieder das SPA) und es gibt hier keine Reset-Abschluss-Maske. Ein Link,
                  der ins Leere führt, ist schlechtere UX als keiner. Admin-Passwörter
                  werden out-of-band zurückgesetzt (Backend /api/admin-auth/request-reset
                  + reset-password ohne FE hier). Erst wieder anzeigen, wenn der komplette
                  Reset-Flow (E-Mail anfordern → Token → neues Passwort) gebaut ist.
                */}
            </div>
        </main>
    );
}
