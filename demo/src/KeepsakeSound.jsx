import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { MusicNotes, SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react';
import { createKeepsakeAudio } from './keepsakeAudio';
import { createBackgroundMusic } from './backgroundMusic';

const AudioContext = createContext(null);
export const useKeepsakeAudio = () => useContext(AudioContext);

export function KeepsakeAudioProvider({ children }) {
  const engine = useRef(null), music = useRef(null);
  const [muted, setMuted] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  useEffect(() => {
    const audio = createKeepsakeAudio();
    const background = createBackgroundMusic({
      getContext: audio.getContext,
      canPlay: () => !document.hidden && ![...document.querySelectorAll('video')].some(video => !video.paused && !video.ended),
      onBlocked: () => setMusicEnabled(false)
    });
    engine.current = audio;
    music.current = background;
    const hide = () => {
      if (document.hidden) { background.pause(true); audio.suspend(); }
      else background.sync();
    };
    const videoChanges = event => {
      if (!(event.target instanceof HTMLVideoElement)) return;
      if (event.type === 'play') audio.stop();
      background.sync();
    };
    document.addEventListener('visibilitychange', hide);
    for (const event of ['play', 'pause', 'ended']) document.addEventListener(event, videoChanges, true);
    return () => {
      document.removeEventListener('visibilitychange', hide);
      for (const event of ['play', 'pause', 'ended']) document.removeEventListener(event, videoChanges, true);
      background.dispose();
      audio.dispose();
      engine.current = null;
      music.current = null;
    };
  }, []);
  const value = useMemo(() => ({
    muted,
    musicEnabled,
    prepare: () => engine.current?.prepare(),
    play: (effect, strength) => engine.current?.play(effect, strength),
    toggle: () => {
      engine.current?.setMuted(!muted);
      if (muted) engine.current?.prepare();
      setMuted(!muted);
    },
    openAlbum: () => {
      // Resume from the opening button's trusted gesture, including on iOS.
      const context = engine.current?.getContext();
      if (context?.state === 'suspended') context.resume().catch(() => {});
    },
    setEntered: entered => music.current?.setEntered(entered),
    toggleMusic: () => {
      setMusicEnabled(!musicEnabled);
      music.current?.setEnabled(!musicEnabled);
    }
  }), [muted, musicEnabled]);
  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function KeepsakeSoundToggle({ entered }) {
  const audio = useKeepsakeAudio();
  useEffect(() => { audio.setEntered(entered); }, [entered, audio.setEntered]);
  const label = audio.muted ? '开启互动音效' : '关闭互动音效';
  const musicLabel = audio.musicEnabled ? '暂停背景音乐' : '播放背景音乐';
  return <><button className={`keepsake-sound-toggle ${entered ? 'in-album' : ''}`} onClick={audio.toggle} aria-label={label} title={label} aria-pressed={!audio.muted}>
    {audio.muted ? <SpeakerSlash size={19} aria-hidden="true" /> : <SpeakerHigh size={19} aria-hidden="true" />}
  </button>{entered && <button className="keepsake-sound-toggle in-album keepsake-music-toggle" onClick={audio.toggleMusic} aria-label={musicLabel} title={`${musicLabel}，播放视频时自动暂停`} aria-pressed={audio.musicEnabled}>
    <MusicNotes size={19} aria-hidden="true" />
  </button>}</>;
}
