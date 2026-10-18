import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { MemoryBoard, ImageViewer } from './MemoryBlocks';
import { AvatarKeepsake } from './AvatarKeepsake';
import { GameNavigation } from './GameNavigation';
import { GameIndex } from './GameIndex';
import { formatPlayPeriod } from './playPeriod';
export function Album({
  content
}) {
  const games = content.games;
  const initial = 0;
  const [selected, setSelected] = useState(initial),
    [viewer, setViewer] = useState(null),
    [indexOpen, setIndexOpen] = useState(false),
    [visitedIds, setVisitedIds] = useState(() => new Set([games[initial].id])),
    [expandedVideoIds, setExpandedVideoIds] = useState(() => new Set());
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
    setVisitedIds(previous => new Set(previous).add(games[index].id));
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
  const toggleVideos = () => setExpandedVideoIds(previous => {
    const next = new Set(previous);
    if (next.has(game.id)) next.delete(game.id);
    else next.add(game.id);
    return next;
  });
  const closeIndex = () => setIndexOpen(false);
  const openIndex = () => setIndexOpen(true);
  return <main className={`album theme-${game.id}`} style={{
    '--paper': game.paper,
    '--ink': game.ink
  }}>
    <svg width="0" height="0" aria-hidden="true" style={{
      position: 'absolute'
    }}><filter id="solid-alpha" colorInterpolationFilters="sRGB"><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1" /></feComponentTransfer></filter></svg>
    <AvatarKeepsake avatars={content.avatars} messages={content.avatarMessages} />
    <GameNavigation games={games} selected={selected} visitedIds={visitedIds} onSelect={choose} onOpenIndex={openIndex} indexButton={indexButton} navigationControl={navigation} />
    <section ref={panel} id="memories" className="memories" role="tabpanel" aria-labelledby={`tab-${game.id}`} tabIndex="-1">
      <div key={game.id} className="memory-content">
        <header className="game-heading"><h1 id="current-game-title" tabIndex={-1} className={`wordmark wordmark-${game.id}`}>{game.title}</h1><p><span className="game-period">{formatPlayPeriod(game.playPeriod, { includeYear: true })}</span>{game.hours !== null && <><span>·</span><span title="截图所示周记录的累计时长">{game.hours} h</span></>}<span className="platform-label">{game.platform}</span></p></header>
        <MemoryBoard game={game} videosExpanded={expandedVideoIds.has(game.id)} onToggleVideos={toggleVideos} onExpand={(images, index) => setViewer({
          images,
          index
        })} />
        {content.demoMode && <footer>周期与时长以各游戏已录入记录为准<br />回忆文字和部分宣传素材仍为演示内容</footer>}
      </div>
    </section>
    {viewer && <ImageViewer value={viewer} onClose={() => setViewer(null)} />}
    {indexOpen && <GameIndex games={games} selected={selected} visitedIds={visitedIds} onClose={closeIndex} onSelect={index => {
      navigation.current?.select(index);
      closeIndex();
    }} />}
  </main>;
}
