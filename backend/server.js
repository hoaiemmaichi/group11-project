// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');
const logsRoutes = require('./routes/logs');

// Nạp biến môi trường từ file .env trong thư mục backend
dotenv.config({ path: __dirname + '/.env' });
const app = express();

// ✅ Enable CORS cho frontend (bao gồm localhost và Vercel)
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://group11-project-jmv4.vercel.app', // ✅ domain frontend trên Vercel
  'https://group11-project-sage.vercel.app',
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('🚫 CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Màu sắc cho console logging
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Log chi tiết request/response với màu sắc
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toLocaleTimeString();

  console.log('\n' + '─'.repeat(80));
  console.log(`${colors.dim}[${timestamp}]${colors.reset} ${colors.bright}${colors.yellow}${req.method}${colors.reset} ${req.originalUrl}`);

  if (Object.keys(req.body || {}).length > 0) {
    console.log(`${colors.dim}Body:${colors.reset}`, JSON.stringify(req.body, null, 2));
  }

  const originalEnd = res.end;
  res.end = function (chunk, encoding) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor =
      status >= 500 ? colors.red :
      status >= 400 ? colors.yellow :
      status >= 300 ? colors.cyan : colors.green;

    console.log(`${colors.dim}[${timestamp}]${colors.reset} ${statusColor}${status}${colors.reset} ${colors.dim}(${duration}ms)${colors.reset}`);

    if (chunk) {
      let body;
      try {
        body = JSON.parse(chunk);
        if (body.token) body.token = body.token.substring(0, 15) + '...';
        if (body.refreshToken) body.refreshToken = body.refreshToken.substring(0, 15) + '...';
        console.log(`${colors.dim}Response:${colors.reset}`, JSON.stringify(body, null, 2));
      } catch (e) {}
    }
    console.log('─'.repeat(80));
    originalEnd.apply(res, arguments);
  };

  next();
});

// Endpoint ping cơ bản
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API đang chạy' });
});

// Middleware JSON parser
app.use(express.json());

// Phục vụ tệp tĩnh trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔗 Kết nối MongoDB
mongoose.set('bufferCommands', false);
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Connection error:', err));
} else {
  console.error('❌ Thiếu MONGODB_URI trong file .env — vui lòng thêm biến này.');
}

// Health check để test trạng thái DB
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.json({ ok: true, dbState });
});

// Mount các route chính
app.use('/', userRoutes);
app.use('/auth', authRoutes);
app.use('/', uploadRoutes);
app.use('/logs', logsRoutes);

// Endpoint test POST (ping)
app.post('/ping', (req, res) => {
  res.json({ ok: true, method: 'POST', url: req.originalUrl, body: req.body || null });
});

app.all('/echo', (req, res) => {
  res.json({ ok: true, method: req.method, url: req.originalUrl, headers: req.headers, body: req.body || null });
});

// 🚀 Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server đang chạy tại http://localhost:${PORT}`));

// Global error handler
app.use((err, req, res, next) => {
  console.error('[global error]', err);
  const status = err.status || 500;
  res.status(status).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    message: 'Không tìm thấy endpoint',
    method: req.method,
    path: req.originalUrl,
  });
});
