
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
const User = require('./models/User'); // ✅ import model đúng đường dẫn

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

// 🚀 Khởi chạy server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
