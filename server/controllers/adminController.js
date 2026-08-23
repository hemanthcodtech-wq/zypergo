const Booking = require('../models/Booking');
const Partner = require('../models/Partner');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// --- Dashboard KPIs ---
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalBookings = await Booking.countDocuments();
    const todaysBookings = await Booking.countDocuments({ createdAt: { $gte: today } });
    
    const inTransit = await Booking.countDocuments({ status: { $in: ['In Transit', 'Out for Delivery', 'Rider On the Way'] } });
    const pendingPickups = await Booking.countDocuments({ status: { $in: ['Pending', 'Booking Confirmed', 'Rider Assigned'] } });
    const delivered = await Booking.countDocuments({ status: 'Delivered' });
    const failed = await Booking.countDocuments({ status: 'Failed' });
    const returns = await Booking.countDocuments({ status: 'Returned' });
    const exceptions = await Booking.countDocuments({ status: { $in: ['Delayed', 'Failed', 'Returned', 'Cancelled'] } });

    // Financial Aggregation
    const financialStats = await Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$pricing.total' },
          cashCollection: {
            $sum: {
              $cond: [
                { $eq: ['$payment.mode', 'Cash'] },
                '$pricing.total',
                0
              ]
            }
          }
        }
      }
    ]);

    const revenue = financialStats.length > 0 ? financialStats[0].totalRevenue : 0;
    const cashCollection = financialStats.length > 0 ? financialStats[0].cashCollection : 0;

    // Hub-wise Aggregation (using sourceHub)
    const hubWiseParcels = await Booking.aggregate([
      { $match: { "metadata.sourceHub": { $exists: true, $ne: null } } },
      { $group: { _id: "$metadata.sourceHub", count: { $sum: 1 } } },
      { $lookup: { from: 'hubs', localField: '_id', foreignField: '_id', as: 'hubInfo' } },
      { $unwind: { path: '$hubInfo', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 1, count: 1, hubName: { $ifNull: ["$hubInfo.name", "Unknown Hub"] } } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalBookings,
        todaysBookings,
        inTransit,
        pendingPickups,
        delivered,
        failed,
        returns,
        exceptions,
        revenue,
        cashCollection,
        hubWiseParcels,
        // Mock Alerts for now
        alerts: {
          delayedRoutes: 2,
          highRisk: 1,
          unscanned: 3,
          partnerExceptions: 0,
          complaints: 1
        }
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
};

// --- Booking Management ---
exports.getAllBookings = async (req, res) => {
  try {
    const { status, search, deliveryType, startDate, endDate } = req.query;
    let filter = {};
    if (status && status !== 'All') filter.status = status;
    if (deliveryType) filter['metadata.deliveryType'] = deliveryType;
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { trackingId: regex },
        { 'receiver.name': regex },
        { 'receiver.phone': regex },
        { 'pickupLocation.pincode': regex },
        { 'dropLocation.pincode': regex }
      ];
    }
    const bookings = await Booking.find(filter)
      .populate('metadata.sourceHub', 'name')
      .populate('metadata.assignedPartner', 'companyName')
      .populate('sender', 'name phone')
      .populate('assignedRiders.riderId', 'name phone')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch bookings' });
  }
};

exports.updateBookingAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body; // e.g., { status, assignedPartner }

    const booking = await Booking.findByIdAndUpdate(id, updates, { new: true });
    
    if (updates.status) {
       booking.trackingHistory.push({
         status: updates.status,
         description: 'Updated by Admin manually.'
       });
       await booking.save();
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update booking' });
  }
};

exports.assignRider = async (req, res) => {
  try {
    const { id } = req.params;
    const { riderId } = req.body;
    const booking = await Booking.findOneAndUpdate(
      { 
        _id: id, 
        status: { $in: ['Pending', 'Booking Confirmed'] } 
      },
      {
        status: 'Rider Assigned',
        currentRider: riderId,
        $push: {
          assignedRiders: { riderId, status: 'Active' },
          trackingHistory: {
            status: 'Rider Assigned',
            description: 'A Rider has been assigned.',
            scannedBy: req.user?._id
          }
        }
      },
      { new: true }
    );

    if (!booking) return res.status(400).json({ success: false, error: 'Booking not available or already assigned' });

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign rider' });
  }
};

exports.logTransit = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrierName, vehicleNumber, dispatchTime, arrivalTime } = req.body;
    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    booking.intercityTransitLog.push({
      carrierName, vehicleNumber, dispatchTime, arrivalTime, loggedBy: req.user?._id
    });
    
    if (dispatchTime) {
      booking.status = 'In Transit';
      booking.trackingHistory.push({
        status: 'In Transit',
        description: `Dispatched via ${carrierName} (${vehicleNumber})`
      });
    }

    await booking.save();
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to log transit details' });
  }
};

exports.getAvailableRiders = async (req, res) => {
  try {
    const riders = await User.find({ role: 'Rider', 'riderDetails.isOnline': true }).select('name phone riderDetails');
    res.status(200).json({ success: true, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch riders' });
  }
};

// --- Partner Management ---
exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find();
    res.status(200).json({ success: true, data: partners });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch partners' });
  }
};

exports.createPartner = async (req, res) => {
  try {
    const partner = new Partner(req.body);
    await partner.save();
    res.status(201).json({ success: true, data: partner });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create partner' });
  }
};

exports.sendBroadcast = async (req, res) => {
  try {
    const { title, body, target } = req.body;
    // Mock FCM push notification blast
    console.log(`[FCM Broadcast]: ${title} - ${body} (Target: ${target})`);
    res.status(200).json({ success: true, message: 'Broadcast sent via FCM' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to send broadcast' });
  }
};

// --- Admin Management ---
exports.createUser = async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User with this phone already exists' });
    }

    const user = new User({
      name,
      email,
      phone,
      password, // Password will be hashed in the pre-save hook
      role
    });

    await user.save();
    
    // Don't return password
    user.password = undefined;

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
};

exports.approveRider = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user || user.role !== 'Rider') {
      return res.status(404).json({ success: false, error: 'Rider not found' });
    }

    user.riderDetails.approvalStatus = 'Approved';
    
    // Generate secure random 8 character password
    const generatedPassword = Math.random().toString(36).slice(-8);
    user.password = generatedPassword; // Pre-save hook will hash it

    await user.save();

    if (user.email) {
       const { getFrontendUrl } = require('../utils/urlHelper');
       const riderUrl = getFrontendUrl('rider');

       const htmlBody = NotificationService.generateEmailTemplate({
         title: 'You are Approved! 🎉',
         message: `Hello ${user.name},<br><br>Your rider application has been <b>approved</b> by the admin team! You can now log in to the Rider App using your email address and the generated password below.`,
         otpCode: generatedPassword,
         buttonText: 'Login to Rider App',
         buttonUrl: riderUrl,
         footerNote: 'Please change this password immediately after your first login.'
       });

       await NotificationService.sendEmail(
         user.email,
         'You are approved! Welcome to ZyperGo Riders',
         htmlBody
       );
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error approving rider:', error);
    res.status(500).json({ success: false, error: 'Failed to approve rider' });
  }
};

exports.getRiders = async (req, res) => {
  try {
    const riders = await User.find({ role: 'Rider' }).select('-password');
    res.status(200).json({ success: true, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch riders' });
  }
};
