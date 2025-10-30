const Log = require('../models/Log');
const broadcaster = require('../utils/logBroadcaster');

/**
 * Simple helper to save an activity log.
 * Usage: await logActivity({ userId, action, ip, meta })
 */
async function logActivity({ userId, action, ip, meta }) {
  try {
    const doc = new Log({ userId: userId || null, action, ip: ip || null, meta: meta || null });
    const saved = await doc.save();
    // publish to SSE clients (non-blocking)
    try { broadcaster.publish(saved); } catch (_) {}
  } catch (err) {
    // Do not throw - logging must not break main flow. Print to console for debugging.
    console.error('[logActivity] failed to save log:', err && err.message ? err.message : err);
  }
}

module.exports = logActivity;
