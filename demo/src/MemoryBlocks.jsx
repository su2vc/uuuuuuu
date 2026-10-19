import { useEffect, useRef, useState } from 'react';
import { Play, Pause, ArrowsOut, ArrowLeft, ArrowRight, ArrowClockwise, X, Plus, Minus, FilmStrip, ImageSquare, NotePencil } from '@phosphor-icons/react';
import { asset, imageCrossOrigin } from './assets';
import { groupMemories } from './content';
import { createPhotoWheelHandler } from './photoWheel';
import { pauseOtherVideos } from './mediaPlayback';
import { useModalDialog } from './useModalDialog';
const stamp = value => value?.slice(5).replace('-', '.') || '';
const clock = value => `${Math.floor(value / 60).toString().padStart(2, '0')}:${Math.floor(value % 60).toString().padStart(2, '0')}`;
const photoIndex = (index, delta, length) => ((index + delta) % length + length) % length;
export function VideoMemory({
  memory,
  onExpand,
  featured = false
}) {
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [failed, setFailed] = useState(false);
  const video = useRef(null);
  const duration = memory.previewSeconds || 30;
  useEffect(() => {
    const element = video.current;
    return () => element?.pause();
  }, [memory.src, failed]);
  useEffect(() => {
    if (!playing || (memory.src && !failed)) return;
    const id = setInterval(() => setElapsed(t => Math.min(duration, t + .1)), 100);
    return () => clearInterval(id);
  }, [playing, memory.src, failed, duration]);
  useEffect(() => {
    if (elapsed >= duration) setPlaying(false);
  }, [elapsed, duration]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) {
        setPlaying(false);
        video.current?.pause();
      }
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  return <article className={`video-memory ${featured ? 'featured-memory' : ''}`}>
    <div className="block-meta"><span><FilmStrip size={14} />VIDEO</span>{memory.date && <time dateTime={memory.date}>{stamp(memory.date)}</time>}</div>
    {memory.src && !failed ? <video ref={video} className="memory-video" aria-label={memory.title} controls playsInline preload={memory.poster ? 'none' : 'metadata'} poster={memory.poster ? asset(memory.poster) : undefined} src={asset(memory.src)} onPlay={event => pauseOtherVideos(event.currentTarget)} onError={() => setFailed(true)} /> : !memory.poster ? <div className="player video-unavailable" role="status"><FilmStrip size={36} aria-hidden="true" /><span>视频暂时无法播放</span></div> : <div className={`player ${playing ? 'is-playing' : ''}`}>
        <img crossOrigin={imageCrossOrigin(memory.poster)} src={asset(memory.poster)} alt={memory.title} style={{
        transform: `scale(${1 + elapsed * .002}) translateX(${-elapsed * .012}%)`
      }} />
        <button className="play-button" aria-label={playing ? '暂停封面预览' : '播放封面预览'} onClick={() => {
        if (elapsed >= duration) setElapsed(0);
        setPlaying(!playing);
      }}>
          {playing ? <Pause weight="fill" /> : elapsed >= duration ? <ArrowClockwise /> : <Play weight="fill" />}
        </button>
        <span className="preview-label">{failed ? '视频暂时无法播放' : playing || elapsed > 0 ? '动态封面预览' : '视频待添加'}</span>
        <span className="duration">{clock(elapsed)} / {clock(duration)}</span>
        <button className="expand" aria-label="放大视频封面" onClick={() => {
        setPlaying(false);
        onExpand([{
          src: memory.poster,
          caption: memory.title
        }], 0);
      }}><ArrowsOut size={23} /></button>
        <input className="progress" type="range" min="0" max={duration} step=".1" value={elapsed} aria-label="封面预览进度" onChange={e => setElapsed(Number(e.target.value))} />
      </div>}
    <div className="video-caption"><h2>{memory.title}</h2></div>
    {memory.description && <p className="featured-description">{memory.description}</p>}
  </article>;
}
export function PhotoMemory({
  memory,
  onExpand
}) {
  const [index, setIndex] = useState(0);
  const items = memory.images;
  const move = delta => setIndex(i => photoIndex(i, delta, items.length));
  const touch = useRef(null);
  const deck = useRef(null);
  useEffect(() => {
    if (items.length < 2) return;
    const element = deck.current;
    const wheel = createPhotoWheelHandler(delta => setIndex(i => photoIndex(i, delta, items.length)));
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [items.length]);
  return <article className={`photo-memory photo-${memory.presentation || 'stack'}`}>
    <div className="block-meta"><span><ImageSquare size={14} />PHOTOS</span><span>{String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span></div>
    <div ref={deck} className="photo-deck" onTouchStart={e => touch.current = e.touches[0].clientX} onTouchEnd={e => {
      if (touch.current !== null) {
        const d = touch.current - e.changedTouches[0].clientX;
        if (Math.abs(d) > 40) move(d > 0 ? 1 : -1);
        touch.current = null;
      }
    }}>
      {items.map((item, i) => {
        const depth = (i - index + items.length) % items.length;
        return <button key={item.src + i} className={`photo-print ${depth === 0 ? 'front' : ''} ${item.caption ? '' : 'without-caption'}`} style={{
          '--depth': Math.min(depth, 2),
          zIndex: items.length - depth,
          visibility: depth > 2 ? 'hidden' : undefined
        }} tabIndex={depth === 0 ? 0 : -1} aria-hidden={depth !== 0} onClick={() => onExpand(items, i)} aria-label={item.caption ? `放大照片：${item.caption}` : `放大照片 ${i + 1}`}><img crossOrigin={imageCrossOrigin(item.src)} src={asset(item.src)} alt={item.caption} loading="lazy" />{item.caption && <span>{item.caption}</span>}</button>;
      })}
    </div>
    {(memory.title || items.length > 1) && <div className="photo-controls">{memory.title && <span>{memory.title}</span>}<div><button aria-label="上一张照片" onClick={() => move(-1)} disabled={items.length < 2}><ArrowLeft size={19} /></button><button aria-label="下一张照片" onClick={() => move(1)} disabled={items.length < 2}><ArrowRight size={19} /></button></div></div>}
  </article>;
}
export function TextMemory({
  memory
}) {
  const [open, setOpen] = useState(false);
  const bodyId = `note-${memory.id}`;
  return <article className={`text-memory text-${memory.presentation || 'note'} ${open ? 'is-unfolded' : ''}`}>
    <div className="block-meta"><span><NotePencil size={14} />NOTE</span>{memory.date && <time dateTime={memory.date}>{stamp(memory.date)}</time>}</div>
    <h2>{memory.title}</h2><p className="note-lead">{memory.excerpt}</p>
    <div className="note-fold" id={bodyId} inert={!open}><div>{memory.paragraphs.map((p, i) => <p key={i}>{p}</p>)}</div></div>
    {memory.paragraphs.length > 0 && <button className="unfold-note" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls={bodyId}>{open ? '收起' : '展开这段'}{open ? <Minus size={17} /> : <Plus size={17} />}</button>}
  </article>;
}
export function MemoryBoard({
  game,
  onExpand,
  videosExpanded = false,
  onToggleVideos
}) {
  const { photos, notes, videos } = groupMemories(game.memories);
  const toggle = useRef(null);
  const renderVideo = memory => <div className={`memory-slot slot-${memory.type}`} key={memory.id}>
    <VideoMemory memory={memory} featured={memory.type === 'featuredVideo'} onExpand={onExpand} />
  </div>;
  return <div className="memory-board">
    {(photos.length > 0 || notes.length > 0) && <div className={`memory-overview ${photos.length && notes.length ? 'has-photos-and-notes' : ''} overview-${photos[0]?.presentation || 'stack'}`}>
      {photos.length > 0 && <div className="memory-photos">{photos.map(memory => <div className="memory-slot slot-gallery" key={memory.id}>
        <PhotoMemory memory={memory} onExpand={onExpand} />
      </div>)}</div>}
      {notes.length > 0 && <div className="memory-notes">{notes.map(memory => <div className="memory-slot slot-text" key={memory.id}>
        <TextMemory memory={memory} />
      </div>)}</div>}
    </div>}
    {videos.slice(0, 3).map(renderVideo)}
    {videos.length > 3 && <>
      <div className="more-videos" id={`${game.id}-more-videos`} hidden={!videosExpanded}>
        {videosExpanded && videos.slice(3).map(renderVideo)}
      </div>
      <button ref={toggle} className="video-more-toggle" aria-controls={`${game.id}-more-videos`} aria-expanded={videosExpanded} onClick={() => {
        onToggleVideos();
        if (videosExpanded) requestAnimationFrame(() => toggle.current?.scrollIntoView({ block: 'nearest' }));
      }}>
        {videosExpanded ? <Minus size={18} aria-hidden="true" /> : <Plus size={18} aria-hidden="true" />}
        {videosExpanded ? '收起来咯' : `还有 ${videos.length - 3} 个呢`}
      </button>
    </>}
  </div>;
}
export function ImageViewer({
  value,
  onClose
}) {
  const dialog = useModalDialog();
  const [view, setView] = useState({ index: value.index, flipped: false });
  const { index, flipped } = view;
  const images = value.images,
    item = images[index] || images[0];
  const move = delta => {
    // A photo without a note is not a button. Preserve keyboard focus when
    // navigating away from the optional interactive photo.
    if (dialog.current?.querySelector('button.viewer-photo') === document.activeElement) dialog.current.focus({ preventScroll: true });
    setView(previous => ({ index: photoIndex(previous.index, delta, images.length), flipped: false }));
  };
  const Photo = item.note ? 'button' : 'div';
  return <dialog className="image-viewer" ref={dialog} aria-label="回忆照片" onCancel={e => {
    e.preventDefault();
    onClose();
  }} onClick={e => {
    if (e.target === dialog.current) onClose();
  }} onKeyDown={e => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      move(1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      move(-1);
    }
  }}>
    <button className="viewer-close" onClick={onClose} aria-label="关闭图片"><X size={26} /></button>
    <Photo className={`viewer-photo ${flipped ? 'is-flipped' : ''}`} key={item.src} {...(item.note ? {
      type: 'button', 'aria-label': flipped ? '翻回照片正面' : '翻看照片背面留言', 'aria-pressed': flipped,
      onClick: () => setView(previous => ({ ...previous, flipped: !previous.flipped }))
    } : {})}>
      <span className="viewer-photo-inner">
        <span className="viewer-photo-front" inert={flipped} aria-hidden={flipped}>
          <img crossOrigin={imageCrossOrigin(item.src)} src={asset(item.src)} alt={item.caption} />
        </span>
        {item.note && <span className="viewer-photo-back" inert={!flipped} aria-hidden={!flipped}><span className="viewer-note-label">写在背面</span><span className="viewer-note-text">{item.note}</span></span>}
      </span>
    </Photo>
    <div className="viewer-caption">{item.caption && <p>{item.caption}</p>}
      <div><button onClick={() => move(-1)} aria-label="上一张" disabled={images.length < 2}><ArrowLeft size={22} /></button><span>{index + 1} / {images.length}</span><button onClick={() => move(1)} aria-label="下一张" disabled={images.length < 2}><ArrowRight size={22} /></button></div>
    </div>
  </dialog>;
}
