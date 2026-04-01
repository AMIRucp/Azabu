module.exports = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
  mergeItem: () => Promise.resolve(),
  clear: () => Promise.resolve(),
  getAllKeys: () => Promise.resolve([]),
  multiGet: () => Promise.resolve([]),
  multiSet: () => Promise.resolve(),
  multiRemove: () => Promise.resolve(),
  multiMerge: () => Promise.resolve(),
  flushGetRequests: () => {},
};
