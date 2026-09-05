import { useState } from 'react';

/** Reset/clamp before children render; selection is owned by the caller. */
export function useResultPage<T>(items: T[], scope: string) {
  const [size, setSize] = useState(25);
  const [request, setRequest] = useState({ scope, size: 25, page: 1 });
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(pages, request.scope === scope && request.size === size ? request.page : 1);
  if (request.scope !== scope || request.size !== size || request.page !== page) {
    setRequest({ scope, size, page });
  }
  const start = (page - 1) * size;
  return {
    page, pages, size, start, end: Math.min(start + size, items.length), rows: items.slice(start, start + size),
    setPage: (next: number) => setRequest({ scope, size, page: Math.max(1, Math.min(pages, Math.floor(next) || 1)) }),
    setSize: (next: number) => { if ([25, 50, 100].includes(next)) setSize(next); },
  };
}
