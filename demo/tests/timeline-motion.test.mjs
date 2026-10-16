import test from 'node:test';
import assert from 'node:assert/strict';
import {createTimelineMotion} from '../src/timelineMotion.js';

function fixture(options={}) {
  let now=0,sequence=0;const queue=new Map(),frames=[],commits=[];
  const add=(fn,delay)=>{const id=++sequence;queue.set(id,{fn,time:now+delay});return id};
  const clock={now:()=>now,frame:fn=>add(fn,16),timer:add,cancelFrame:id=>queue.delete(id),cancelTimer:id=>queue.delete(id)};
  const advance=ms=>{
    const end=now+ms;
    for(;;){const next=[...queue].filter(([,v])=>v.time<=end).sort((a,b)=>a[1].time-b[1].time)[0];if(!next)break;
      now=next[1].time;queue.delete(next[0]);next[1].fn();}
    now=end;
  };
  const motion=createTimelineMotion({initial:2,count:13,onFrame:s=>frames.push(s),onCommit:i=>commits.push(i),clock,...options});
  return {motion,frames,commits,advance};
}
test('scrolling previews multiple games without committing right-side content',()=>{
  const f=fixture();
  for(let i=0;i<30;i++){f.motion.move(24,240);f.advance(16)}
  assert.equal(f.commits.length,0);
  assert.ok(Math.abs(f.frames.at(-1).position-5)<1e-8);
  f.advance(500);assert.deepEqual(f.commits,[5]);
});
test('content commits once and only after alignment reaches its target',()=>{
  const f=fixture();f.motion.move(144,240);f.advance(150);
  assert.equal(f.frames.at(-1).phase,'aligning');assert.deepEqual(f.commits,[]);
  f.advance(200);assert.deepEqual(f.commits,[]);
  f.advance(100);assert.deepEqual(f.commits,[3]);assert.equal(f.frames.at(-1).position,3);
});
test('new input interrupts alignment from its actual displayed position',()=>{
  const f=fixture();f.motion.move(144,240);f.advance(230);
  const before=f.frames.at(-1).position;
  f.motion.move(-120,240);f.advance(16);
  assert.ok(Math.abs(f.frames.at(-1).position-(before-.5))<1e-8);
  assert.deepEqual(f.commits,[]);
  f.advance(500);assert.deepEqual(f.commits,[2]);
});
test('direct selection cancels pending alignment',()=>{
  const f=fixture();f.motion.move(144,240);f.advance(180);f.motion.jump(8);f.advance(500);
  assert.deepEqual(f.commits,[8]);assert.equal(f.frames.at(-1).position,8);
});
test('held touch input does not commit until released',()=>{
  const f=fixture();f.motion.move(144,240,true);f.advance(1000);assert.deepEqual(f.commits,[]);
  f.motion.settle();f.advance(300);assert.deepEqual(f.commits,[3]);
});
test('unmount cancels callbacks and reduced motion skips alignment animation',()=>{
  const f=fixture();f.motion.move(144,240);f.motion.dispose();f.advance(1000);assert.deepEqual(f.commits,[]);
  const reduced=fixture({alignmentMs:0});reduced.motion.move(144,240);reduced.advance(150);assert.deepEqual(reduced.commits,[3]);
});

test('click selection travels through intermediate positions before committing',()=>{
  const f=fixture();f.motion.select(7);
  assert.equal(f.frames.at(-1).position,2);assert.deepEqual(f.commits,[]);
  f.advance(200);assert.ok(f.frames.at(-1).position>2&&f.frames.at(-1).position<7);
  assert.deepEqual(f.commits,[]);
  f.advance(500);assert.deepEqual(f.commits,[7]);assert.equal(f.frames.at(-1).position,7);
});
test('wheel input cancels click travel from its current visible position',()=>{
  const f=fixture();f.motion.select(8);f.advance(160);
  const before=f.frames.at(-1).position;
  f.motion.move(-48,240);f.advance(16);
  assert.ok(Math.abs(f.frames.at(-1).position-(before-.2))<1e-8);
  f.advance(1000);assert.deepEqual(f.commits,[Math.round(before-.2)]);
});
test('a second click replaces the first target without flashing to it',()=>{
  const f=fixture();f.motion.select(9);f.advance(144);
  const before=f.frames.at(-1).position;f.motion.select(1);
  assert.equal(f.frames.at(-1).position,before);
  f.advance(700);assert.deepEqual(f.commits,[1]);
});
test('reduced motion commits click selection without travel',()=>{
  const f=fixture({alignmentMs:0});f.motion.select(9);
  assert.deepEqual(f.commits,[9]);assert.equal(f.frames.at(-1).position,9);
});

for (const {edge,initial,delta} of [{edge:0,initial:1,delta:-480},{edge:12,initial:11,delta:480}]) {
  test(`wheel tails at endpoint ${edge} do not delay settlement or republish idle frames`,()=>{
    const f=fixture({initial});
    f.motion.move(delta,240);
    for(let i=0;i<20;i++){f.advance(16);f.motion.move(delta/10,240)}
    assert.deepEqual(f.commits,[edge]);
    assert.equal(f.frames.at(-1).phase,'idle');
    assert.equal(f.frames.at(-1).position,edge);
    const frameCount=f.frames.length;
    for(let i=0;i<20;i++){f.motion.move(delta/10,240);f.advance(16)}
    f.advance(500);
    assert.equal(f.frames.length,frameCount);
    assert.deepEqual(f.commits,[edge]);
    // Reverse movement immediately resumes from the visible endpoint.
    f.motion.move(-Math.sign(delta)*120,240);f.advance(16);
    assert.equal(f.frames.at(-1).position,edge-Math.sign(delta)*.5);
    assert.equal(f.frames.at(-1).phase,'scrolling');
  });
  test(`touch held at endpoint ${edge} waits for release`,()=>{
    const f=fixture({initial});
    f.motion.hold();f.motion.move(delta,240,true);
    for(let i=0;i<20;i++){f.advance(50);f.motion.move(delta/10,240,true)}
    assert.deepEqual(f.commits,[]);
    f.motion.settle();
    assert.deepEqual(f.commits,[edge]);
  });
}

test('outward input can still interrupt click travel starting at an endpoint',()=>{
  const f=fixture({initial:0});
  f.motion.select(5);f.motion.move(-24,240);f.advance(800);
  assert.deepEqual(f.commits,[0]);
  assert.equal(f.frames.at(-1).position,0);
  assert.equal(f.frames.at(-1).phase,'idle');
});
