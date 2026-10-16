import test from 'node:test';
import assert from 'node:assert/strict';
import {PerspectiveCamera,Vector3,Euler} from 'three';
import {configureOpeningCamera} from '../src/openingCamera.js';

for(const [viewportWidth,height] of [[1440,900],[800,700],[390,844],[1920,600]]) {
  const mobile=viewportWidth<=650,width=viewportWidth*(mobile?1.24:1);
  test(`expanded canvas preserves the original box size and position at ${viewportWidth}x${height}`,()=>{
    const originalHeight=height*(mobile ? .61 : .71),top=height*(mobile ? .16 : .12);
    const old=new PerspectiveCamera(32,width/originalHeight,.1,100);
    old.position.set(5,3.8,8).multiplyScalar(width<600?1.4:1);old.lookAt(0,.8,0);old.updateMatrixWorld(true);
    const camera=new PerspectiveCamera(32,1,.1,100);
    configureOpeningCamera(camera,width,height,mobile);
    for(const point of [new Vector3(-1.67,0,1.03),new Vector3(1.67,1.4,1.03),new Vector3(0,.8,0)]) {
      const before=point.clone().project(old),after=point.clone().project(camera);
      assert.ok(Math.abs((before.x+1)*width/2-(after.x+1)*width/2)<1e-7);
      assert.ok(Math.abs(top+(1-before.y)*originalHeight/2-(1-after.y)*height/2)<1e-7);
    }
  });
  test(`the raised lid has room above the old canvas at ${viewportWidth}x${height}`,()=>{
    const camera=new PerspectiveCamera(32,1,.1,100);
    configureOpeningCamera(camera,width,height,mobile);
    for(const angle of [0,-.46,-1,-1.52])
      for(const x of [-1.74,1.74])
        for(const y of [-.03,.19])
          for(const z of [-.05,2.2]) {
            const point=new Vector3(x,y,z).applyEuler(new Euler(angle,0,0)).add(new Vector3(0,1.4,-1.075));
            point.applyEuler(new Euler(.035,.1,0)).add(new Vector3(0,.045,.7));
            const projected=point.project(camera);
            assert.ok(projected.y<1,`lid top clips at ${projected.y}`);
            assert.ok(projected.y>-1,'lid bottom clips');
          }
  });
}
