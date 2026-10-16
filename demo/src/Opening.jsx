import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import { BirthdayCelebration } from './BirthdayCelebration';
import { createOpeningScene } from './openingScene';
import { asset } from './assets';
export function Opening({
  onComplete,
  onReveal,
  celebrate = false
}) {
  const sceneRef = useRef(null);
  const mount = useRef(null),
    motion = useRef({
      hover: false,
      x: 0,
      y: 0
    }),
    done = useRef(onComplete),
    reveal = useRef(onReveal);
  const [phase, setPhase] = useState('idle'),
    [fallback, setFallback] = useState(false);
  const [celebrating, setCelebrating] = useState(celebrate),
    openingScreen = useRef(null);
  const finishBirthday = () => setCelebrating(false);
  done.current = onComplete;
  reveal.current = onReveal;
  useEffect(() => {
    try {
      const scene = createOpeningScene(mount.current, motion.current, {
        onReveal: () => {
          setPhase('reveal');
          reveal.current?.();
        },
        onComplete: () => done.current()
      });
      sceneRef.current = scene;
      return () => {
        scene.dispose();
        sceneRef.current = null;
      };
    } catch (error) {
      console.error('纪念盒 3D 场景初始化失败', error);
      setFallback(true);
    }
  }, []);
  useEffect(() => {
    if (!celebrating) openingScreen.current?.focus({
      preventScroll: true
    });
  }, [celebrating]);
  const open = () => {
    if (phase !== 'idle' || celebrating) return;
    if (fallback || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current();
      return;
    }
    sceneRef.current?.open();
    setPhase('opening');
  };
  return <section ref={openingScreen} tabIndex={-1} className={`opening opening-${phase}`} aria-label="纪念册开屏" onPointerMove={e => {
    motion.current.x = (e.clientX / innerWidth - .5) * 2;
    motion.current.y = (e.clientY / innerHeight - .5) * 2;
  }} onPointerLeave={() => {
    motion.current.x = 0;
    motion.current.y = 0;
  }}><h1 className="brand-u">U</h1><div className="opening-scene" ref={mount} role="img" aria-label="淡紫色立体纪念盒，内有回忆照片" onPointerEnter={() => motion.current.hover = true} onPointerLeave={() => motion.current.hover = false} />{fallback && <img className="opening-fallback" src={asset('assets/opening-reference.png')} alt="淡紫色纪念盒" />}<button className="opening-enter" aria-label="打开纪念盒" onClick={open} disabled={phase !== 'idle' || celebrating} onFocus={() => motion.current.hover = true} onBlur={() => motion.current.hover = false} onPointerEnter={() => motion.current.hover = true} onPointerLeave={() => motion.current.hover = false}><ArrowRight size={27} weight="bold" aria-hidden="true" /></button>{celebrating && <BirthdayCelebration onComplete={finishBirthday} />}</section>;
}
