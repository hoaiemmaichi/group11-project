const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://hoaiem:hoaiem1234@groupdb.14hxmuu.mongodb.net/groupDB?retryWrites=true&w=majority';

async function upsertUser({ name, email, password, role }) {
  const hash = await bcrypt.hash(password, 10);
  const update = { name, email, role, password: hash };
  const opts = { upsert: true, new: true, setDefaultsOnInsert: true };
  // find by email
  const exists = await User.findOne({ email }).select('+password');
  if (exists) {
    exists.name = name;
    exists.role = role;
    exists.password = hash;
    await exists.save();
    return exists;
  } else {
    const u = new User(update);
    await u.save();
    return u;
  }
}

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to DB');
  const users = [
    { name: 'Admin User', email: 'admin@example.com', password: 'Admin@123', role: 'admin' },
    { name: 'Moderator User', email: 'moderator@example.com', password: 'Mod@123', role: 'moderator' },
    { name: 'Regular User', email: 'user@example.com', password: 'User@123', role: 'user' },
  ];
  for (const u of users) {
    const res = await upsertUser(u);
    console.log(`Seeded ${u.role}: ${res.email}`);
  }
  await mongoose.disconnect();
  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
