import { useRef, useState } from 'react';
import { X } from '@phosphor-icons/react';
import { asset } from './assets';
import { useModalDialog } from './useModalDialog';
export function GameIndex({
  games,
  selected,
  onSelect,
  onClose
}) {
  const searchInput = useRef(null);
  const dialog = useModalDialog(searchInput);
  const [query, setQuery] = useState('');
  const search = query.trim().toLowerCase();
  const matches = games.map((game, index) => ({
    game,
    index
  })).filter(({
    game
  }) => `${game.title} ${game.englishTitle || ''}`.toLowerCase().includes(search));
  return <dialog className="game-index" ref={dialog} aria-label="全部游戏" onCancel={event => {
    event.preventDefault();
    onClose();
  }} onClick={event => {
    if (event.target === dialog.current) onClose();
  }}>
    <div className="index-header"><h2>全部游戏</h2><button onClick={onClose} aria-label="关闭游戏目录"><X size={23} /></button></div>
    <input ref={searchInput} className="game-search" placeholder="搜索游戏" aria-label="搜索游戏" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="index-games">{matches.map(({
        game,
        index
      }) => <button key={game.id} aria-current={selected === index} onClick={() => onSelect(index)}>
        <img src={asset(game.character)} alt="" loading="lazy" />
        <span>{game.title}<small>{game.platform} · {game.firstTime.slice(5).replace('-', '.')}</small></span>
      </button>)}</div>
    {!matches.length && <p className="empty-search">没有匹配的游戏</p>}
  </dialog>;
}
