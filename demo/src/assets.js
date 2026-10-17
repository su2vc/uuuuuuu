import optimizedImages from 'virtual:optimized-images';

// Local paths stay relative to the deployment base, including subdirectory hosting.
export const asset = path => Object.hasOwn(optimizedImages, path) ? optimizedImages[path] : /^(?:https?:\/\/|\/)/.test(path) ? path : `${import.meta.env.BASE_URL}${path}`;
