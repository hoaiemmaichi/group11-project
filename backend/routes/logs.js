const express = require('express');
const router = express.Router();
const { requireAuth, requireRole } = require('../middleware/authMiddleware');
const logController = require('../controllers/logController');
const jwt = require('jsonwebtoken');
const broadcaster = require('../utils/logBroadcaster');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// Only admins may read logs
router.get('/', requireAuth, requireRole('admin'), logController.list);

// SSE stream for real-time logs. Accepts token via query string: /logs/stream?token=...
router.get('/stream', async (req, res) => {
	try {
		const token = req.query && req.query.token;
		if (!token) return res.status(401).end('Missing token');
		let payload;
		try { payload = jwt.verify(token, JWT_SECRET); } catch (err) { return res.status(401).end('Invalid token'); }
		if (!payload || payload.role !== 'admin') return res.status(403).end('Forbidden');

		// setup SSE headers
		res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
		res.flushHeaders && res.flushHeaders();

		// send a comment/hello
		res.write(`: connected\n\n`);

		// add to broadcaster list
		broadcaster.addClient(res);

		// remove on close
		req.on('close', () => {
			broadcaster.removeClient(res);
		});
	} catch (err) {
		console.error('[logs.stream] error', err);
		try { res.status(500).end(); } catch(_) {}
	}
});

module.exports = router;
