const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  console.warn('DNS server override ignored:', e.message);
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or same-origin requests)
    if (!origin) return callback(null, true);
    // Allow all origins in production/dev for IP and domain access
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.error('MongoDB connection error:', error));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ZYPERGO Backend is running' });
});


const bookingRoutes = require('./routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);

const supportRoutes = require('./routes/supportRoutes');
app.use('/api/support', supportRoutes);

const authRoutes = require('./routes/authRoutes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

const riderRoutes = require('./routes/riderRoutes');
app.use('/api/rider', riderRoutes);

const adminRoutes = require('./routes/adminRoutes');
app.use('/api/admin', adminRoutes);

const partnerRoutes = require('./routes/partnerRoutes');
app.use('/api/partner', partnerRoutes);

const hubRoutes = require('./routes/hubRoutes');
app.use('/api/hub', hubRoutes);

const scanRoutes = require('./routes/scanRoutes');
app.use('/api/scan', scanRoutes);

const manifestRoutes = require('./routes/manifestRoutes');
app.use('/api/manifest', manifestRoutes);

const dispatchRoutes = require('./routes/dispatchRoutes');
app.use('/api/dispatch', dispatchRoutes);

const pricingRoutes = require('./routes/pricingRoutes');
app.use('/api/pricing', pricingRoutes);

const serviceabilityRoutes = require('./routes/serviceabilityRoutes');
app.use('/api/serviceability', serviceabilityRoutes);

const returnRoutes = require('./routes/returnRoutes');
app.use('/api/returns', returnRoutes);

const ndrRoutes = require('./routes/ndrRoutes');
app.use('/api/ndr', ndrRoutes);

const financeRoutes = require('./routes/financeRoutes');
app.use('/api/finance-settlements', financeRoutes);

const analyticsRoutes = require('./routes/analyticsRoutes');
app.use('/api/analytics', analyticsRoutes);

const addressRoutes = require('./routes/addressRoutes');
app.use('/api/addresses', addressRoutes);

const enquiryRoutes = require('./routes/enquiryRoutes');
app.use('/api/enquiries', enquiryRoutes);

const blogRoutes = require('./routes/blogRoutes');
app.use('/api/blogs', blogRoutes);

const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/upload', uploadRoutes);

// Serve static files in production if SERVE_STATIC is true or client dist exists
const fs = require('fs');

const clientDistPath = path.join(__dirname, '../client/dist');
if (process.env.SERVE_STATIC === 'true' || (process.env.NODE_ENV === 'production' && fs.existsSync(clientDistPath))) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Start server (runs in both production and development on EC2 / Node servers)
const PORT = process.env.PORT || 5000;
const http = require('http');
const server = http.createServer(app);

// Initialize Socket.io
const socketService = require('./socket');
socketService.init(server);

// Only listen if not running in Vercel serverless environment
if (!process.env.VERCEL) {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[ZYPERGO] Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Please kill the process using this port or change PORT in .env`);
      process.exit(1);
    } else {
      console.error('Server error:', e);
    }
  });

  // Graceful shutdown handling for PM2 / EC2
  const handleShutdown = (signal) => {
    console.log(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed.');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

module.exports = app;

