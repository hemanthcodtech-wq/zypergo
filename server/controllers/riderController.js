const Booking = require('../models/Booking');
const User = require('../models/User');
const ExceptionNDR = require('../models/ExceptionNDR');
const NotificationService = require('../services/notificationService');
const locationService = require('../services/locationService');

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
      const expectedOtp = booking.proofOfDelivery?.otp || '1234';
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
      const expectedOtp = booking.proofOfDelivery?.otp || '1234';
      if (!otp || String(otp) !== String(expectedOtp)) { 
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
    
    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, error: 'Job not found' });
    }
    
    const expectedOtp = booking.proofOfDelivery?.otp || '1234';
    if (!otp || String(otp) !== String(expectedOtp)) { 
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
    // Mock user fetching
    const { userId } = req.query; 
    const user = await User.findById(userId).select('-password');
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
    const { userId, amount } = req.body;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    
    if ((user.riderDetails?.earnings?.walletBalance || 0) < amount) {
      return res.status(400).json({ success: false, error: 'Insufficient balance' });
    }
    
    await User.findByIdAndUpdate(userId, {
      $inc: {
        'riderDetails.earnings.walletBalance': -amount
      }
    });
    
    res.status(200).json({ success: true, message: `Successfully withdrew ₹${amount} to bank account.` });
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
