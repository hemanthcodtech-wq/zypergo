const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { upload } = require('../config/upload');
const NotificationService = require('../services/notificationService');
const SmsService = require('../services/smsService');

// --- Helper for generating JWT ---
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, phone: user.phone },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// --- Helpers for Phone Normalization & Matching ---
const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = phone.toString().replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
};

const getPhoneQueries = (phone) => {
  if (!phone) return [];
  const raw = phone.toString().trim();
  const digits = raw.replace(/\D/g, '');
  const last10 = digits.slice(-10);
  const set = new Set([
    raw,
    digits,
    last10,
    `+91${last10}`,
    `91${last10}`,
    `+91 ${last10}`,
    `0${last10}`
  ]);
  return Array.from(set).map(p => ({ phone: p }));
};

// 1. Basic Login (Fallback)
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body || {};
    
    if (!phone || !password) {
      return res.status(400).json({ error: 'Phone and password are required' });
    }

    const user = await User.findOne({ $or: getPhoneQueries(phone) });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is suspended or inactive' });
    }

    if (user.role === 'Rider' && user.riderDetails.approvalStatus !== 'Approved') {
       return res.status(403).json({ 
         error: 'Account pending admin approval', 
         status: user.riderDetails.approvalStatus 
       });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 1.b Password Login via Identifier (Email or Phone)
router.post('/login-password', async (req, res) => {
  try {
    const { identifier, password, role } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifier and password are required' });
    }

    // Try finding by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Role check if provided and not SuperAdmin logging in as something else
    // Allow SuperAdmin to log in anywhere, otherwise match role
    if (role && user.role !== role && user.role !== 'SuperAdmin') {
       // If it's OperationsStaff trying to log in, that's fine. But we need to make sure
       // their role matches what the app expects, or if they are staff they can log into admin portal.
       const adminRoles = ['SuperAdmin', 'OperationsAdmin', 'OperationsStaff', 'HubManager', 'DispatchManager', 'FinanceManager'];
       if (role === 'Admin' && !adminRoles.includes(user.role)) {
         return res.status(403).json({ error: 'Unauthorized role for this portal' });
       } else if (role !== 'Admin' && user.role !== role) {
         return res.status(403).json({ error: 'Unauthorized role for this portal' });
       }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const token = generateToken(user);
    res.json({
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Password Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// 1.c Send OTP (Integrated with MSG91 SMS DLT and Gmail SMTP)
router.post('/send-otp', async (req, res) => {
  try {
    const { email, phone, role } = req.body || {};
    const identifier = (email || phone || '').trim();
    
    if (!identifier) {
      return res.status(400).json({ error: 'Email or phone required' });
    }

    const isEmail = identifier.includes('@');
    // Generate a 4-digit numeric OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    let queryConditions = [];
    if (isEmail) {
      queryConditions.push({ email: { $regex: new RegExp(`^${identifier}$`, 'i') } });
    } else {
      queryConditions.push(...getPhoneQueries(identifier));
    }

    let user = await User.findOne({ $or: queryConditions });

    if (!user) {
      return res.status(404).json({
        success: false,
        notRegistered: true,
        error: `No registered account found with this ${isEmail ? 'email' : 'mobile number'}. Please sign up first.`
      });
    }

    // Role check: If requested role doesn't match
    if (role && user.role !== role && user.role !== 'SuperAdmin') {
      return res.status(403).json({
        success: false,
        roleMismatch: true,
        error: `This ${isEmail ? 'email' : 'mobile number'} is registered as a ${user.role}. Please log in via the ${user.role} portal.`
      });
    }

    user.otp = generatedOtp;
    user.otpExpiry = expiry;
    await user.save();

    let deliveryMethod = 'SMS';
    if (isEmail) {
      deliveryMethod = 'Email';
      try {
        const htmlBody = NotificationService.generateEmailTemplate({
          title: 'ZyperGo Verification Code',
          message: 'Use the following one-time password (OTP) to securely sign in to your ZyperGo account:',
          otpCode: generatedOtp,
          footerNote: 'This verification code is valid for 10 minutes. Please do not share it with anyone.'
        });
        await NotificationService.sendEmail(identifier, `Your ZyperGo OTP: ${generatedOtp}`, htmlBody);
        console.log(`[EMAIL OTP] Successfully dispatched ${generatedOtp} to ${identifier}`);
      } catch (mailErr) {
        console.error('[EMAIL OTP] Failed to send email via SMTP:', mailErr.message);
      }
    } else {
      // Dispatch SMS OTP via MSG91 DLT API
      try {
        const msg91Result = await SmsService.sendOtp(identifier, generatedOtp);
        console.log(`[SMS OTP MSG91] Dispatched ${generatedOtp} to ${identifier}:`, msg91Result);
      } catch (smsErr) {
        console.error('[SMS OTP MSG91] Error sending SMS:', smsErr.message);
      }
    }

    res.json({ 
      success: true, 
      message: `OTP sent successfully via ${deliveryMethod}`,
      identifier,
      deliveryMethod,
      devOtp: generatedOtp
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP: ' + error.message });
  }
});

// 1.d Verify OTP (Integrated with MSG91 and Database Verification)
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, phone, otp, role } = req.body || {};
    const identifier = (email || phone || '').trim();
    const enteredOtp = (otp || '').trim();
    
    if (!identifier || !enteredOtp) {
      return res.status(400).json({ error: 'Identifier and OTP required' });
    }

    const isEmail = identifier.includes('@');
    let queryConditions = [];
    if (isEmail) {
      queryConditions.push({ email: { $regex: new RegExp(`^${identifier}$`, 'i') } });
    } else {
      queryConditions.push(...getPhoneQueries(identifier));
    }

    let user = await User.findOne({ $or: queryConditions });

    let isValid = false;

    // 1. Allow 1234 for development/testing
    if (enteredOtp === '1234') {
      isValid = true;
    }

    // 2. Check stored database OTP
    if (!isValid && user && user.otp === enteredOtp) {
      if (user.otpExpiry && new Date() < new Date(user.otpExpiry)) {
        isValid = true;
      }
    }

    // 3. Check remote verification via MSG91 API
    if (!isValid && !isEmail) {
      const msg91Verified = await SmsService.verifyOtp(identifier, enteredOtp);
      if (msg91Verified) {
        isValid = true;
      }
    }

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    if (!user) {
      const normalizedPhone = normalizePhone(identifier);
      user = new User({
        name: isEmail ? identifier.split('@')[0] : (role === 'Rider' ? 'Rider Partner' : 'Customer User'),
        phone: !isEmail ? normalizedPhone : ('91' + Math.floor(1000000000 + Math.random() * 9000000000)),
        email: isEmail ? identifier : undefined,
        role: role || 'Customer',
        password: Math.random().toString(36).slice(-8)
      });
    }

    // Clear OTP after successful login
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is suspended' });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// 2. Customer/Admin Registration
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, email, role, photoUrl } = req.body || {};
    const userRole = role || 'Customer';

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhone(phone);
    const searchConditions = [
      ...getPhoneQueries(phone),
      ...(email ? [{ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }] : [])
    ];

    let user = await User.findOne({ $or: searchConditions });
    if (user) {
      user.name = name || user.name;
      if (email) user.email = email.trim();
      if (photoUrl) user.photoUrl = photoUrl;
      user.phone = normalizedPhone || user.phone;
      await user.save();
    } else {
      user = new User({
        name: name || 'Customer User',
        phone: normalizedPhone,
        password: password || Math.random().toString(36).slice(-8),
        email: email ? email.trim() : undefined,
        role: userRole,
        photoUrl
      });
      await user.save();
    }
    
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        photoUrl: user.photoUrl
      },
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        photoUrl: user.photoUrl
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration: ' + error.message });
  }
});

// 2.b Rider Direct Registration
router.post('/register-rider', async (req, res) => {
  try {
    const { name, phone, email, password, photoUrl, aadhaarUrl, panUrl, documents } = req.body || {};

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const docAadhaar = aadhaarUrl || (documents && documents.aadhaarUrl) || '';
    const docPan = panUrl || (documents && documents.panUrl) || '';
    const docPhoto = photoUrl || (documents && documents.profileImageUrl) || '';
    const normalizedPhone = normalizePhone(phone);

    const searchConditions = [
      ...getPhoneQueries(phone),
      ...(email ? [{ email: { $regex: new RegExp(`^${email.trim()}$`, 'i') } }] : [])
    ];

    let user = await User.findOne({ $or: searchConditions });
    if (user) {
      user.name = name || user.name;
      if (email) user.email = email.trim();
      user.role = 'Rider';
      user.phone = normalizedPhone || user.phone;
      if (docPhoto) user.photoUrl = docPhoto;
      if (!user.riderDetails) user.riderDetails = {};
      user.riderDetails.approvalStatus = 'Approved';
      user.riderDetails.documents = {
        ...user.riderDetails.documents,
        aadhaarUrl: docAadhaar || user.riderDetails.documents?.aadhaarUrl,
        panUrl: docPan || user.riderDetails.documents?.panUrl,
        profileImageUrl: docPhoto || user.riderDetails.documents?.profileImageUrl
      };
      await user.save();
    } else {
      user = new User({
        name: name || 'Rider Partner',
        phone: normalizedPhone,
        email: email ? email.trim() : undefined,
        password: password || Math.random().toString(36).slice(-8),
        role: 'Rider',
        photoUrl: docPhoto,
        riderDetails: {
          vehicleType: 'Scooter',
          approvalStatus: 'Approved',
          documents: {
            aadhaarUrl: docAadhaar,
            panUrl: docPan,
            profileImageUrl: docPhoto
          }
        }
      });
      await user.save();
    }

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Rider registration successful',
      token,
      data: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        photoUrl: user.photoUrl,
        riderDetails: user.riderDetails
      },
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        phone: user.phone,
        email: user.email,
        photoUrl: user.photoUrl,
        riderDetails: user.riderDetails
      }
    });
  } catch (error) {
    console.error('Rider registration error:', error);
    res.status(500).json({ error: 'Server error during rider registration: ' + error.message });
  }
});


// 3. Rider Onboarding with Image Uploads via Cloudinary
router.post(
  '/rider/apply', 
  upload.fields([
    { name: 'profilePhoto', maxCount: 1 },
    { name: 'drivingLicense', maxCount: 1 },
    { name: 'rcDocument', maxCount: 1 },
    { name: 'idProof', maxCount: 1 }
  ]), 
  async (req, res) => {
    try {
      const { name, phone, password, vehicleType, vehicleRegistration } = req.body;
      const files = req.files;

      if (!name || !phone || !password || !vehicleType || !vehicleRegistration) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const existingUser = await User.findOne({ phone });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }

      // Stored locally on AWS server disk and served via /uploads
      const profilePhotoUrl = files['profilePhoto'] ? `/uploads/${files['profilePhoto'][0].filename}` : null;
      const drivingLicenseUrl = files['drivingLicense'] ? `/uploads/${files['drivingLicense'][0].filename}` : null;
      const rcDocumentUrl = files['rcDocument'] ? `/uploads/${files['rcDocument'][0].filename}` : null;
      const idProofUrl = files['idProof'] ? `/uploads/${files['idProof'][0].filename}` : null;

      const user = new User({
        name,
        phone,
        password,
        role: 'Rider',
        photoUrl: profilePhotoUrl,
        riderDetails: {
          vehicleType,
          vehicleRegistration,
          approvalStatus: 'Pending',
          documents: {
            drivingLicenseUrl,
            rcUrl: rcDocumentUrl,
            idProofUrl
          }
        }
      });

      await user.save();
      
      res.status(201).json({
        message: 'Rider application submitted successfully. Pending admin approval.',
        userId: user._id
      });
    } catch (error) {
      console.error('Rider application error:', error);
      res.status(500).json({ error: 'Server error during rider application' });
    }
  }
);

const { protect } = require('../middleware/authMiddleware');

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, error: 'Account suspended' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
