const cache = require('../config/cache');

function cacheMiddlewar(keyFn, ttl = 60, namespace = 'cache') {
  return (req, res, next) => {
    const cacheKey = `${namespace}:${keyFn(req)}`;

    try {
      const cachedValue = cache.get(cacheKey);
      if (cachedValue) {
        res.setHeader('X-Cache', 'HIT');
        return res.json(JSON.parse(cachedValue));
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        try {
          // Store stringified JSON in cache
          cache.set(cacheKey, JSON.stringify(body), ttl);
        } catch (err) {
          console.error(
            `[Cache] Failed to cache response for ${cacheKey}:`,
            err
          );
        }
        res.setHeader('X-Cache', 'MISS');
        return originalJson(body);
      };
    } catch (err) {
      console.error(`[Cache] Error with key ${cacheKey}:`, err);
    }

    return next();
  };
}

module.exports = {
  cacheMiddlewar,
};
