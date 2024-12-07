import NodeCache from 'node-cache';

// Ensure a single shared instance
let cache = global.nodeCacheInstance;
if (!cache) {
  cache = new NodeCache();
  global.nodeCacheInstance = cache;
}

export default cache;