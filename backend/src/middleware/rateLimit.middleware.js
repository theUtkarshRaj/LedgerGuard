const AppError = require("../utils/AppError");

const buckets = new Map();

function prune(bucket, windowMs, now) {
  while (bucket.length && now - bucket[0] > windowMs) bucket.shift();
}

/**
 * Fixed-window style limiter keyed by IP. Good enough for local demos;
 * use Redis in production behind a load balancer.
 */
function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  return (req, res, next) => {
    const key = req.ip || "unknown";
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = [];
      buckets.set(key, bucket);
    }
    prune(bucket, windowMs, now);
    if (bucket.length >= max) {
      return next(
        new AppError("Too many requests. Slow down for a moment.", 429)
      );
    }
    bucket.push(now);
    next();
  };
}

module.exports = rateLimit();
