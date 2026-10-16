import { useEffect, useRef, useState } from 'react';
import { Sparkle } from '@phosphor-icons/react';

export function EntryBlocked() {
  const screen = useRef(null);
  const [knocks, setKnocks] = useState(0);

  useEffect(() => {
    screen.current?.focus();
  }, []);

  const resetTilt = () => {
    screen.current?.style.setProperty('--block-x', '0');
    screen.current?.style.setProperty('--block-y', '0');
  };

  return <main ref={screen} tabIndex={-1} className="entry-blocked" aria-label="暂未开放" onPointerMove={event => {
    if (event.pointerType !== 'mouse') return;
    const { width, height, left, top } = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--block-x', String((event.clientX - left) / width - .5));
    event.currentTarget.style.setProperty('--block-y', String((event.clientY - top) / height - .5));
  }} onPointerLeave={resetTilt}>
    <div className="blocked-scene">
      <div className="blocked-orbit" aria-hidden="true">
        <span className="blocked-square" />
        <Sparkle className="blocked-spark blocked-spark-one" weight="fill" />
        <Sparkle className="blocked-spark blocked-spark-two" weight="fill" />
        <span className="blocked-dot" />
      </div>
      <div className="blocked-float">
        <button className="blocked-sign" aria-label="不准进，敲一敲" onClick={() => setKnocks(count => count + 1)}>
          <span key={knocks} className={`blocked-paper${knocks ? ' blocked-knocked' : ''}`}>
            <span className="blocked-tape" aria-hidden="true" />
            <span className="blocked-title">不准进</span>
            <span className="blocked-underline" aria-hidden="true" />
            {knocks > 0 && <span className="blocked-knock-marks" aria-hidden="true"><i /><i /><i /></span>}
          </span>
        </button>
      </div>
      <span className="entry-sr-only">当前暂未开放，没有进入纪念册的入口。</span>
    </div>
  </main>;
}
