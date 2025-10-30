const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Usage:
//   node scripts/createUserWithRole.js "Full Name" email@example.com Password123 moderator
// Role must be one of: user | moderator | admin

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority';

async function main() {
  const [, , name, email, password, role] = process.argv;
  if (!name || !email || !password || !role) {
    console.error('Cách dùng: node scripts/createUserWithRole.js "Họ tên" email@example.com MatKhau123 role');
    console.error('role: user | moderator | admin');
    process.exit(1);
  }
  const allowed = ['user', 'moderator', 'admin'];
  if (!allowed.includes(role)) {
    console.error('Role không hợp lệ. Chỉ cho phép:', allowed.join(', '));
    process.exit(2);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ Đã kết nối MongoDB');

  const existing = await User.findOne({ email }).select('+password');
  const hash = await bcrypt.hash(password, 10);
  if (existing) {
    existing.name = name;
    existing.role = role;
    existing.password = hash;
    await existing.save();
    console.log(`🔁 Đã cập nhật user: ${email} (role=${role})`);
  } else {
    const u = new User({ name, email, role, password: hash });
    await u.save();
    console.log(`🆕 Đã tạo user: ${email} (role=${role})`);
  }
  await mongoose.disconnect();
  console.log('✅ Hoàn tất');
}

main().catch(err => { console.error(err); process.exit(99); });
