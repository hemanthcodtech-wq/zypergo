require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

const seedSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/zypergo', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('Connected to MongoDB');

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@zypergo.com';
    const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'AdminPassword123!';
    const adminPhone = process.env.SEED_ADMIN_PHONE || '+919999999999';
    
    // Check if superadmin already exists
    const existingAdmin = await User.findOne({ $or: [{ email: adminEmail }, { phone: adminPhone }] });
    if (existingAdmin) {
      console.log('SuperAdmin already exists with email / phone:', existingAdmin.email, existingAdmin.phone);
      process.exit(0);
    }

    const superAdmin = new User({
      role: 'SuperAdmin',
      name: 'System Administrator',
      email: adminEmail,
      phone: adminPhone,
      password: adminPassword, // This will be hashed automatically by the pre-save hook in User model
      isActive: true,
      kycVerified: true
    });

    await superAdmin.save();
    console.log('Successfully seeded SuperAdmin user:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('Phone:', adminPhone);

  } catch (error) {
    console.error('Error seeding SuperAdmin:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

seedSuperAdmin();
