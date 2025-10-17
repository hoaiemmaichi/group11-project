const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = 'mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority';

async function main() {
  const [,, email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Cách dùng: node scripts/setPassword.js <email> <mật_khẩu_mới>');
    process.exit(1);
  }
  await mongoose.connect(MONGO_URI);
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    console.error('Không tìm thấy tài khoản với email:', email);
    process.exit(2);
  }
  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  console.log('Đã đặt lại mật khẩu cho', email);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(99); });
