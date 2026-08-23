const mongoose = require('mongoose');
const Hub = require('../models/Hub');
const Booking = require('../models/Booking');
const Manifest = require('../models/Manifest');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');

// --- HUB SETUP ---
exports.getAllHubs = async (req, res) => {
  try {
    let filter = {};
    if (['HubManager', 'HubOperator'].includes(req.user.role)) {
       const user = await User.findById(req.user.id);
       if (user && user.assignedHubForStaff) {
          filter._id = user.assignedHubForStaff;
       } else {
          return res.status(200).json({ success: true, data: [] });
       }
    }
    const hubs = await Hub.find(filter).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: hubs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch hubs' });
  }
};

exports.getDestinationHubs = async (req, res) => {
  try {
    // Return a simplified list of all active hubs for destination selection
    const hubs = await Hub.find({ isActive: true }).select('_id name address.city').sort({ name: 1 });
    res.status(200).json({ success: true, data: hubs });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch destination hubs' });
  }
};

exports.createHub = async (req, res) => {
  try {
    const { contactDetails, ...hubData } = req.body;
    
    let createdManager = null;
    // Automatic Hub Manager Provisioning
    if (contactDetails && contactDetails.email && contactDetails.phone) {
      const existingUser = await User.findOne({ 
        $or: [{ email: contactDetails.email }, { phone: contactDetails.phone }] 
      });

      if (existingUser) {
        return res.status(400).json({ success: false, error: 'User with this email or phone already exists.' });
      }

      // Generate a simple random password
      const generatedPassword = `Hub-${Math.floor(1000 + Math.random() * 9000)}`;

      createdManager = new User({
        name: contactDetails.managerName || 'Hub Manager',
        email: contactDetails.email,
        phone: contactDetails.phone,
        password: generatedPassword,
        role: 'HubManager',
        isActive: true
      });

      await createdManager.save();

      const { getFrontendUrl } = require('../utils/urlHelper');
      const hubUrl = getFrontendUrl('hub');

      // Fire-and-forget email
      const htmlBody = NotificationService.generateEmailTemplate({
        title: `Welcome, ${createdManager.name}!`,
        message: `Your Hub Manager account has been created. You can now log in to the ZyperGo Hub Portal to manage your hub operations.<br><br><b>Login Portal:</b> <a href="${hubUrl}">${hubUrl}</a><br><b>Phone Number:</b> ${createdManager.phone}<br><b>Password:</b> ${generatedPassword}`,
        buttonText: 'Login to Hub Portal',
        buttonUrl: hubUrl,
        footerNote: 'Please change your password after first login. If you did not request this access, contact your administrator.'
      });

      NotificationService.sendEmail(
        contactDetails.email,
        'Welcome to ZyperGo \u2014 Your Hub Manager Access',
        htmlBody
      ).then(() => {
        console.log(`[Hub Provisioning] Email sent to ${contactDetails.email}`);
      }).catch(err => {
        console.error(`[Hub Provisioning] Email failed for ${contactDetails.email}:`, err.message);
      });

    }

    const hub = new Hub({
      ...hubData,
      contactDetails
    });
    
    await hub.save();

    if (createdManager) {
      createdManager.assignedHubForStaff = hub._id;
      await createdManager.save();
    }

    res.status(201).json({ success: true, data: hub });
  } catch (error) {
    console.error('Error creating hub:', error);
    res.status(500).json({ success: false, error: 'Failed to create hub' });
  }
};

exports.updateHub = async (req, res) => {
  try {
    const hub = await Hub.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!hub) return res.status(404).json({ success: false, error: 'Hub not found' });
    res.status(200).json({ success: true, data: hub });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update hub' });
  }
};

exports.deleteHub = async (req, res) => {
  try {
    const hub = await Hub.findById(req.params.id);
    if (!hub) return res.status(404).json({ success: false, error: 'Hub not found' });

    // Cascade delete the linked HubManager user by email or phone
    if (hub.contactDetails?.email || hub.contactDetails?.phone) {
      const query = {};
      if (hub.contactDetails.email) query.$or = [{ email: hub.contactDetails.email }];
      if (hub.contactDetails.phone) {
        if (query.$or) query.$or.push({ phone: hub.contactDetails.phone });
        else query.$or = [{ phone: hub.contactDetails.phone }];
      }
      const deletedUser = await User.findOneAndDelete({ ...query, role: 'HubManager' });
      if (deletedUser) {
        console.log(`[Hub Delete] Manager user ${deletedUser.email} removed from DB.`);
      }
    }

    await Hub.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Hub and associated manager account deleted successfully.' });
  } catch (error) {
    console.error('[Hub Delete] Error:', error.message);
    res.status(500).json({ success: false, error: 'Failed to delete hub' });
  }
};

exports.assignRidersToHub = async (req, res) => {
  try {
    const { riderIds } = req.body;
    const hub = await Hub.findByIdAndUpdate(
      req.params.id, 
      { $addToSet: { assignedRiders: { $each: riderIds } } },
      { new: true }
    );
    res.status(200).json({ success: true, data: hub });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to assign riders' });
  }
};

// --- HUB INVENTORY & ALERTS ---
exports.getHubInventory = async (req, res) => {
  try {
    const hubId = req.params.id;
    const hub = await Hub.findById(hubId);
    if (!hub) return res.status(404).json({ success: false, error: 'Hub not found' });

    const parcels = await Booking.aggregate([
      { 
        $match: { 
          $or: [
            { 'metadata.sourceHub': new mongoose.Types.ObjectId(hubId) },
            { 'metadata.destinationHub': new mongoose.Types.ObjectId(hubId) }
          ],
          status: { $in: ['Source Hub Received', 'Sorted', 'Partner Handover', 'Destination Hub Received', 'Returned'] }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ 
      success: true, 
      data: {
        capacity: hub.capacity,
        inventoryStatus: parcels
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
};

// --- HUB OPERATIONS ---

// 1. Receive parcel from rider through scan and digital acknowledgement.
exports.receiveParcel = async (req, res) => {
  try {
    const { bookingId, hubId, acknowledgementType } = req.body;
    
    const hub = await Hub.findById(hubId);
    if (!hub) return res.status(404).json({ success: false, error: 'Hub not found' });

    // Capacity Check
    if (hub.capacity.currentParcels >= hub.capacity.maxCapacity) {
      return res.status(400).json({ success: false, error: 'Hub capacity exceeded. Cannot receive parcel.' });
    }

    let warning = null;
    const loadPercentage = ((hub.capacity.currentParcels + 1) / hub.capacity.maxCapacity) * 100;
    if (loadPercentage >= hub.capacity.capacityThresholdAlert) {
      warning = `WARNING: Hub capacity is at ${loadPercentage.toFixed(1)}%, exceeding threshold of ${hub.capacity.capacityThresholdAlert}%`;
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ success: false, error: 'Booking not found' });

    let newStatus = 'Source Hub Received';
    if (booking.status === 'In Transit' || booking.status === 'Partner Handover') {
       newStatus = 'Destination Hub Received';
    }

    booking.status = newStatus;
    booking.trackingHistory.push({
      status: newStatus,
      description: `Received at hub. Ack: ${acknowledgementType || 'Digital'}`,
      location: hub.name
    });
    
    if(booking.assignedRiders && booking.assignedRiders.length > 0) {
       booking.assignedRiders[booking.assignedRiders.length - 1].status = 'Handed Over';
    }

    await booking.save();
    
    hub.capacity.currentParcels += 1;
    await hub.save();

    const HubRecord = require('../models/HubRecord');
    
    // Determine the rider who dropped it off
    let dropOffRider = null;
    if (booking.assignedRiders && booking.assignedRiders.length > 0) {
      dropOffRider = booking.assignedRiders[booking.assignedRiders.length - 1].riderId;
    }

    await HubRecord.create({
      hubId: hub._id,
      bookingId: booking._id,
      recordType: 'Inbound From Rider',
      trackingId: booking.trackingId,
      customerDetails: {
        name: booking.receiver?.name,
        phone: booking.receiver?.phone
      },
      destination: {
        address: booking.dropLocation?.address,
        pincode: booking.dropLocation?.pincode
      },
      actionBy: dropOffRider || (req.user ? req.user.id : null),
      notes: `Received at hub. Ack: ${acknowledgementType || 'Digital'}`
    });

    res.status(200).json({ success: true, data: booking, warning });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to receive parcel' });
  }
};

// 2. Sort parcels
exports.sortParcel = async (req, res) => {
  try {
    const { bookingId, hubId, route, partnerId, sortType } = req.body;
    
    const booking = await Booking.findByIdAndUpdate(bookingId, {
      status: 'Sorted',
      $push: {
        trackingHistory: {
          status: 'Sorted',
          description: `Sorted via ${sortType || 'Manual'} (Route: ${route || 'N/A'}, Partner: ${partnerId || 'N/A'})`
        }
      }
    }, { new: true });

    if (hubId) {
      const HubRecord = require('../models/HubRecord');
      await HubRecord.create({
        hubId: hubId,
        bookingId: booking._id,
        recordType: 'Other',
        trackingId: booking.trackingId,
        customerDetails: {
          name: booking.receiver?.name,
          phone: booking.receiver?.phone
        },
        destination: {
          address: booking.dropLocation?.address,
          pincode: booking.dropLocation?.pincode
        },
        route: route,
        notes: `Sorted via ${sortType || 'Manual'} (Route: ${route || 'N/A'})`,
        actionBy: req.user ? req.user.id : null
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to sort parcel' });
  }
};

// 3. Create manifest (bag, bundle, consignment, partner manifest)
exports.createManifest = async (req, res) => {
  try {
    const { type, sourceHub, destinationHub, assignedPartner, parcels } = req.body;
    
    const manifestId = `MF-${Date.now()}`;
    const manifest = new Manifest({
      manifestId,
      type,
      sourceHub,
      destinationHub,
      assignedPartner,
      parcels,
      createdBy: req.user ? req.user.id : null
    });
    
    await manifest.save();
    
    await Booking.updateMany(
      { _id: { $in: parcels } },
      { 
        status: assignedPartner ? 'Partner Handover' : 'In Transit',
        $push: { trackingHistory: { status: assignedPartner ? 'Partner Handover' : 'In Transit', description: `Added to ${type} ${manifestId}` } }
      }
    );

    res.status(201).json({ success: true, data: manifest });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create manifest' });
  }
};

// 4. Create last-mile route
exports.createLastMileRoute = async (req, res) => {
  try {
    const { bookingIds, riderId, hubId } = req.body;
    
    await Booking.updateMany(
      { _id: { $in: bookingIds } },
      { 
        status: 'Out for Delivery',
        $push: {
          assignedRiders: { riderId, status: 'Active' },
          trackingHistory: { status: 'Out for Delivery', description: `Assigned for last mile delivery.` }
        }
      }
    );

    const hub = await Hub.findById(hubId);
    if(hub) {
      hub.capacity.currentParcels = Math.max(0, hub.capacity.currentParcels - bookingIds.length);
      await hub.save();
    }

    res.status(200).json({ success: true, message: 'Last-mile route created successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create last-mile route' });
  }
};

// --- HUB RECORDS ---
exports.getHubRecords = async (req, res) => {
  try {
    const hubId = req.params.id;
    const { recordType, startDate, endDate, page = 1, limit = 50 } = req.query;

    const filter = { hubId: new mongoose.Types.ObjectId(hubId) };
    if (recordType) {
      filter.recordType = recordType;
    }
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const HubRecord = require('../models/HubRecord');
    
    const records = await HubRecord.find(filter)
      .populate('actionBy', 'name role')
      .populate('associatedHub', 'name')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await HubRecord.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: records,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching hub records:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch hub records' });
  }
};
