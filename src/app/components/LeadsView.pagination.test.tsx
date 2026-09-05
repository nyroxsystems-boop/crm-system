import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LeadsView } from './LeadsView';
const leads = Array.from({ length: 72 }, (_, i) => ({ id: String(i), company: `Firma ${String(i + 1).padStart(3, '0')}`, email: '', contactPerson: '', tags: [], status: 'Neu', createdAt: '2026-09-05', updatedAt: '2026-09-05' }));
vi.mock('../utils/storage', () => ({
  getLeads: async () => leads, getLeadLists: async () => [], getAppointmentAdmins: async () => [], getStatusOptions: () => ['Neu'],
  getCurrentUser: () => ({ id: 'pagination-test' }), getSettings: () => ({ pipelineStages: [] }),
}));
beforeEach(() => vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it('renders only one page and preserves explicit selection across page navigation', async () => {
  const { container } = render(<LeadsView />);
  await waitFor(() => expect(container.querySelectorAll('tbody tr')).toHaveLength(25));
  const table = container.querySelector('table')!;
  const navigation = within(screen.getByRole('navigation', { name: 'Lead-Ergebnisseiten' }));
  expect(table.querySelectorAll('tbody tr')).toHaveLength(25);
  fireEvent.click(table.querySelector('[aria-label="Alle Leads auf dieser Seite auswählen"]')!);
  expect(screen.getByText('25 ausgewählt')).toBeInTheDocument();
  fireEvent.click(navigation.getByRole('button', { name: 'Nächste Lead-Seite' }));
  expect(table.querySelector('[aria-label="Lead Firma 001 öffnen"]')).not.toBeInTheDocument();
  expect(table.querySelector('[aria-label="Firma 026 auswählen"]')).toHaveAttribute('aria-checked', 'false');
  fireEvent.click(screen.getByText('Alle 72 gefilterten Leads auswählen'));
  expect(screen.getByText('72 ausgewählt')).toBeInTheDocument();
  fireEvent.click(navigation.getByRole('button', { name: 'Vorherige Lead-Seite' }));
  expect(table.querySelector('[aria-label="Firma 001 auswählen"]')).toHaveAttribute('aria-checked', 'true');
  fireEvent.change(screen.getByLabelText('Leads durchsuchen'), { target: { value: 'Firma 072' } });
  expect(table.querySelectorAll('tbody tr')).toHaveLength(1);
  expect(screen.getByLabelText('Seite 1 von 1')).toBeInTheDocument();
}, 15000);
