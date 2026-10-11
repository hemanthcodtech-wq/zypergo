const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const SmsService = require('../services/smsService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.sendOtp = async (req, res) => {
  try {
    const { email, phone, role, name, password, riderDetails } = req.body;
    
    // We can allow either email or phone for login, but for signup we want both
    if (!email && !phone) return res.status(400).json({ success: false, error: 'Email or phone number is required' });

    const emailRegex = email ? { $regex: new RegExp(`^${email}$`, 'i') } : null;
    const queryConditions = [];
    if (emailRegex) queryConditions.push({ email: emailRegex });
    if (phone) queryConditions.push({ phone });

    let user = await User.findOne({ 
      $or: queryConditions, 
      ...(role ? { role } : {}) 
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        notRegistered: true, 
        error: `No registered account found with this ${email ? 'email' : 'mobile number'}. Please sign up first.` 
      });
    }

    // Generate real 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = generatedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
    // If user already existed but they passed a new password (e.g. forgot password flow later, or signing up an existing partial account)
    if (password) {
      user.password = password;
    }

    if (riderDetails && role === 'Rider') {
      user.riderDetails = {
         ...riderDetails,
         approvalStatus: 'Pending',
         isOnline: false,
         isOnShift: false
      };
    }
    
    await user.save();

    // Send via SMS if phone exists (using MSG91)
    if (user.phone) {
      try {
        await SmsService.sendOtp(user.phone, generatedOtp);
        console.log(`[MSG91] Dispatched OTP ${generatedOtp} to ${user.phone}`);
      } catch (smsErr) {
        console.error('[MSG91 Error]', smsErr);
      }
    }

    // Send via email if email exists (using SMTP)
    if (user.email && user.email.includes('@')) {
      try {
        const htmlBody = NotificationService.generateEmailTemplate({
          title: 'Login Verification',
          message: 'We received a request to log into your ZyperGo account.',
          otpCode: generatedOtp,
          footerNote: 'This code will expire in 10 minutes. If you did not request this, please secure your account.'
        });

        await NotificationService.sendEmail(
          user.email,
          `Your ZyperGo Login OTP: ${generatedOtp}`,
          htmlBody
        );
        console.log(`[SMTP] Dispatched OTP ${generatedOtp} to ${user.email}`);
      } catch (mailErr) {
        console.error('[SMTP Error]', mailErr);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully. Check your phone SMS or email.',
      devOtp: generatedOtp
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP. Please check your contact information and try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, phone, role, otp } = req.body;

    const emailRegex = email ? { $regex: new RegExp(`^${email}$`, 'i') } : null;
    const user = await User.findOne({ $or: [{ email: emailRegex }, { phone }] });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) {
      const adminRoles = ['SuperAdmin', 'OperationsAdmin', 'OperationsStaff', 'HubManager', 'DispatchManager', 'FinanceManager'];
      const hubRoles = ['HubManager', 'HubOperator'];
      
      let isAuthorized = false;
      if (user.role === 'SuperAdmin') {
        isAuthorized = true;
      } else if (role === 'Admin' || role === 'SuperAdmin') {
        isAuthorized = adminRoles.includes(user.role);
      } else if (hubRoles.includes(role)) {
        isAuthorized = hubRoles.includes(user.role);
      } else {
        isAuthorized = (user.role === role);
      }

      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: `Unauthorized. User role '${user.role}' cannot access this portal.` });
      }
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive.' });
    }

    if (user.role === 'Rider' && user.riderDetails && user.riderDetails.approvalStatus !== 'Approved') {
      return res.status(403).json({ success: false, error: 'Rider account is pending admin approval.' });
    }

    // Verify OTP: Check 1234 bypass, DB stored OTP with expiry, or MSG91 remote verification
    let isOtpValid = (otp === '1234');
    if (!isOtpValid && user.otp === otp && user.otpExpiry && new Date(user.otpExpiry) >= new Date()) {
      isOtpValid = true;
    }
    if (!isOtpValid && user.phone) {
      const msg91Check = await SmsService.verifyOtp(user.phone, otp);
      if (msg91Check) {
        isOtpValid = true;
      }
    }

    if (!isOtpValid) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Clear OTP after successful verify
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

exports.loginWithPassword = async (req, res) => {
  try {
    const { identifier, password, role } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Phone and password are required' });
    }

    const isEmail = identifier.includes('@');
    const query = {};
    if (isEmail) query.email = { $regex: new RegExp(`^${identifier}$`, 'i') };
    else query.phone = identifier.replace(/\D/g, '');

    const user = await User.findOne(query);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found. Please check your credentials.' });
    }

    if (role) {
      const adminRoles = ['SuperAdmin', 'OperationsAdmin', 'OperationsStaff', 'HubManager', 'DispatchManager', 'FinanceManager'];
      const hubRoles = ['HubManager', 'HubOperator'];
      
      let isAuthorized = false;
      if (user.role === 'SuperAdmin') {
        isAuthorized = true;
      } else if (role === 'Admin' || role === 'SuperAdmin') {
        isAuthorized = adminRoles.includes(user.role);
      } else if (hubRoles.includes(role)) {
        isAuthorized = hubRoles.includes(user.role);
      } else {
        isAuthorized = (user.role === role);
      }

      if (!isAuthorized) {
        return res.status(403).json({ success: false, error: `Unauthorized. User role '${user.role}' cannot access this portal.` });
      }
    }

    if (user.isActive === false) {
      return res.status(403).json({ success: false, error: 'Account is suspended or inactive.' });
    }

    if (user.role === 'Rider' && user.riderDetails && user.riderDetails.approvalStatus !== 'Approved') {
      return res.status(403).json({ success: false, error: 'Rider account is pending admin approval.' });
    }

    if (!user.password) {
      return res.status(400).json({ success: false, error: 'No password set for this account. Please login with OTP.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Failed to login' });
  }
};

exports.riderApply = async (req, res) => {
  try {
    const { name, email, phone, riderDetails } = req.body;
    
    if (!name || !email || !phone || !riderDetails) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    let user = await User.findOne({ $or: [{ email }, { phone }], role: 'Rider' });
    if (user) {
      return res.status(400).json({ success: false, error: 'Rider account with this email/phone already exists' });
    }

    user = new User({
      name,
      email,
      phone,
      role: 'Rider',
      riderDetails: {
        ...riderDetails,
        approvalStatus: 'Pending',
        isOnline: false,
        isOnShift: false
      }
    });

    await user.save();
    res.status(201).json({ success: true, message: 'Application submitted successfully. Waiting for admin approval.' });
  } catch (error) {
    console.error('Rider apply error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit application' });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User with this email does not exist' });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Hash token and save to db
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes
    
    await user.save();

    // Construct reset URL based on origin (the frontend application) or configured frontend URL
    const { getFrontendUrl } = require('../utils/urlHelper');
    const origin = req.headers.origin || getFrontendUrl();
    const resetUrl = `${origin.replace(/\/+$/, '')}/reset-password?token=${resetToken}`;

    const htmlBody = NotificationService.generateEmailTemplate({
      title: 'Password Reset Request',
      message: 'You are receiving this email because you (or someone else) have requested the reset of a password. Please click on the button below to complete the process.',
      buttonText: 'Reset Password',
      buttonUrl: resetUrl,
      footerNote: 'This link will expire in 30 minutes. If you did not request this, please ignore this email and your password will remain unchanged.'
    });

    try {
      await NotificationService.sendEmail(
        user.email,
        'ZyperGo - Password Reset Request',
        htmlBody
      );
      res.status(200).json({ success: true, message: 'Password reset link sent to your email' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      
      console.error('Email send error:', emailError);
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Failed to process password reset request' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, error: 'Invalid or expired password reset token' });
    }

    // Set new password (the pre-save hook will hash it)
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    
    await user.save();

    res.status(200).json({ success: true, message: 'Password has been updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Failed to reset password' });
  }
};

exports.getMe = async (req, res) => {
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
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, accessToken, role } = req.body;
    let email, name, picture;
    
    if (!token && !accessToken) {
      return res.status(400).json({ success: false, error: 'Google token is required' });
    }

    if (token) {
      // Verify the Google token (id_token flow)
      if (!process.env.GOOGLE_CLIENT_ID) {
         return res.status(500).json({ success: false, error: 'Server misconfiguration: Google Auth is disabled.' });
      }
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    } else if (accessToken) {
      // Fetch user info using access_token (implicit flow)
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google');
      }
      const payload = await response.json();
      email = payload.email;
      name = payload.name;
      picture = payload.picture;
    }

    if (!email) {
       return res.status(400).json({ success: false, error: 'Google token did not contain an email.' });
    }

    // Check if user exists
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      // Create a new user if they don't exist
      user = new User({
        email,
        name: name || 'Google User',
        role: role || 'Customer', // Default to Customer if role is not specified
        // No password needed for Google auth users, assuming User model allows it (or we can set a dummy)
      });
      await user.save();
    } else {
      // If a role was passed in but the user already exists as another role, check authorization
      if (role && user.role !== role) {
         // Allow SuperAdmin to login anywhere, otherwise restrict
         if (user.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, error: `Account exists as ${user.role}. Cannot login to ${role} portal.` });
         }
      }
      
      // Check if active
      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Account is suspended or inactive.' });
      }
    }

    // Generate ZyperGo JWT
    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(200).json({
      success: true,
      token: jwtToken,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        picture // Pass the profile picture back if needed for UI
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, error: 'Invalid Google token or authentication failed' });
  }
};
