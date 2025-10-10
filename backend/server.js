
// const express = require('express');
// const dotenv = require('dotenv');
// const userRoutes = require('./routes/user');

// dotenv.config();
// const app = express();

// app.use(express.json());
// app.use('/', userRoutes);

// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// server.js
const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/user');

dotenv.config();
const app = express();

// ✅ Enable CORS cho frontend
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:3000'], // Support cả 2 port
  credentials: true
}));

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
