const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Mocking auth, so this can be optional for now
  },
  senderDetails: {
    name: { type: String },
    phone: { type: String },
    email: { type: String }
  },
  pickupLocation: {
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  dropLocation: {
    address: { type: String, required: true },
    pincode: { type: String, required: true },
    landmark: { type: String },
    lat: { type: Number },
    lng: { type: Number }
  },
  receiver: {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String }
  },
  packageDetails: {
    category: { type: String, required: true },
    weight: { type: Number, required: true }, // in kg
    dimensions: {
      length: { type: Number }, // in cm
      width: { type: Number },
      height: { type: Number }
    },
    value: { type: Number, required: true },
    description: { type: String },
    fragile: { type: Boolean, default: false },
    prohibitedDeclared: { type: Boolean, required: true }
  },
  photos: {
    parcelUrl: { type: String },
    senderUrl: { type: String },
    billUrl: { type: String }
  },
  scheduling: {
    type: { type: String, enum: ['Now', 'Later'], default: 'Now' },
    date: { type: String },
    timeSlot: { type: String }
  },
  preferences: {
    speed: { type: String, enum: ['Standard', 'Express'], default: 'Standard' },
    handlingNotes: { type: String }
  },
  payment: {
    mode: { type: String, enum: ['UPI', 'Card', 'NetBanking', 'Wallet', 'Cash'], required: true },
    status: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refunded'], default: 'Pending' },
    payer: { type: String, enum: ['Sender', 'Receiver'], required: true },
    transactionId: { type: String },
    razorpayOrderId: { type: String }
  },
  pricing: {
    base: { type: Number, default: 0 },
    distance: { type: Number, default: 0 },
    weight: { type: Number, default: 0 },
    volumetric: { type: Number, default: 0 },
    helperFee: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  helpers: {
    needed: { type: Boolean, default: false },
    count: { type: Number, default: 0 },
    workType: { type: String, enum: ['Load Only', 'Unload Only', 'Load & Unload', 'None'], default: 'None' },
    ratePerHelper: { type: Number, default: 0 },
    totalFee: { type: Number, default: 0 }
  },
  deliveryMode: {
    type: String,
    enum: ['DIRECT_INTRACITY', 'DIRECT_DEDICATED', 'HUB_RELAY'],
    default: 'DIRECT_INTRACITY'
  },
  assignedHelpers: [{
    helperId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: String,
    phone: String,
    roleType: { type: String, enum: ['Loader', 'Unloader', 'Both'], default: 'Both' },
    status: { type: String, enum: ['Assigned', 'Arrived', 'Completed'], default: 'Assigned' },
    fee: { type: Number, default: 0 }
  }],
  metadata: {
    intracity: { type: Boolean, default: true },
    vehicleType: { type: String },
    sourceHub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
    destinationHub: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
    assignedPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'Partner' },
    deliveryType: { type: String }
  },
  assignedRiders: [{
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['Active', 'Handed Over'], default: 'Active' }
  }],
  currentRider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  transhipmentLogs: [{
    fromRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toRider: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    location: { lat: Number, lng: Number },
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: 'Transhipment Complete' }
  }],
  intercityTransitLog: [{
    carrierName: String,
    vehicleNumber: String,
    dispatchTime: Date,
    arrivalTime: Date,
    loggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now }
  }],
  status: {
    type: String,
    enum: [
      'Pending', 'Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 
      'Arrived at Pickup', 'Picked Up', 'Source Hub Received', 'Sorted', 'Partner Handover', 
      'In Transit', 'Destination Hub Received', 'Out for Delivery', 
      'Delivered', 'Delayed', 'Failed', 'Returned', 'Cancelled', 'Relay Handoff Pending'
    ],
    default: 'Pending'
  },
  trackingId: { type: String, unique: true },
  eta: { type: String },
  pickupOtp: { type: String },
  proofOfDelivery: {
    otp: { type: String },
    signatureUrl: { type: String },
    gpsLocation: {
      lat: { type: Number },
      lng: { type: Number }
    },
    timestamp: { type: Date }
  },
  rating: {
    pickupRider: { type: Number, min: 1, max: 5 },
    deliveryRider: { type: Number, min: 1, max: 5 },
    overall: { type: Number, min: 1, max: 5 },
    feedback: { type: String }
  },
  trackingHistory: [{
    status: String,
    scanType: { type: String },
    timestamp: { type: Date, default: Date.now },
    location: String,
    description: String,
    scannedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    hubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hub' },
    deviceId: { type: String },
    gps: { lat: Number, lng: Number },
    parcelCondition: { type: String, default: 'Good' }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
