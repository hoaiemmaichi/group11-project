const express = require('express');
const mongoose = require('mongoose');
const User = require('./User'); // ✅ import model từ file User.js
const app = express();

app.use(express.json());

// 🔗 Kết nối MongoDB Atlas
mongoose.connect('mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority&appName=groupDB')
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

// 🚀 Khởi chạy server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
