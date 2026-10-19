import { useEffect, useState } from 'react';
import { ArrowClockwise } from '@phosphor-icons/react';
import { Opening } from './Opening';
import { Album } from './Album';
import { loadAlbumContent } from './albumResources';
import { KeepsakeSoundToggle, useKeepsakeAudio } from './KeepsakeSound';
export default function AlbumExperience({
  birthday
}) {
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState('opening');
  const [replays, setReplays] = useState(0);
  const audio = useKeepsakeAudio();
  const entered = phase === 'entered';
  const replay = () => {
    audio.stopEffects();
    audio.setEntered(false);
    setReplays(value => value + 1);
    setPhase('opening');
  };
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
      {content ? <Album key={replays} content={content} /> : <div className="loading" role={error ? 'alert' : 'status'}>
        {error ? <div><p>内容加载失败</p><p>{error.message}</p><button onClick={() => setAttempt(value => value + 1)}>重试</button></div> : '…'}
      </div>}
    </div>
    {!entered ? <Opening celebrate={birthday && replays === 0} onComplete={() => setPhase('entered')} onReveal={() => setPhase('revealed')} /> : <button className="opening-replay" aria-label="回到箱子页" onClick={replay}><ArrowClockwise size={18} aria-hidden="true" /></button>}
    <KeepsakeSoundToggle entered={entered} />
  </>;
}
