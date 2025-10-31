// Simple in-memory rate limiter for login attempts.
// Note: in-memory limits work only for single-server development. For production, use Redis or DB.
const attempts = new Map();

/**
 * rateLimitLogin middleware
 * Options: maxAttempts (default 5), windowMs (default 15 minutes)
 */
function rateLimitLogin(options = {}) {
  const maxAttempts = options.maxAttempts || 5;
  const windowMs = options.windowMs || 15 * 60 * 1000;

  return (req, res, next) => {
    // Use IP + email if available to be slightly more specific
    const ip = req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const email = (req.body && req.body.email) ? String(req.body.email).toLowerCase() : '';
    const key = email ? `${ip}:${email}` : ip;

    const record = attempts.get(key) || { timestamps: [] };
    const now = Date.now();
    // Remove timestamps older than window
    record.timestamps = record.timestamps.filter(ts => (now - ts) < windowMs);

    if (record.timestamps.length >= maxAttempts) {
      const retryAfter = Math.ceil((windowMs - (now - record.timestamps[0])) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({ message: `Quá nhiều lần thử đăng nhập. Vui lòng thử lại sau ${retryAfter} giây.` });
    }

    // push current attempt (but only when we decide to count; here we count for each request and let successful login clear it)
    record.timestamps.push(now);
    attempts.set(key, record);

    // Provide a helper on req to reset attempts on success (called by controllers)
    req.rateLimitKey = key;
    req.rateLimitReset = () => { attempts.delete(key); };

    next();
  };
}

module.exports = rateLimitLogin;
