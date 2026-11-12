const Booking = require('../models/Booking');
const User = require('../models/User');
const ExceptionNDR = require('../models/ExceptionNDR');
const Settlement = require('../models/Settlement');
const NotificationService = require('../services/notificationService');
const locationService = require('../services/locationService');
const razorpayService = require('../services/razorpayService');
const { upsertHelperAccount } = require('../utils/partnerHelper');

exports.getAvailableJobs = async (req, res) => {
  try {
    const { userId } = req.query;
    let query = { status: { $in: ['Booking Confirmed', 'Pending', 'Relay Handoff Pending', 'Transhipment Pending'] } };
    
    if (userId) {
      const user = await User.findById(userId);
      if (!user?.riderDetails?.isOnline || !user?.riderDetails?.isOnShift) {
        return res.status(200).json({ success: true, data: [] });
      }
      
      // Filter by the rider's specific vehicle type
      if (user.riderDetails?.vehicleType) {
        query['metadata.vehicleType'] = user.riderDetails.vehicleType;
      }
    }
    
    const availableJobs = await Booking.find(query)
      .populate('metadata.sourceHub')
      .populate('metadata.destinationHub')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: availableJobs });
  } catch (error) {
    console.error('Error fetching available jobs:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch jobs' });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { userId, lat, lng, address } = req.body;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });
    
    let resolvedAddress = address;
    if (!resolvedAddress && lat && lng) {
      const loc = await locationService.reverseGeocode(lat, lng);
      if (loc) resolvedAddress = loc.formattedAddress;
    }

    await User.findByIdAndUpdate(userId, {
      'riderDetails.currentLocation': { lat, lng, address: resolvedAddress, updatedAt: new Date() },
      'riderDetails.lastLocationUpdate': new Date()
    });

    res.status(200).json({ success: true, message: 'Location updated', address: resolvedAddress });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update location' });
  }
};

exports.acceptJob = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findOneAndUpdate(
      { _id: id, status: 'Booking Confirmed' },
      { 
        status: 'Rider Assigned',
        $push: {
          trackingHistory: {
            status: 'Rider Assigned',
            description: 'A Rider has accepted the job and is en route.'
          }
        }
      },
      { new: true }
    ).populate('metadata.sourceHub').populate('metadata.destinationHub');

    if (!booking) {
      return res.status(400).json({ success: false, error: 'Job already taken or invalid.' });
    }

    // Trigger Notification
    NotificationService.notifyRiderAssigned(booking, booking.sender?.phone || '9999999999');

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error accepting job:', error);
    res.status(500).json({ success: false, error: 'Failed to accept job' });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, otp, photoUrl, reason, cashCollected, gpsLocation, parcelCondition, userId } = req.body;

    const booking = await Booking.findById(id).populate('sender').populate('metadata.sourceHub').populate('metadata.destinationHub');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }

    // Notify when Rider Arrives at Pickup
    if (status === 'Arrived at Pickup') {
      const expectedOtp = booking.pickupOtp || booking.sender?.pickupOtp || booking.proofOfDelivery?.otp || '1234';
      const customerPhone = booking.sender?.phone || booking.senderDetails?.phone || '9999999999';
      const customerEmail = booking.sender?.email || booking.senderDetails?.email;
      NotificationService.notifyPickupOTP(customerPhone, customerEmail, expectedOtp, booking.trackingId);
    }

    // Generate and notify OTP when Rider is Out for Delivery
    if (status === 'Out for Delivery') {
      const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
      if (!booking.proofOfDelivery) booking.proofOfDelivery = {};
      booking.proofOfDelivery.otp = generatedOtp;
      
      const receiverPhone = booking.receiver?.phone || '8888888888';
      const receiverEmail = booking.receiver?.email; // Now populated from the form
      NotificationService.notifyOutForDelivery(booking, receiverPhone, receiverEmail, generatedOtp);
    }

    // Strict Validations per step
    if (status === 'Picked Up') {
      const expectedOtp = booking.pickupOtp || booking.sender?.pickupOtp || booking.proofOfDelivery?.otp || '1234';
      if (!otp || String(otp).trim() !== String(expectedOtp).trim()) { 
        return res.status(400).json({ success: false, error: `Invalid OTP. Please check and try again.` });
      }
      if (!photoUrl) {
        return res.status(400).json({ success: false, error: 'Pickup Photo upload is mandatory.' });
      }
      booking.photos.senderUrl = photoUrl;
    }

    if (status === 'Delivered') {
      const expectedOtp = booking.proofOfDelivery?.otp || '1234';
      if (!otp || String(otp) !== String(expectedOtp)) {
        return res.status(400).json({ success: false, error: `Invalid OTP. Please check and try again.` });
      }
      if (!photoUrl) {
        return res.status(400).json({ success: false, error: 'Delivery Photo upload is mandatory.' });
      }
      booking.proofOfDelivery = {
        signatureUrl: photoUrl,
        timestamp: new Date(),
        gpsLocation: gpsLocation
      };
    }

    booking.status = status;
    
    let description = reason || `Package marked as ${status}`;
    if (cashCollected) {
        description += ` | Cash Collected: ₹${cashCollected}`;
        
        // Add to Rider's pending deposit
        await User.findByIdAndUpdate(userId, {
            $inc: {
                'riderDetails.earnings.pendingDeposit': Number(cashCollected),
                'riderDetails.earnings.cashCollected': Number(cashCollected)
            }
        });
    }

    booking.trackingHistory.push({
      status,
      description,
      location: gpsLocation ? `${gpsLocation.lat}, ${gpsLocation.lng}` : undefined,
      parcelCondition: parcelCondition || 'Good'
    });

    if (status === 'Failed' || status === 'Cancelled') {
      const isPickup = booking.status === 'Rider On the Way' || booking.status === 'Rider Assigned';
      const type = isPickup ? 'Pickup Exception' : 'Delivery NDR';
      
      const ndr = new ExceptionNDR({
        booking: booking._id,
        type: type,
        reason: reason || 'Task Failed',
        status: 'Open',
        evidence: {
          photoUrl: photoUrl,
          gps: gpsLocation,
          notes: `Raised by Rider via App`
        },
        raisedBy: userId
      });
      await ndr.save();
    }

    if (status === 'Delivered' || status === 'Source Hub Received') {
      booking.proofOfDelivery = {
        signatureUrl: photoUrl,
        timestamp: new Date(),
        gpsLocation: gpsLocation
      };
      
      // Calculate and credit earnings
      const estimatedPayout = Math.floor((booking.pricing?.total || 800) * 0.15);
      
      await User.findByIdAndUpdate(userId, {
        $inc: {
          'riderDetails.earnings.totalEarnings': estimatedPayout,
          'riderDetails.earnings.walletBalance': estimatedPayout
        }
      });
    }

    await booking.save();

    // Trigger Notifications based on status
    const customerPhone = booking.sender?.phone || '9999999999';
    const receiverPhone = booking.receiver?.phone || '8888888888';

    if (status === 'Picked Up') NotificationService.notifyPickedUp(booking, customerPhone, receiverPhone);
    if (status === 'In Transit') NotificationService.notifyInTransit(booking, receiverPhone);
    if (status === 'Delivered') NotificationService.notifyDelivered(booking, customerPhone, receiverPhone);
    if (status === 'Failed' || status === 'Cancelled') NotificationService.notifyException(booking, '7777777777');

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({ success: false, error: 'Failed to update job status', details: error.message, stack: error.stack });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, type } = req.body;
    
    const booking = await Booking.findById(id).populate('sender', 'pickupOtp');
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    const isPickupStage = type === 'pickup' || ['Booking Confirmed', 'Rider Assigned', 'Rider On the Way', 'Arrived at Pickup'].includes(booking.status);
    const expectedOtp = isPickupStage
      ? (booking.pickupOtp || booking.sender?.pickupOtp || booking.proofOfDelivery?.otp || '1234')
      : (booking.proofOfDelivery?.otp || '1234');
    if (!otp || String(otp).trim() !== String(expectedOtp).trim()) { 
      return res.status(400).json({ success: false, error: `Invalid OTP. Please check and try again.` });
    }
    
    res.status(200).json({ success: true, message: 'OTP Verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

exports.handleTranshipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentRiderId } = req.body; 

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Job not found' });

    // Generate Handover OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    if (!booking.proofOfDelivery) booking.proofOfDelivery = {};
    booking.proofOfDelivery.otp = generatedOtp;

    booking.status = 'Relay Handoff Pending';
    
    booking.trackingHistory.push({
      status: 'Relay Handoff Pending',
      description: 'Current Rider has initiated a handover. Waiting for another Rider to accept.'
    });

    await booking.save();
    // Return OTP to the initiating rider so they can display it
    res.status(200).json({ success: true, data: booking, handoverOtp: generatedOtp });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to initiate transhipment' });
  }
};

exports.acceptHandover = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, newRiderId } = req.body;
    
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Job not found' });
    
    if (booking.status !== 'Relay Handoff Pending' && booking.status !== 'Transhipment Pending') {
      return res.status(400).json({ success: false, error: 'Job is not pending a handover' });
    }
    
    const expectedOtp = booking.proofOfDelivery?.otp || '1234';
    if (!otp || otp !== expectedOtp) {
      return res.status(400).json({ success: false, error: `Invalid Handover OTP (use ${expectedOtp} for testing).` });
    }
    
    // Mark previous as handed over, add new rider
    if (booking.assignedRiders && booking.assignedRiders.length > 0) {
      booking.assignedRiders[booking.assignedRiders.length - 1].status = 'Handed Over';
      
      booking.transhipmentLogs.push({
        fromRider: booking.assignedRiders[booking.assignedRiders.length - 1].riderId,
        toRider: newRiderId,
        timestamp: new Date(),
        status: 'Transhipment Complete'
      });
    }
    
    booking.assignedRiders.push({
      riderId: newRiderId,
      status: 'Active'
    });
    
    booking.currentRider = newRiderId;
    
    booking.status = 'In Transit'; 
    
    booking.trackingHistory.push({
      status: 'In Transit',
      description: 'Package handed over successfully to a new Rider.'
    });
    
    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to accept handover' });
  }
};

exports.toggleShift = async (req, res) => {
  try {
    const { isOnline, isOnShift, isOnBreak, hubCheckIn } = req.body;
    // Mock user for now since no auth
    // Update logic would go here: await User.findByIdAndUpdate(req.user._id, { 'riderDetails.isOnline': isOnline, 'riderDetails.isOnShift': isOnShift, 'riderDetails.isOnBreak': isOnBreak });
    
    let message = 'Status updated';
    if (hubCheckIn) message = 'Checked in at Hub successfully';
    
    res.status(200).json({ success: true, message });
  } catch (error) {
    console.error('Error toggling shift:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
};

// --- Onboarding & Profile ---
exports.onboardRider = async (req, res) => {
  try {
    const { userId, vehicleType, vehicleRegistration, roleFlexibility, address, bankDetails, emergencyContact, documents } = req.body;
    
    // In a real app, use req.user._id
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.riderDetails = {
      ...user.riderDetails,
      vehicleType,
      vehicleRegistration,
      roleFlexibility,
      address,
      bankDetails,
      emergencyContact,
      documents,
      approvalStatus: 'Pending',
      isOnline: false,
      isOnShift: false
    };

    await user.save();
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error in onboarding:', error);
    res.status(500).json({ success: false, error: 'Failed to process onboarding' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId)
      .select('-password')
      .populate('riderDetails.assignedCaptain', 'name phone photoUrl');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

exports.updateShift = async (req, res) => {
  try {
    const { userId, isOnline, isOnShift, isOnBreak, hubCheckIn } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if (isOnline !== undefined) user.riderDetails.isOnline = isOnline;
    if (isOnShift !== undefined) user.riderDetails.isOnShift = isOnShift;
    if (isOnBreak !== undefined) user.riderDetails.isOnBreak = isOnBreak;

    await user.save();
    
    let message = 'Shift updated';
    if (hubCheckIn) message = 'Checked in at Hub successfully';
    
    res.status(200).json({ success: true, data: user, message });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update shift' });
  }
};

exports.withdrawEarnings = async (req, res) => {
  try {
    const { userId, amount, vpa, accountNumber, ifscCode, accountHolderName } = req.body;
    const withdrawAmount = Number(amount);

    if (!Number.isFinite(withdrawAmount) || withdrawAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid withdrawal amount is required.' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    if ((user.riderDetails?.earnings?.walletBalance || 0) < withdrawAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    const bankDetails = user.riderDetails?.bankDetails || {};
    const targetAccountNumber = accountNumber || bankDetails.accountNumber;
    const targetIfsc = ifscCode || bankDetails.ifscCode;

    let payoutResult = {
      status: 'Queued',
      contactId: null,
      fundAccountId: null,
      payoutId: null
    };

    try {
      payoutResult = await razorpayService.createRazorpayXPayout({
        name: accountHolderName || user.name || 'ZyperGo Captain',
        phone: user.phone,
        email: user.email,
        accountNumber: targetAccountNumber,
        ifscCode: targetIfsc,
        vpa,
        amountInRupees: withdrawAmount,
        referenceId: `wd_${user._id}_${Date.now()}`,
        narration: 'ZyperGo Captain Payout'
      });
    } catch (payoutErr) {
      console.error('Razorpay X withdrawal error:', payoutErr.message);
      return res.status(payoutErr.statusCode || 502).json({
        success: false,
        error: payoutErr.message || 'Razorpay X payout failed'
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, 'riderDetails.earnings.walletBalance': { $gte: withdrawAmount } },
      {
        $inc: {
          'riderDetails.earnings.walletBalance': -withdrawAmount
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }

    await Settlement.create({
      entityType: 'Rider',
      entityId: user._id,
      entityTypeModel: 'User',
      type: 'Payout',
      amount: withdrawAmount,
      status: payoutResult.payoutId ? 'Settled' : 'Pending',
      notes: [
        payoutResult.payoutId ? `RazorpayX Payout: ${payoutResult.payoutId}` : 'RazorpayX Payout Queued',
        payoutResult.contactId ? `Contact: ${payoutResult.contactId}` : null,
        payoutResult.fundAccountId ? `FundAcct: ${payoutResult.fundAccountId}` : null
      ].filter(Boolean).join(' | '),
      processedBy: req.user?.id || user._id
    });

    res.status(200).json({
      success: true,
      data: {
        payoutId: payoutResult.payoutId,
        contactId: payoutResult.contactId,
        fundAccountId: payoutResult.fundAccountId,
        status: payoutResult.status,
        newBalance: updatedUser.riderDetails?.earnings?.walletBalance ?? 0
      },
      message: `Successfully initiated ₹${withdrawAmount} withdrawal via Razorpay X${payoutResult.payoutId ? ` (Ref: ${payoutResult.payoutId})` : ''}.`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to process withdrawal' });
  }
};

exports.getHistory = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ success: false, error: 'User ID is required' });

    const ongoingStatuses = ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery', 'Relay Handoff Pending', 'Transhipment Pending'];
    const completedStatuses = ['Delivered', 'Source Hub Received', 'Destination Hub Received', 'Cancelled', 'Failed'];

    const allRiderBookings = await Booking.find({
      $or: [
        { currentRider: userId },
        { 'assignedRiders.riderId': userId }
      ]
    })
    .populate('metadata.sourceHub')
    .populate('metadata.destinationHub')
    .sort({ updatedAt: -1 });

    const ongoing = allRiderBookings.filter(b => ongoingStatuses.includes(b.status));
    const completed = allRiderBookings.filter(b => completedStatuses.includes(b.status));

    res.status(200).json({ 
      success: true, 
      data: allRiderBookings,
      ongoing,
      completed
    });
  } catch (error) {
    console.error('Error fetching rider history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
};

exports.getMyHelpers = async (req, res) => {
  try {
    const { captainId } = req.query;
    if (!captainId) {
      return res.status(400).json({ success: false, error: 'Captain ID is required.' });
    }
    const helpers = await User.find({
      role: 'Rider',
      'riderDetails.partnerMode': 'Helper',
      'riderDetails.assignedCaptain': captainId
    })
      .select('-password -otp -otpExpiry')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: helpers });
  } catch (error) {
    console.error('Error fetching helpers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch helpers.' });
  }
};

exports.addHelper = async (req, res) => {
  try {
    const { captainId, name, phone, email, helperWorkType, profilePhoto } = req.body;
    if (!captainId || !name || !phone) {
      return res.status(400).json({ success: false, error: 'Captain ID, Helper Name, and Phone Number are required.' });
    }

    const captain = await User.findById(captainId);
    if (!captain) {
      return res.status(404).json({ success: false, error: 'Captain account not found.' });
    }

    const helperUser = await upsertHelperAccount({
      name,
      phone,
      email,
      helperWorkType,
      profilePhoto,
      captain
    });

    res.status(201).json({
      success: true,
      data: helperUser,
      message: `Helper ${helperUser.name} (${helperUser.riderDetails?.helperWorkType || 'Load & Unload'}) registered under you successfully!`
    });
  } catch (error) {
    console.error('Error adding helper:', error);
    const status = error.message?.includes('Valid 10-digit') || error.message?.includes('already registered') ? 400 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to register helper.' });
  }
};

// ─── Utility: Haversine distance (km) ───────────────────────────────────────
function haversineKm(lat1, lng1, lat2, lng2) {
  if (!lat1 || !lng1 || !lat2 || !lng2) return 9999;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Real-Time Nearby Captains for Customer Map ─────────────────────────────
exports.getNearbyCaptains = async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radius = parseFloat(req.query.radius) || 15; // default 15 km
    const { vehicleType } = req.query;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lng query params are required' });
    }

    const query = {
      role: 'Rider',
      isActive: true,
      'riderDetails.partnerMode': { $ne: 'Helper' },
      'riderDetails.isOnline': true,
      'riderDetails.isOnBreak': { $ne: true },
      'riderDetails.currentLocation.lat': { $exists: true, $ne: null },
      'riderDetails.currentLocation.lng': { $exists: true, $ne: null }
    };

    if (vehicleType) {
      query['riderDetails.vehicleType'] = vehicleType;
    }

    const riders = await User.find(query)
      .select('name phone avatar riderDetails.vehicleType riderDetails.vehicleRegistration riderDetails.currentLocation riderDetails.lastLocationUpdate')
      .lean();

    const nearby = [];
    for (const r of riders) {
      const cLat = r.riderDetails?.currentLocation?.lat;
      const cLng = r.riderDetails?.currentLocation?.lng;
      if (typeof cLat === 'number' && typeof cLng === 'number' && !isNaN(cLat) && !isNaN(cLng)) {
        const dist = haversineKm(lat, lng, cLat, cLng);
        if (dist <= radius) {
          const etaMins = Math.max(1, Math.round(dist * 2.5)); // ~25 km/h avg city speed
          nearby.push({
            id: r._id.toString(),
            name: r.name || 'Captain',
            lat: cLat,
            lng: cLng,
            distanceKm: Number(dist.toFixed(2)),
            etaMins,
            etaText: `${etaMins} min${etaMins > 1 ? 's' : ''}`,
            vehicleType: r.riderDetails?.vehicleType || 'Scooter',
            vehicleRegistration: r.riderDetails?.vehicleRegistration || '',
            lastUpdate: r.riderDetails?.currentLocation?.updatedAt || r.riderDetails?.lastLocationUpdate || null
          });
        }
      }
    }

    // Sort nearest first
    nearby.sort((a, b) => a.distanceKm - b.distanceKm);

    return res.status(200).json({
      success: true,
      count: nearby.length,
      data: nearby
    });
  } catch (error) {
    console.error('Error fetching nearby captains:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch nearby captains.' });
  }
};

