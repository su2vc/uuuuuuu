import optimizedImages from 'virtual:optimized-images';

// Production maps uploaded images to OSS; remaining local paths respect the deployment base.
export const asset = path => Object.hasOwn(optimizedImages, path) ? optimizedImages[path] : /^(?:https?:\/\/|\/)/.test(path) ? path : `${import.meta.env.BASE_URL}${path}`;

// Match CSS masks and Three.js texture requests so password-page warmup shares the cache.
export const imageCrossOrigin = path => /^https:\/\//.test(optimizedImages[path] || path || '') ? 'anonymous' : undefined;
