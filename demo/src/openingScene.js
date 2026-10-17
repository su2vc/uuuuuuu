import * as THREE from 'three';
import { configureOpeningCamera } from './openingCamera';
import { createVisibleFrameLoop } from './visibleFrameLoop';
import { disposeScene } from './disposeScene';
import { asset } from './assets';
import { openingPhotoPaths } from './openingPhotos';
const ease = t => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
export function createOpeningScene(el, pointer, {
  onReveal,
  onComplete
}) {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true
  });
  let disposed = false,
    scene,
    observer,
    loop;
  const textures = [];
  const state = {
    start: null,
    revealed: false
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    loop?.dispose();
    observer?.disconnect();
    if (scene) disposeScene(scene, textures);
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
  try {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    el.append(renderer.domElement);
    scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, .1, 100);
    camera.position.set(5, 3.8, 8);
    camera.lookAt(0, .7, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xc4bcd8, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-3, 7, 5);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -5;
    light.shadow.camera.right = 5;
    light.shadow.camera.top = 5;
    light.shadow.camera.bottom = -5;
    light.shadow.normalBias = .03;
    scene.add(light);
    const root = new THREE.Group();
    scene.add(root);
    const outline = new THREE.LineBasicMaterial({
      color: 0x59536f,
      transparent: true,
      opacity: .65
    });
    const lilac = new THREE.MeshToonMaterial({
        color: 0xb5a5d4
      }),
      inner = new THREE.MeshToonMaterial({
        color: 0xffedc5
      }),
      lime = new THREE.MeshToonMaterial({
        color: 0xd2df89
      });
    function slab(parent, w, h, d, x, y, z, mat = lilac) {
      const geo = new THREE.BoxGeometry(w, h, d);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), outline));
      return mesh;
    }
    // Separate hollow walls and hinge geometry allow a genuine articulated opening.
    slab(root, 3.35, .12, 2.15, 0, -.04, 0);
    slab(root, 3.35, 1.42, .09, 0, .67, 1.03);
    slab(root, 3.35, 1.42, .09, 0, .67, -1.03);
    slab(root, .09, 1.42, 2.05, -1.63, .67, 0);
    slab(root, .09, 1.42, 2.05, 1.63, .67, 0);
    slab(root, 3.16, .03, 1.94, 0, .04, 0, inner);
    const hinge = new THREE.Group();
    hinge.position.set(0, 1.4, -1.075);
    root.add(hinge);
    slab(hinge, 3.48, .22, 2.25, 0, .08, 1.075);
    slab(hinge, 3.28, .025, 2.05, 0, -.045, 1.075, inner);
    slab(hinge, .42, .36, .055, 0, -.12, 2.22, lime);
    const photos = [];
    const loader = new THREE.TextureLoader();
    openingPhotoPaths.forEach((file, i) => {
      const photo = new THREE.Group();
      slab(photo, 1.14, 1.33, .025, 0, 0, 0, new THREE.MeshToonMaterial({
        color: 0xfffbee
      }));
      const texture = loader.load(asset(file), () => {
        if (disposed) texture.dispose();
      });
      texture.colorSpace = THREE.SRGBColorSpace;
      textures.push(texture);
      const art = new THREE.Mesh(new THREE.PlaneGeometry(.98, .95), new THREE.MeshBasicMaterial({
        map: texture,
        color: 0xd9d6d6
      }));
      art.position.set(0, .08, .017);
      photo.add(art);
      photo.position.set((i - 1) * .8, 1.05, -.28 + i * .3);
      photo.rotation.set(-.08, 0, (i - 1) * -.16);
      root.add(photo);
      photos.push(photo);
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({
      opacity: .11
    }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -.24;
    floor.receiveShadow = true;
    scene.add(floor);
    const resize = () => {
      const {
        width,
        height
      } = el.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      renderer.setSize(width, height);
      configureOpeningCamera(camera, width, height, window.innerWidth <= 650);
    };
    observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    loop = createVisibleFrameLoop(({
      elapsed: now,
      delta
    }) => {
      const dt = Math.min(delta / 1000, .05);
      const t = state.start === null ? 0 : (now - state.start) / 1000;
      const opening = state.start !== null;
      const target = opening ? -1.52 * ease(t / .9) : pointer.hover ? -.46 : -.25;
      hinge.rotation.x = THREE.MathUtils.damp(hinge.rotation.x, target, opening ? 9 : 5, dt);
      root.rotation.y = THREE.MathUtils.damp(root.rotation.y, reduce.matches ? 0 : pointer.x * .10, 4, dt);
      root.rotation.x = THREE.MathUtils.damp(root.rotation.x, reduce.matches ? 0 : pointer.y * .035, 4, dt);
      root.position.y = reduce.matches ? 0 : Math.sin(now * .0013) * .045;
      photos.forEach((p, i) => {
        const lift = opening ? ease((t - .35 - i * .10) / .85) : 0;
        const fly = opening ? ease((t - 1.15) / .85) : 0;
        p.position.y = 1.05 + lift * (1.35 + i * .13) + fly * .45;
        p.position.x = (i - 1) * (.8 + lift * .4);
        p.position.z = -.28 + i * .3 + fly * (4 + i);
        p.rotation.z = (i - 1) * (-.16 - lift * .12);
        p.scale.setScalar(1 + fly * 1.7);
      });
      if (opening) {
        root.position.z = ease((t - .8) / 1.5) * .7;
        if (t > 1.5 && !state.revealed) {
          state.revealed = true;
          onReveal();
        }
        if (t > 2.35) {
          onComplete();
          return false;
        }
      }
      renderer.render(scene, camera);
    });
    return {
      open() {
        if (state.start === null) state.start = loop.elapsed;
      },
      dispose
    };
  } catch (error) {
    dispose();
    throw error;
  }
}
