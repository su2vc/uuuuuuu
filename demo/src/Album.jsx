import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MemoryBoard, ImageViewer } from './MemoryBlocks';
import { asset } from './assets';
import { GameNavigation } from './GameNavigation';
import { GameIndex } from './GameIndex';
export function Album({
  content
}) {
  const games = content.games;
  const initial = 0;
  const [selected, setSelected] = useState(initial),
    [viewer, setViewer] = useState(null),
    [indexOpen, setIndexOpen] = useState(false);
  const panel = useRef(null),
    indexButton = useRef(null),
    navigation = useRef(null);
  const selectedRef = useRef(initial),
    scrolls = useRef({});
  const game = games[selected];
  const choose = index => {
    index = Math.max(0, Math.min(games.length - 1, index));
    if (index === selectedRef.current) return;
    if (panel.current) scrolls.current[selectedRef.current] = panel.current.scrollTop;
    selectedRef.current = index;
    setSelected(index);
    history.replaceState(null, '', `#${games[index].id}`);
  };
  useLayoutEffect(() => {
    if (panel.current) panel.current.scrollTop = scrolls.current[selected] || 0;
  }, [selected]);
  useEffect(() => {
    history.replaceState(null, '', `#${games[0].id}`);
    const hash = () => {
      const i = games.findIndex(g => g.id === location.hash.slice(1));
      if (i >= 0) navigation.current?.select(i);
    };
    window.addEventListener('hashchange', hash);
    return () => window.removeEventListener('hashchange', hash);
  }, [games]);
  const closeIndex = () => setIndexOpen(false);
  const openIndex = () => setIndexOpen(true);
  return <main className={`album theme-${game.id}`} style={{
    '--paper': game.paper,
    '--ink': game.ink
  }}>
    <svg width="0" height="0" aria-hidden="true" style={{
      position: 'absolute'
    }}><filter id="solid-alpha" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1" /></feComponentTransfer></filter></svg>
    <div className="avatars">{content.avatars.map((a, i) => <div className="avatar" key={i}><img src={asset(a.src)} alt={a.alt} /></div>)}</div>
    <GameNavigation games={games} selected={selected} onSelect={choose} onOpenIndex={openIndex} indexButton={indexButton} navigationControl={navigation} />
    <section ref={panel} id="memories" className="memories" role="tabpanel" aria-labelledby={`tab-${game.id}`} tabIndex="-1">
      <div key={game.id} className="memory-content">
        <header className="game-heading"><h1 id="current-game-title" tabIndex={-1} className={`wordmark wordmark-${game.id}`}>{game.title}</h1><p><time dateTime={game.firstTime}>{game.firstTime.replaceAll('-', '.')}</time>{game.hours !== null && <><span>·</span>{game.hours} h</>}<span className="platform-label">{game.platform}</span></p></header>
        <MemoryBoard game={game} onExpand={(images, index) => setViewer({
          images,
          index
        })} />
        {content.demoMode && <footer>演示记录 · 日期、时长与文字均为 mock<br />图片为宣传素材，后续可替换为自己的截图</footer>}
      </div>
    </section>
    {viewer && <ImageViewer value={viewer} onClose={() => setViewer(null)} />}
    {indexOpen && <GameIndex games={games} selected={selected} onClose={closeIndex} onSelect={index => {
      navigation.current?.select(index);
      closeIndex();
    }} />}
  </main>;
}
