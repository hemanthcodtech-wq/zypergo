const { Server } = require('socket.io');

let io;

exports.init = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Set to actual frontend domain in production
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Rider joins their own location room (or global riders room)
    socket.on('join_rider', (data) => {
      const { riderId, lat, lng } = data;
      // In a real app, verify riderId
      socket.join(`rider_${riderId}`);
      // Join a general room to receive broadcasted local bookings
      socket.join('available_riders');
      console.log(`[Socket] Rider ${riderId} joined active rooms.`);
    });

    // Client/Customer joins a room to track a specific booking
    socket.on('join_tracking', (data) => {
      const { trackingId } = data;
      socket.join(`track_${trackingId}`);
      console.log(`[Socket] User tracking booking: ${trackingId}`);
    });

    // Rider emits live location update (Rapido/Swiggy style real-time stream)
    socket.on('location_update', async (data) => {
      try {
        const { riderId, trackingId, lat, lng, heading } = data;
        if (!lat || !lng) return;

        const payload = {
          riderId,
          lat: Number(lat),
          lng: Number(lng),
          heading: heading || 0,
          timestamp: new Date()
        };

        // 1. Direct tracking room broadcast if trackingId provided
        if (trackingId) {
          io.to(`track_${trackingId}`).emit('rider_location', payload);
        }

        // 2. Also broadcast to active bookings associated with this rider
        if (riderId) {
          try {
            const Booking = require('../models/Booking');
            const activeBooking = await Booking.findOne({
              $or: [{ currentRider: riderId }, { assignedRider: riderId }],
              status: { $in: ['Rider Assigned', 'Rider On the Way', 'Arrived at Pickup', 'Picked Up', 'In Transit', 'Out for Delivery'] }
            }).select('trackingId status');

            if (activeBooking && activeBooking.trackingId !== trackingId) {
              io.to(`track_${activeBooking.trackingId}`).emit('rider_location', {
                ...payload,
                trackingId: activeBooking.trackingId,
                status: activeBooking.status
              });
            }
          } catch (bErr) {}

          // 3. Update Rider's last known location in DB
          try {
            const User = require('../models/User');
            await User.findByIdAndUpdate(riderId, {
              'riderDetails.currentLocation.lat': Number(lat),
              'riderDetails.currentLocation.lng': Number(lng),
              'riderDetails.currentLocation.updatedAt': new Date(),
              'riderDetails.lastLocationUpdate': new Date()
            });
          } catch (uErr) {}
        }
      } catch (err) {
        console.warn('[Socket] location_update handling error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });
};

exports.getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized!");
  }
  return io;
};
