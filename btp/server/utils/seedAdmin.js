import User from '../models/User.js';

export async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const existing = await User.findOne({ email });
  if (existing) return;
  await User.create({ email, password, name: 'Admin', role: 'admin' });
  console.log('Default admin created:', email);
}
