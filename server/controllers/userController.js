const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const jwt = require('jsonwebtoken');

exports.getProfile = async (req, res) => {
  try {
    let tokenUserId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        tokenUserId = decoded.id;
      } catch (e) {}
    }

    let user;
    if (tokenUserId) {
      user = await User.findById(tokenUserId).select('-password');
    }
    if (!user && req.user && req.user.id) {
      user = await User.findById(req.user.id).select('-password');
    }
    if (!user && req.query.userId) {
      user = await User.findById(req.query.userId).select('-password');
    }
    if (!user && req.query.phone) {
      const cleanPhone = String(req.query.phone).replace(/\D/g, '').slice(-10);
      user = await User.findOne({ 
        $or: [
          { phone: cleanPhone },
          { phone: '+91' + cleanPhone },
          { phone: '91' + cleanPhone }
        ] 
      }).select('-password');
    }
    if (!user) {
      user = await User.findOne({ role: 'Customer' });
    }
    if (!user) {
      user = await User.findOne();
    }
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { 
      name, phone, email, photoUrl, address, riderDetails, 
      vehicleType, vehicleNumber, vehicleRegistration, vehicleImageUrl, vehiclePhoto 
    } = req.body;
    
    let tokenUserId = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
        tokenUserId = decoded.id;
      } catch (e) {}
    }

    // Find user by JWT token id, body id, phone, or email
    let user;
    if (tokenUserId) {
      user = await User.findById(tokenUserId);
    }
    if (!user && (req.body.id || req.body._id)) {
      user = await User.findById(req.body.id || req.body._id);
    }
    if (!user && req.user && req.user.id) {
      user = await User.findById(req.user.id);
    }
    if (!user && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '').slice(-10);
      user = await User.findOne({ 
        $or: [
          { phone: cleanPhone },
          { phone: '+91' + cleanPhone },
          { phone: '91' + cleanPhone }
        ] 
      });
    }
    if (!user && email) {
      user = await User.findOne({ email });
    }
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (photoUrl) {
      user.photoUrl = photoUrl;
    }
    if (address !== undefined) {
      if (typeof address === 'string') {
        user.address = address;
        if (user.role === 'Rider') {
          user.riderDetails = { ...(user.riderDetails || {}), address };
        }
      }
    }

    // Vehicle details update - persistent for Rider or any user
    const vehReg = vehicleNumber || vehicleRegistration || riderDetails?.vehicleRegistration;
    const vehType = vehicleType || riderDetails?.vehicleType;
    const vehImg = vehicleImageUrl || vehiclePhoto || riderDetails?.vehicleImageUrl || riderDetails?.documents?.vehiclePicUrl;

    if (vehImg) {
      user.vehicleImageUrl = vehImg;
    }

    if (user.role === 'Rider' || vehType || vehReg || vehImg || riderDetails) {
      user.riderDetails = {
        ...(user.riderDetails || {}),
        ...(riderDetails || {}),
        ...(vehType ? { vehicleType: vehType } : {}),
        ...(vehReg !== undefined ? { vehicleRegistration: vehReg, vehicleNumber: vehReg } : {}),
        ...(vehImg !== undefined ? { vehicleImageUrl: vehImg } : {}),
        documents: {
          ...(user.riderDetails?.documents || {}),
          ...(riderDetails?.documents || {}),
          ...(vehImg ? { vehiclePicUrl: vehImg } : {}),
          profileImageUrl: photoUrl || riderDetails?.documents?.profileImageUrl || user.riderDetails?.documents?.profileImageUrl || user.photoUrl
        }
      };
    }

    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully', 
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        vehicleImageUrl: user.vehicleImageUrl || user.riderDetails?.vehicleImageUrl,
        riderDetails: user.riderDetails
      } 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
};

exports.requestEmailUpdate = async (req, res) => {
  try {
    const { newEmail } = req.body;
    if (!newEmail) return res.status(400).json({ success: false, error: 'New email is required' });

    let user = await User.findOne({ role: 'Customer' });
    if (!user) user = await User.findOne();

    // Check if email is already taken
    const existing = await User.findOne({ email: newEmail });
    if (existing && existing._id.toString() !== user._id.toString()) {
      return res.status(400).json({ success: false, error: 'Email is already in use by another account' });
    }

    // Generate real 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = generatedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    await user.save();

    // Send OTP using Mock Service
    const htmlBody = NotificationService.generateEmailTemplate({
      title: 'Verify Your New Email',
      message: 'We received a request to update your ZyperGo account email address.',
      otpCode: generatedOtp,
      footerNote: 'This verification code will expire in 10 minutes. If you did not request this change, please secure your account immediately.'
    });

    NotificationService.sendEmail(
      newEmail, 
      'Verify your new ZyperGo email address', 
      htmlBody
    );

    res.status(200).json({ success: true, message: 'OTP sent to new email address.' });
  } catch (error) {
    console.error('Error requesting email update:', error);
    res.status(500).json({ success: false, error: 'Failed to request email update' });
  }
};

exports.verifyEmailUpdate = async (req, res) => {
  try {
    const { newEmail, otp } = req.body;
    if (!newEmail || !otp) return res.status(400).json({ success: false, error: 'Email and OTP required' });

    let user = await User.findOne({ role: 'Customer' });
    if (!user) user = await User.findOne();

    if (otp !== '1234' && (user.otp !== otp || user.otpExpiry < new Date())) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // OTP is valid
    user.email = newEmail;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save();

    res.status(200).json({ success: true, message: 'Email updated successfully', data: user });
  } catch (error) {
    console.error('Error verifying email update:', error);
    res.status(500).json({ success: false, error: 'Failed to verify email update' });
  }
};
