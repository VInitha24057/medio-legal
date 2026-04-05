const cache = new Map();

const CACHE_TTL = 60000;

const cacheMiddleware = (duration = CACHE_TTL) => {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < duration) {
      console.log(`📦 Cache hit: ${key}`);
      return res.json(cached.data);
    }

    // Store original json function
    const originalJson = res.json.bind(res);
    
    // Override res.json to cache successful responses
    res.json = (data) => {
      if (data && data.success) {
        cache.set(key, { data, timestamp: Date.now() });
        console.log(`💾 Cached: ${key}`);
      }
      return originalJson(data);
    };

    next();
  };
};

const clearCache = (pattern) => {
  if (!pattern) {
    cache.clear();
    console.log('🗑️ Cache cleared');
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      console.log(`🗑️ Cleared cache: ${key}`);
    }
  }
};

module.exports = { cacheMiddleware, clearCache };