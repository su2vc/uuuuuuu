// Extend the original camera window into the page's empty margins without zooming out.
export function configureOpeningCamera(camera, width, height, mobile = false) {
  const originalHeight = height * (mobile ? .61 : .71);
  const originalTop = height * (mobile ? .16 : .12);
  camera.position.set(5, 3.8, 8).multiplyScalar(width < 600 ? 1.4 : 1);
  camera.lookAt(0, .8, 0);
  camera.setViewOffset(width, originalHeight, 0, -originalTop, width, height);
  camera.updateMatrixWorld(true);
}
