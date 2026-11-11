const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generates a unique 4-digit pickup OTP (1000-9999) not used by any existing user.
 * @returns {Promise<string>}
 */
async function generateUniquePickupOtp() {
  for (let attempt = 0; attempt < 100; attempt++) {
    const candidate = Math.floor(1000 + Math.random() * 9000).toString();
    const exists = await User.exists({ pickupOtp: candidate });
    if (!exists) {
      return candidate;
    }
  }
  throw new Error('Unable to allocate a unique 4-digit pickup OTP');
}

/**
 * Ensures the given user has a permanent unique 4-digit pickupOtp persisted in DB.
 * Safe against concurrent writes via unique index retry.
 * @param {import('mongoose').Document | null} user
 * @returns {Promise<string | null>}
 */
async function ensureUserPickupOtp(user) {
  if (!user || !user._id) return null;
  if (/^\d{4}$/.test(String(user.pickupOtp || ''))) {
    return String(user.pickupOtp);
  }

  // Re-read fresh copy first in case another request just assigned it
  const fresh = await User.findById(user._id).select('pickupOtp');
  if (fresh && /^\d{4}$/.test(String(fresh.pickupOtp || ''))) {
    user.pickupOtp = String(fresh.pickupOtp);
    return user.pickupOtp;
  }

  for (let retry = 0; retry < 10; retry++) {
    const candidate = await generateUniquePickupOtp();
    try {
      const updated = await User.findByIdAndUpdate(
        user._id,
        { $set: { pickupOtp: candidate } },
        { new: true }
      );
      if (updated && updated.pickupOtp) {
        user.pickupOtp = updated.pickupOtp;
        return updated.pickupOtp;
      }
    } catch (err) {
      if (err && err.code === 11000) {
        continue; // Retry if another user took candidate concurrently
      }
      throw err;
    }
  }
  throw new Error('Failed to assign permanent pickup OTP after retries');
}

/**
 * Resolves the customer User document for a booking request using senderId, JWT, phone, or email.
 * @returns {Promise<import('mongoose').Document | null>}
 */
async function resolveCustomerForBooking({ authHeader, senderId, phone, email }) {
  if (senderId) {
    try {
      const bySender = await User.findById(senderId);
      if (bySender) return bySender;
    } catch (e) {}
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      if (decoded?.id) {
        const byToken = await User.findById(decoded.id);
        if (byToken) return byToken;
      }
    } catch (e) {}
  }

  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
    if (cleanPhone.length === 10) {
      const byPhone = await User.findOne({
        $or: [
          { phone: cleanPhone },
          { phone: '+91' + cleanPhone },
          { phone: '91' + cleanPhone }
        ]
      });
      if (byPhone) return byPhone;
    }
  }

  if (email) {
    const escaped = String(email).trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (escaped) {
      const byEmail = await User.findOne({ email: new RegExp('^' + escaped + '$', 'i') });
      if (byEmail) return byEmail;
    }
  }

  return null;
}

module.exports = {
  generateUniquePickupOtp,
  ensureUserPickupOtp,
  resolveCustomerForBooking
};

