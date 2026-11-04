import { lazy, Suspense, useEffect, useState } from 'react';
import { EntryGate } from '../entry/EntryGate.jsx';
import { ErrorBoundary } from '../shared/components/ErrorBoundary.jsx';
import { EntryBlocked } from '../entry/EntryBlocked.jsx';
import { KeepsakeAudioProvider } from '../shared/audio/KeepsakeSound.jsx';
import { pageHash } from '../shared/navigation.js';
import { pages } from './pageRegistry.js';
import { activePage } from './pageAccess.js';

// Register once. Locked and unrelated pages do not load their bundles.
const components = new Map(pages.map(page => [page.id, lazy(page.load)]));
export function App() {
  const [entry, setEntry] = useState(null);
  const [hash, setHash] = useState(() => window.location.hash);
  const page = activePage(entry, hash);
  const Page = page && components.get(page.id);

  useEffect(() => {
    const navigate = () => {
      const nextHash = window.location.hash;
      // Returning to the entrance or changing pages requires a new password.
      setEntry(current => activePage(current, nextHash) ? current : null);
      setHash(nextHash);
    };
    window.addEventListener('hashchange', navigate);
    window.addEventListener('popstate', navigate);
    return () => {
      window.removeEventListener('hashchange', navigate);
      window.removeEventListener('popstate', navigate);
    };
  }, []);

  useEffect(() => {
    document.title = page ? `${page.title} · uu` : 'uu';
  }, [page]);

  const unlock = ({ pageId }) => {
    const nextHash = pageHash(pageId);
    // Passwords and unlock state stay in memory; the URL contains only a page ID.
    if (window.location.hash !== nextHash) window.history.pushState(null, '', nextHash);
    setHash(nextHash);
    setEntry({ pageId, enteredAt: new Date() });
  };

  return <ErrorBoundary><KeepsakeAudioProvider>
    {!page ? <EntryGate onUnlock={unlock} /> : <ErrorBoundary key={page.id}>
      {page.blocked ? <EntryBlocked /> : <Suspense fallback={<div className="loading" role="status">…</div>}>
        <Page entry={entry} />
      </Suspense>}
    </ErrorBoundary>}
  </KeepsakeAudioProvider></ErrorBoundary>;
}
