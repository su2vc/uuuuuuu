import { lazy, Suspense, useEffect, useState } from 'react';
import { EntryGate } from './EntryGate';
import { ErrorBoundary } from './ErrorBoundary';
import { EntryBlocked } from './EntryBlocked';
import { ENTRY_BLOCKED } from './entryRules';
import { warmAlbumImages } from './albumResources';

// The password screen does not need the album or the WebGL renderer.
const AlbumExperience = lazy(() => import('./AlbumExperience'));
export function App() {
  const [entry, setEntry] = useState(null);
  useEffect(() => {
    if (!ENTRY_BLOCKED) warmAlbumImages().catch(() => {});
  }, []);
  return <ErrorBoundary>{entry ? ENTRY_BLOCKED ? <EntryBlocked /> : <Suspense fallback={<div className="loading" role="status">…</div>}>
      <AlbumExperience birthday={entry.birthday} />
    </Suspense> : <EntryGate onUnlock={birthday => setEntry({
      birthday
    })} />}</ErrorBoundary>;
}
