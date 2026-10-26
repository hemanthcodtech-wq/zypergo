const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zypergo');
    console.log('Connected to MongoDB');

    const adminPhone = '9999999999';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ phone: adminPhone });
    if (existingAdmin) {
      console.log('Seed Admin already exists!');
      process.exit(0);
    }

    const adminUser = new User({
      name: 'System Admin',
      phone: adminPhone,
      email: 'zypergo2026@gmail.com',
      password: 'admin', // In a real app this should be a strong password, but this is a seed for testing. Hashing is handled by pre-save hook.
      role: 'SuperAdmin',
      isActive: true,
      kycVerified: true
    });

    await adminUser.save();
    console.log('Seed Admin created successfully!');
    console.log('Phone: 9999999999');
    console.log('Password/OTP bypass: 1234');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
