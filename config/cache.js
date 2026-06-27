const NodeCache = require('node-cache');

// Create a single instance of node-cache
// stdTTL: default time to live in seconds (can be overridden per key)
// checkperiod: period in seconds used for the automatic delete check interval
const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

console.log('[Cache] Local Node.js memory cache initialized');

module.exports = cache;
