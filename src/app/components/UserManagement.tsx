import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Users as UsersIcon, Shield, UserCheck, UserX, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, saveUser, deleteUser, type User } from '../utils/storage';
import { CustomSelect } from './CustomSelect';
import {
  Card, PageHeader, StatCard, Button, IconButton, Badge, Field, Modal, inputClass, cn, SEITEN_RAND,
} from './ui-kit';

// EHRLICHKEIT: Dieses CRM hat KEINE eigene Server-seitige Benutzerverwaltung. Der
// Login läuft gegen die zentrale Admin-Auth des Bots (siehe storage.ts:authenticate);
// hier angelegte „Benutzer" existieren NUR lokal im Browser (localStorage) und können
// sich damit NICHT einloggen. Solange keine CRM-fähige Admin-User-API erreichbar ist,
// ist diese Ansicht daher ehrlich als „lokale Rollen-Notiz" gekennzeichnet:
//   • kein Passwort-Feld (würde einen echten Login-Account vortäuschen),
//   • keine „kann sich anmelden"-Aussage,
//   • klarer Hinweis, dass echte Zugänge zentral vergeben werden.
export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '', name: '', email: '', phone: '', role: 'Vertrieb', active: true,
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => setUsers(getUsers());

  const handleOpenModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username, name: user.name, email: user.email || '',
        phone: user.phone || '', role: user.role, active: user.active,
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', name: '', email: '', phone: '', role: 'Vertrieb', active: true });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.username || !formData.name) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }
    // Bewusst OHNE Passwort: kein echter Login-Account, nur lokale Rollen-Notiz.
    saveUser({
      username: formData.username, name: formData.name, email: formData.email,
      phone: formData.phone, role: formData.role, active: formData.active,
    });
    loadUsers();
    setIsModalOpen(false);
    toast.success(editingUser ? 'Eintrag aktualisiert.' : `Eintrag „${formData.name}" gespeichert (lokal).`);
  };

  const handleDelete = (username: string) => {
    if (username === 'admin') {
      toast.error('Der Admin-Eintrag kann nicht gelöscht werden.');
      return;
    }
    if (confirm('Möchten Sie diesen Eintrag wirklich löschen?')) {
      deleteUser(username);
      loadUsers();
      toast.success('Eintrag gelöscht.');
    }
  };

  const activeUsers = users.filter((u) => u.active).length;
  const inactiveUsers = users.filter((u) => !u.active).length;

  return (
    <div className={cn(SEITEN_RAND, 'space-y-5')}>
      <PageHeader
        title="Team-Notizen"
        subtitle="Lokale Rollen-Übersicht des Vertriebsteams (kein Login-Account)."
        actions={
          <Button onClick={() => handleOpenModal()}>
            <Plus className="size-4" />
            Neuer Eintrag
          </Button>
        }
      />

      {/* Ehrlicher Hinweis: keine echten Zugänge. */}
      <div className="flex items-start gap-3 rounded-lg border border-status-info/30 bg-status-info/10 px-4 py-3 text-sm text-status-info">
        <Info className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-medium">Lokale Rollen-Notiz — kein echter Login-Account</p>
          <p className="mt-0.5 text-text-secondary">
            Diese Liste dient nur als interne Übersicht über Teammitglieder und ihre
            Rollen und wird ausschließlich in diesem Browser gespeichert. Einträge hier
            erstellen keinen Zugang — der Login erfolgt zentral über das Plattform-Konto.
            Echte Zugänge werden von einer Administratorin/einem Administrator vergeben.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard icon={<UsersIcon className="size-4" />} label="Alle Einträge" value={users.length} />
        <StatCard icon={<UserCheck className="size-4" />} label="Aktiv" value={activeUsers} />
        <StatCard icon={<UserX className="size-4" />} label="Inaktiv" value={inactiveUsers} />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-elevated/50">
                {['Mitglied', 'Kontakt', 'Rolle', 'Status', 'Kürzel', ''].map((h, i) => (
                  <th key={i} className="label-technical px-5 py-3 text-left text-text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {users.map((user) => (
                <tr key={user.username} className="transition-colors hover:bg-elevated">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex size-9 items-center justify-center rounded-md font-semibold',
                          user.role === 'Admin'
                            ? 'bg-status-warning/15 text-status-warning'
                            : 'bg-accent-500/15 text-accent-500',
                        )}
                      >
                        {user.role === 'Admin' ? <Shield className="size-4" /> : user.name[0]}
                      </div>
                      <div>
                        <div className="font-medium text-text-primary">{user.name}</div>
                        {user.createdAt && (
                          <div className="text-xs text-text-muted">
                            seit {new Date(user.createdAt).toLocaleDateString('de-DE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {user.email && <div className="text-text-secondary">{user.email}</div>}
                    {user.phone && <div className="text-xs text-text-muted">{user.phone}</div>}
                    {!user.email && !user.phone && <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={user.role === 'Admin' ? 'warning' : 'accent'}>{user.role}</Badge>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={user.active ? 'success' : 'neutral'} dot>
                      {user.active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </td>
                  <td className="px-5 py-3">
                    <code className="rounded bg-elevated px-2 py-1 font-mono text-xs text-text-secondary">
                      {user.username}
                    </code>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1">
                      <IconButton className="size-8" onClick={() => handleOpenModal(user)} aria-label="Bearbeiten">
                        <Edit className="size-4" />
                      </IconButton>
                      {user.username !== 'admin' && (
                        <IconButton className="size-8" tone="danger" onClick={() => handleDelete(user.username)} aria-label="Löschen">
                          <Trash2 className="size-4" />
                        </IconButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          title={editingUser ? 'Eintrag bearbeiten' : 'Neuer Eintrag'}
          subtitle={editingUser ? 'Bearbeiten Sie die Team-Notiz.' : 'Erfassen Sie ein Teammitglied (lokale Notiz, kein Zugang).'}
          size="lg"
          footer={
            <>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleSave}>{editingUser ? 'Speichern' : 'Eintrag speichern'}</Button>
            </>
          }
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="space-y-6"
          >
            <div className="flex items-start gap-3 rounded-lg border border-status-info/30 bg-status-info/10 px-4 py-3 text-sm text-status-info">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p className="text-text-secondary">
                Dieser Eintrag erstellt keinen Login-Zugang. Er wird nur lokal als
                Rollen-Notiz gespeichert.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="label-technical text-text-muted">Basisinformationen</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Kürzel" required hint={editingUser ? 'Kann nicht geändert werden.' : 'Internes Kürzel, z.B. mschmidt.'}>
                  <input
                    type="text"
                    required
                    value={formData.username}
                    disabled={!!editingUser}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="z.B. mschmidt"
                    className={cn(inputClass, 'h-9 disabled:opacity-60')}
                  />
                </Field>
                <Field label="Vollständiger Name" required>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="z.B. Max Schmidt"
                    className={cn(inputClass, 'h-9')}
                  />
                </Field>
                <Field label="E-Mail">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="max@firma.de"
                    className={cn(inputClass, 'h-9')}
                  />
                </Field>
                <Field label="Telefon">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+49 123 456789"
                    className={cn(inputClass, 'h-9')}
                  />
                </Field>
              </div>
            </div>

            <div className="space-y-4 border-t border-border-subtle pt-5">
              <h4 className="label-technical text-text-muted">Rolle</h4>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Rolle" required>
                  <CustomSelect
                    value={formData.role}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                    options={['Vertrieb', 'Admin', 'Manager']}
                    disabled={editingUser?.username === 'admin'}
                  />
                </Field>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle bg-elevated/40 p-3">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="size-4 accent-[var(--accent-500)]"
                />
                <span className="text-sm font-medium text-text-primary">
                  Mitglied ist im Team aktiv
                </span>
              </label>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
