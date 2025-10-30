const Log = require('../models/Log');

// GET /logs?limit=50&page=1&userId=...
exports.list = async (req, res) => {
  try {
    const limit = Math.min(200, Number(req.query.limit) || 50);
    const page = Math.max(1, Number(req.query.page) || 1);
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.action) filter.action = req.query.action;
    // timeframe filters
    if (req.query.since) filter.timestamp = { $gte: new Date(req.query.since) };
    if (req.query.until) filter.timestamp = Object.assign(filter.timestamp || {}, { $lte: new Date(req.query.until) });

    const total = await Log.countDocuments(filter);
    const items = await Log.find(filter).sort({ timestamp: -1 }).skip((page - 1) * limit).limit(limit).lean();
    return res.json({ total, page, limit, items });
  } catch (err) {
    console.error('[logController.list] error:', err);
    return res.status(500).json({ message: 'Lỗi khi lấy logs' });
  }
};
