import assert from 'node:assert/strict';
import test from 'node:test';
import * as THREE from 'three';
import {createVisibleFrameLoop} from '../src/visibleFrameLoop.js';
import {disposeScene} from '../src/disposeScene.js';

function environment(hidden = false) {
  let now = 0, id = 0;
  const pending = new Map(), listeners = new Set();
  const page = {hidden, addEventListener: (_, callback) => listeners.add(callback), removeEventListener: (_, callback) => listeners.delete(callback)};
  const clock = {now: () => now, frame: callback => {pending.set(++id, callback); return id;}, cancel: key => pending.delete(key)};
  return {page, clock, pending, listeners,
    advance(ms) {now += ms; const frames = [...pending.values()]; pending.clear(); frames.forEach(callback => callback(now));},
    visible(value) {page.hidden = !value; listeners.forEach(callback => callback());},
  };
}

test('切到后台不安排帧，返回后只累计可见时间', () => {
  const env = environment(), frames = [];
  const loop = createVisibleFrameLoop(frame => frames.push(frame), env);
  env.advance(100);
  assert.equal(loop.elapsed, 100);
  env.visible(false);
  assert.equal(env.pending.size, 0);
  env.advance(10000);
  env.visible(true);
  env.advance(16);
  assert.deepEqual(frames.at(-1), {elapsed: 116, delta: 16});
  loop.dispose();
});

test('初始隐藏、重复可见事件不产生并行循环，销毁可重复调用', () => {
  const env = environment(true);
  let rendered = 0;
  const loop = createVisibleFrameLoop(() => rendered++, env);
  assert.equal(env.pending.size, 0);
  env.visible(true); env.visible(true);
  assert.equal(env.pending.size, 1);
  loop.dispose(); loop.dispose();
  env.advance(1000); env.visible(false); env.visible(true);
  assert.equal(rendered, 0);
  assert.equal(env.pending.size, 0);
  assert.equal(env.listeners.size, 0);
});

test('动画完成自动停帧并注销监听', () => {
  const env = environment();
  createVisibleFrameLoop(() => false, env);
  env.advance(16);
  assert.equal(env.pending.size, 0);
  assert.equal(env.listeners.size, 0);
});

test('共享几何体、材质与纹理各释放一次，同时释放阴影贴图', () => {
  const scene = new THREE.Scene();
  const geometry = new THREE.BoxGeometry();
  const texture = new THREE.Texture();
  const material = new THREE.MeshBasicMaterial({map: texture});
  scene.add(new THREE.Mesh(geometry, material), new THREE.Mesh(geometry, [material, material]));
  const light = new THREE.DirectionalLight();
  light.shadow.map = new THREE.WebGLRenderTarget(16, 16);
  scene.add(light);
  const counts = [0, 0, 0, 0];
  [geometry, material, texture, light.shadow.map].forEach((resource, i) => resource.addEventListener('dispose', () => counts[i]++));
  disposeScene(scene, [texture]);
  assert.deepEqual(counts, [1, 1, 1, 1]);
});
