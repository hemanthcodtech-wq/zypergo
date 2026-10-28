const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['Customer', 'Rider', 'SuperAdmin', 'OperationsAdmin', 'OperationsStaff', 'HubManager', 'HubOperator', 'DispatchManager', 'PartnerManager', 'FinanceManager', 'SupportExecutive', 'Auditor'],
    required: true,
    default: 'Customer'
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true // Allows null/undefined to not trigger unique constraint
  },
  password: {
    type: String
  },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  otp: String,
  otpExpiry: Date,
  name: {
    type: String,
    required: true
  },
  photoUrl: String,
  preferredLanguage: {
    type: String,
    default: 'EN'
  },
  isActive: {
    type: Boolean,
    default: true
  },

  // --- Customer Specific Fields ---
  savedAddresses: [{
    type: { type: String, enum: ['Pickup', 'Drop'] },
    addressLine1: String,
    addressLine2: String,
    pincode: String,
    city: String,
    state: String,
    lat: Number,
    lng: Number,
    isDefault: Boolean
  }],
  kycVerified: {
    type: Boolean,
    default: false
  },

  // --- Rider Specific Fields ---
  riderDetails: {
    vehicleType: {
      type: String,
      default: 'Bike'
    },
    vehicleRegistration: String,
    vehicleImageUrl: String,
    vehicleMake: String,
    vehicleModel: String,
    rcNumber: String,
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Suspended'],
      default: 'Pending'
    },
    isOnline: {
      type: Boolean,
      default: false
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      address: String,
      updatedAt: Date
    },
    address: {
      type: String
    },

    assignedHub: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hub'
    },
    documents: {
      drivingLicenseUrl: String,
      rcUrl: String,
      aadhaarUrl: String,
      panUrl: String,
      vehiclePicUrl: String,
      profileImageUrl: String,
      idProofUrl: String // Legacy
    },
    bankDetails: {
      accountNumber: String,
      ifscCode: String
    },
    emergencyContact: {
      name: String,
      phone: String
    },
    isOnShift: {
      type: Boolean,
      default: false
    },
    isOnBreak: {
      type: Boolean,
      default: false
    },
    earnings: {
      cashCollected: { type: Number, default: 0 },
      pendingDeposit: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      walletBalance: { type: Number, default: 0 }
    },
    performance: {
      completionRate: { type: Number, default: 100 },
      failedTasks: { type: Number, default: 0 },
      punctualityScore: { type: Number, default: 100 },
      totalDistance: { type: Number, default: 0 } // in km
    }
  },

  // --- Staff Specific Fields ---
  assignedHubForStaff: { // For HubStaff role
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hub'
  }
}, { timestamps: true });

// Pre-save hook to hash password
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
