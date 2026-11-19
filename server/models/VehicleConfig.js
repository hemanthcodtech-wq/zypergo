const mongoose = require('mongoose');

const vehicleConfigSchema = new mongoose.Schema({
  vehicleType: { 
    type: String, 
    enum: ['Scooter', 'Mini 3W', '3 Wheeler', 'Tata Ace', 'Pickup 8ft', 'Pickup 9ft', '14ft', '17ft'],
    required: true,
    unique: true
  },
  displayName: { type: String },
  maxWeight: { type: Number, required: true }, // in kg
  maxVolume: { type: Number }, // in cubic cm
  baseFare: { type: Number, default: 60 },
  baseKm: { type: Number, default: 3 }, // included kms in baseFare
  perKm: { type: Number, default: 6 }, // extra per km rate
  helperFee: { type: Number, default: 0 }, // base helper fee
  minimumCharge: { type: Number, default: 60 },
  etaText: { type: String, default: '10 mins' },
  dimensions: { type: String, default: '45 × 35 × 35 cm' },
  bestFor: { type: String, default: 'Parcels & goods' },
  isActive: { type: Boolean, default: true },
  configuredBy: { type: String, default: 'Super Admin' }
}, { timestamps: true });

module.exports = mongoose.model('VehicleConfig', vehicleConfigSchema);
