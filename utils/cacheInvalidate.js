const cache = require('../config/cache');

function invalidateKey(pattern) {
  try {
    const allKeys = cache.keys();
    // Convert Redis pattern to RegExp (e.g., 'albums:*' -> /^albums:.*$/)
    const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    
    const keysToDelete = allKeys.filter(key => regexPattern.test(key));

    if (!keysToDelete.length) {
      console.log(`[Cache] No keys matched pattern: ${pattern}`);
      return;
    }

    cache.del(keysToDelete);
    console.log(
      `[Cache] Invalidated ${keysToDelete.length} key(s) for pattern: ${pattern}`
    );
  } catch (err) {
    console.error(`[Cache] Failed to invalidate ${pattern}:`, err);
  }
}

module.exports = { invalidateKey };
