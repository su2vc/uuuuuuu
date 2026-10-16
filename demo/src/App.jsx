import { lazy, Suspense, useState } from 'react';
import { EntryGate } from './EntryGate';
import { ErrorBoundary } from './ErrorBoundary';
import { EntryBlocked } from './EntryBlocked';
import { ENTRY_BLOCKED } from './entryRules';

// The password screen does not need the album or the WebGL renderer.
const AlbumExperience = lazy(() => import('./AlbumExperience'));
export function App() {
  const [entry, setEntry] = useState(null);
  return <ErrorBoundary>{entry ? ENTRY_BLOCKED ? <EntryBlocked /> : <Suspense fallback={<div className="loading" role="status">…</div>}>
      <AlbumExperience birthday={entry.birthday} onReplay={() => setEntry(null)} />
    </Suspense> : <EntryGate onUnlock={birthday => setEntry({
      birthday
    })} />}</ErrorBoundary>;
}
