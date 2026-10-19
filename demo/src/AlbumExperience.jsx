import { useEffect, useState } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';
import { Opening } from './Opening';
import { Album } from './Album';
import { loadAlbumContent } from './albumResources';
import { KeepsakeAudioProvider, KeepsakeSoundToggle } from './KeepsakeSound';
export default function AlbumExperience({
  birthday,
  onReplay
}) {
  return <KeepsakeAudioProvider><Experience birthday={birthday} onReplay={onReplay} /></KeepsakeAudioProvider>;
}
function Experience({
  birthday,
  onReplay
}) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState('opening');
  const entered = phase === 'entered';
  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    loadAlbumContent({
      signal: controller.signal
    }).then(value => {
      if (!controller.signal.aborted) setContent(value);
    }).catch(reason => {
      if (!controller.signal.aborted) setError(reason);
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    if (!entered || !content) return;
    document.getElementById('current-game-title')?.focus({
      preventScroll: true
    });
  }, [entered, content]);
  return <>
    <div className={`album-stage ${phase === 'opening' ? 'is-covered' : 'is-visible'}`} inert={!entered}>
      {content ? <Album content={content} /> : <div className="loading" role={error ? 'alert' : 'status'}>
        {error ? <div><p>内容加载失败</p><p>{error.message}</p><button onClick={() => setAttempt(value => value + 1)}>重试</button></div> : '…'}
      </div>}
    </div>
    {!entered ? <Opening celebrate={birthday} onComplete={() => setPhase('entered')} onReveal={() => setPhase('revealed')} /> : <button className="opening-replay" aria-label="重播开屏" onClick={onReplay}><ArrowClockwise size={18} aria-hidden="true" /></button>}
    <KeepsakeSoundToggle entered={entered} />
  </>;
}
