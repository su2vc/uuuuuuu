// Shared mesh materials and textures must only be disposed once per scene.
export function disposeScene(scene, ownedTextures = []) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set(ownedTextures);
  scene.traverse(object => {
    if (object.geometry) geometries.add(object.geometry);
    if (object.material) {
      for (const material of [object.material].flat()) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    }
    object.shadow?.dispose();
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
}
