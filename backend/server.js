

// // const express = require('express');
// // const dotenv = require('dotenv');
// // const userRoutes = require('./routes/user');

// // dotenv.config();
// // const app = express();

// // app.use(express.json());
// // app.use('/', userRoutes);

// // const PORT = process.env.PORT || 3000;
// // app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// // server.js
// const express = require('express');
// const dotenv = require('dotenv');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const userRoutes = require('./routes/user');
// const authRoutes = require('./routes/auth');
// const express = require('express');
// const dotenv = require('dotenv');
// const userRoutes = require('./routes/user');

// dotenv.config();
// const app = express();

// // ✅ Enable CORS cho frontend
// app.use(cors({
//   origin: ['http://localhost:3001', 'http://localhost:3000'], // Support cả 2 port
//   credentials: true
// }));

// app.use(express.json());

// // 🔗 Kết nối MongoDB Atlas
// mongoose.connect('mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority')
//   .then(() => console.log('✅ MongoDB connected'))
//   .catch(err => console.error('❌ Connection error:', err));

// // Dùng routes/user.js cho toàn bộ CRUD
// app.use('/', userRoutes);
// // Mount auth
// app.use('/auth', authRoutes);

// // 🚀 Khởi chạy server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));


// app.use(express.json());
// app.use('/', userRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const userRoutes = require('./routes/user');
const authRoutes = require('./routes/auth');
const uploadRoutes = require('./routes/upload');

// Nạp biến môi trường từ file .env trong thư mục backend
dotenv.config({ path: __dirname + '/.env' });

const userRoutes = require('./routes/user');
const User = require('./models/User'); // ✅ import model đúng đường dẫn

dotenv.config();

const app = express();

// ✅ Enable CORS cho frontend
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Support cả 2 port
  credentials: true
}));

// Log đơn giản mọi request để dễ theo dõi trên console (đặt trước body parser)
app.use((req, res, next) => {
  console.log(`[req] ${req.method} ${req.originalUrl}`);
  next();
});

// Endpoint ping cơ bản (có thể dùng để test GET)
app.get('/', (req, res) => {
  res.json({ ok: true, message: 'API đang chạy' });
});

// Body parser JSON sau khi đã có các route chẩn đoán
app.use(express.json());

// Static serving for local uploads fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔗 Kết nối MongoDB
// Tắt buffer để không treo request khi DB chưa sẵn sàng
mongoose.set('bufferCommands', false);
const MONGODB_URI = process.env.MONGODB_URI;
if (MONGODB_URI) {
  // Kết nối với timeout ngắn để fail sớm khi có sự cố mạng/Atlas
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000
  })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => console.error('❌ Connection error:', err));
} else {
  console.error('❌ Thiếu MONGODB_URI trong file .env — vui lòng thêm biến này.');
}

// Health check để kiểm tra nhanh trạng thái server/DB
app.get('/health', (req, res) => {
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = states[mongoose.connection.readyState] || 'unknown';
  res.json({ ok: true, dbState });
});

// Dùng routes/user.js cho toàn bộ CRUD
app.use('/', userRoutes);
// Mount auth routes (signup/login)
app.use('/auth', authRoutes);
// Mount upload routes
app.use('/', uploadRoutes);

// Endpoint chẩn đoán: không dùng DB, phản hồi ngay lập tức (đặt sau body parser để có body)
app.post('/ping', (req, res) => {
  res.json({ ok: true, method: 'POST', url: req.originalUrl, body: req.body || null });
});

app.all('/echo', (req, res) => {
  res.json({ ok: true, method: req.method, url: req.originalUrl, headers: req.headers, body: req.body || null });
});

// 🚀 Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// Global error handler — trả về JSON, tránh gửi HTML stacktrace cho client
app.use((err, req, res, next) => {
  console.error('[global error]', err);
  const status = err.status || 500;
  res.status(status).json({ message: 'Lỗi máy chủ, vui lòng thử lại sau' });
});

// 404 JSON cho các route không khớp
app.use((req, res) => {
  res.status(404).json({ message: 'Không tìm thấy endpoint', method: req.method, path: req.originalUrl });
});
app.use(express.json());

// 🔗 Kết nối MongoDB Atlas
mongoose.connect('mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Connection error:', err));

// 📥 POST: thêm user mới
app.post('/users', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (err) {
    res.status(400).send({ error: err.message });
  }
});

// 📤 GET: lấy danh sách user
app.get('/users', async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    res.status(500).send({ error: err.message });
  }
});

// Hoặc nếu bạn đã có routes/user.js riêng thì có thể dùng:
// app.use('/', userRoutes);



app.use(express.json());

// 🔗 Kết nối MongoDB Atlas
mongoose.connect('mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority')
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ Connection error:', err));

// Dùng routes/user.js cho toàn bộ CRUD
app.use('/', userRoutes);


// 🚀 Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
