import { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { List } from '@phosphor-icons/react';
import { asset, imageCrossOrigin } from './assets';
import { wheelDelta } from './wheelGesture';
import { createTimelineMotion } from './timelineMotion';
import { formatPlayPeriod } from './playPeriod';

// A repeating yellow → apricot → orange → apricot cycle for the navigation only.
const navigationColors = ['#f7e8bc', '#f6ddba', '#f3d1b1', '#f6ddba'];
export function GameNavigation({
  games,
  selected,
  visitedIds,
  onSelect,
  onOpenIndex,
  indexButton,
  navigationControl
}) {
  const [motion, setMotion] = useState({
    position: selected,
    phase: 'idle',
    direction: 0
  });
  const nav = useRef(null),
    controller = useRef(null),
    tabs = useRef([]),
    touch = useRef(null),
    dragged = useRef(false);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const spacing = () => window.innerWidth <= 800 ? window.innerWidth * .32 : window.innerHeight * .29;
  useEffect(() => {
    const current = createTimelineMotion({
      initial: selected,
      count: games.length,
      alignmentMs: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 260,
      onFrame: setMotion,
      onCommit: i => onSelectRef.current(i)
    });
    controller.current = current;
    const wheel = e => {
      if (e.ctrlKey) return;
      const delta = wheelDelta(e, nav.current.clientHeight);
      if (!delta) return;
      e.preventDefault();
      current.move(delta, spacing());
    };
    const element = nav.current;
    element.addEventListener('wheel', wheel, {
      passive: false
    });
    return () => {
      element.removeEventListener('wheel', wheel);
      current.dispose();
    };
  }, [games.length]);
  useEffect(() => {
    controller.current?.jump(selected, false);
  }, [selected]);
  useImperativeHandle(navigationControl, () => ({
    select: index => controller.current?.select(index)
  }), []);
  const preview = Math.round(motion.position),
    moving = motion.phase !== 'idle';
  const choose = (i, focus = false) => {
    const index = Math.max(0, Math.min(games.length - 1, i));
    controller.current.select(index);
    if (focus) tabs.current[index]?.focus({preventScroll: true});
  };
  return <>
    <div className={`diagonal ${moving ? 'is-browsing' : ''}`} aria-hidden="true" style={{
      '--scroll-direction': motion.direction
    }}>
      <div className="divider-orange"><div className="navigation-shade" style={{
          backgroundColor: navigationColors[preview % navigationColors.length]
        }} /></div>
    </div>
    <nav ref={nav} className={`game-nav ${moving ? 'is-browsing' : ''}`} aria-label="游戏时间线" style={{
      '--shadow-sway': moving ? Math.sin(motion.position * Math.PI) * 4 : 0
    }} onTouchStart={e => {
      controller.current.hold();
      dragged.current = false;
      touch.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    }} onTouchMove={e => {
      if (!touch.current) return;
      const point = e.touches[0],
        previous = touch.current;
      const delta = window.innerWidth <= 800 ? previous.x - point.clientX : previous.y - point.clientY;
      if (!dragged.current && Math.abs(delta) < 5) return;
      dragged.current = true;
      touch.current = {
        x: point.clientX,
        y: point.clientY
      };
      controller.current.move(delta, spacing(), true);
    }} onTouchEnd={() => {
      touch.current = null;
      controller.current.settle();
    }} onTouchCancel={() => {
      touch.current = null;
      controller.current.settle();
    }} onClickCapture={e => {
      if (dragged.current) {
        e.preventDefault();
        e.stopPropagation();
        dragged.current = false;
      }
    }}>
      <div className="timeline" />
      <div role="tablist" aria-label="游戏">
        {games.map((g, i) => {
          const distance = Math.abs(i - motion.position),
            proximity = Math.max(0, 1 - distance);
          return <button ref={el => {
            tabs.current[i] = el;
          }} key={g.id} role="tab" id={`tab-${g.id}`} aria-controls="memories" aria-selected={i === selected} data-visited={visitedIds.has(g.id)} aria-label={`${g.title}，${i + 1}/${games.length}${visitedIds.has(g.id) ? '，已浏览' : ''}`} tabIndex={i === preview ? 0 : -1} className={`game-tab ${i === preview ? 'active' : ''}`} style={{
            '--offset': i - motion.position,
            '--proximity': proximity,
            opacity: Math.max(0, Math.min(1, (2 - distance) * 2)),
            pointerEvents: distance < 1.65 ? 'auto' : 'none'
          }} onClick={() => choose(i)} onKeyDown={e => {
            let target;
            if (['ArrowDown', 'ArrowRight'].includes(e.key)) target = i + 1;
            if (['ArrowUp', 'ArrowLeft'].includes(e.key)) target = i - 1;
            if (e.key === 'Home') target = 0;
            if (e.key === 'End') target = games.length - 1;
            if (target !== undefined) {
              e.preventDefault();
              choose(target, true);
            }
          }}>
            <span className="timeline-dot" /><span className="game-label"><span className="game-period">{formatPlayPeriod(g.playPeriod)}</span><strong><span className="game-name">{visitedIds.has(g.id) && <span className="visited-mark" aria-hidden="true" />}{g.title}</span></strong></span>
            <span className={`character-outer character-${g.id}`}>
              <span className="character-silhouette" aria-hidden="true" style={{
                maskImage: `url("${asset(g.character)}")`
              }} />
              <span className="character-outline"><span className="character-inner"><img crossOrigin={imageCrossOrigin(g.character)} src={asset(g.character)} alt="" draggable="false" decoding="async" /></span></span>
            </span>
          </button>;
        })}
      </div>
    </nav>
    <button className="game-index-button" ref={indexButton} onClick={() => {
      controller.current.jump(selected, false);
      onOpenIndex();
    }} aria-haspopup="dialog"><List size={17} />全部游戏<span>{String(preview + 1).padStart(2, '0')} / {games.length}</span></button>
  </>;
}
