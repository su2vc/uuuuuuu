// Local paths stay relative to the deployment base, including subdirectory hosting.
export const asset = path => /^(?:https?:\/\/|\/)/.test(path) ? path : `${import.meta.env.BASE_URL}${path}`;
