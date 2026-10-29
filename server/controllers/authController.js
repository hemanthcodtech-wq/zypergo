const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.sendOtp = async (req, res) => {
  try {
    const { email, phone, role, name, password, riderDetails } = req.body;
    
    // We can allow either email or phone for login, but for signup we want both
    if (!email && !phone) return res.status(400).json({ success: false, error: 'Email or phone number is required' });

    // Normalize phone number to 10 digits
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;

    // Search for user by email or phone across all roles first to prevent E11000 duplicate key crashes
    let searchConditions = [];
    if (email) {
      searchConditions.push({ email: new RegExp('^' + email + '$', 'i') });
    }
    if (cleanPhone) {
      searchConditions.push(
        { phone: cleanPhone },
        { phone: '+91' + cleanPhone },
        { phone: '91' + cleanPhone }
      );
    }

    let user = await User.findOne({ $or: searchConditions });
    
    if (user) {
      // Validate role if portal requires a specific role
      if (role && user.role !== role && user.role !== 'SuperAdmin') {
        return res.status(403).json({
          success: false,
          error: 'This account is already registered as ' + user.role + '. Please use the ' + user.role + ' app to login.'
        });
      }
    } else {
      // New user registration / customer quick login
      if (name && (email || cleanPhone)) {
        user = new User({ email: email || null, phone: cleanPhone || phone || null, role: role || 'Customer', name, password });
      } else if (role === 'Customer') {
        user = new User({ email: email || null, phone: cleanPhone || phone || null, role: 'Customer', name: 'Customer User', password });
      } else {
        return res.status(404).json({ success: false, error: (role || 'User') + ' account not found. Please sign up first.' });
      }
    }

    // Generate real 4-digit OTP
    const generatedOtp = Math.floor(1000 + Math.random() * 9000).toString();
    user.otp = generatedOtp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
    
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

    // Send SMS via MSG91 if phone exists
    const targetPhone = user.phone || cleanPhone || phone;
    if (targetPhone) {
      try {
        const smsRes = await NotificationService.sendSMS(
          targetPhone, 
          'Your OTP for login to Zypergo is ' + generatedOtp + '. Valid for 10 minutes. Please do not share this OTP with anyone. - Zypergo',
          generatedOtp
        );
        console.log('[sendOtp] MSG91 SMS dispatch result:', smsRes);
      } catch (smsErr) {
        console.warn('SMS dispatch error:', smsErr.message);
      }
    }

    // Send via email if email exists
    if (user.email) {
      try {
        const htmlBody = NotificationService.generateEmailTemplate({
          title: 'Login Verification',
          message: 'We received a request to log into your ZyperGo account.',
          otpCode: generatedOtp,
          footerNote: 'This code will expire in 10 minutes. If you did not request this, please secure your account.'
        });

        await NotificationService.sendEmail(
          user.email,
          'Your ZyperGo Login OTP',
          htmlBody
        );
      } catch (eErr) {
        console.warn('Email dispatch failed, continuing:', eErr.message);
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully to your registered mobile number/email via DLT SMS.'
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ success: false, error: 'Failed to send OTP. Please check your contact information and try again.' });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, phone, role, otp } = req.body;

    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : null;
    let query = {};
    if (email && cleanPhone) {
      query.$or = [
        { email: new RegExp('^' + email + '$', 'i') },
        { phone: cleanPhone },
        { phone: '+91' + cleanPhone },
        { phone: '91' + cleanPhone }
      ];
    } else if (email) {
      query.email = new RegExp('^' + email + '$', 'i');
    } else if (cleanPhone) {
      query.$or = [
        { phone: cleanPhone },
        { phone: '+91' + cleanPhone },
        { phone: '91' + cleanPhone }
      ];
    }
    const user = await User.findOne(query);
    
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
      user.riderDetails.approvalStatus = 'Approved';
      await user.save();
    }

    // Strict verification: only authentic OTP delivered by MSG91 / DLT is accepted
    if (!user.otp || user.otp !== otp || (user.otpExpiry && user.otpExpiry < new Date())) {
      return res.status(401).json({ success: false, error: 'Invalid or expired OTP. Please enter the valid OTP sent to your mobile.' });
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

exports.register = async (req, res) => {
  try {
    const { name, email, phone, role = 'Customer', profilePhoto } = req.body;
    
    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, error: 'Name and Phone/Email are required' });
    }

    const emailRegex = email ? { $regex: new RegExp(`^${email}$`, 'i') } : null;
    let user = await User.findOne({ $or: [{ email: emailRegex }, { phone }], role });
    
    if (user) {
      user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (profilePhoto) {
        user.photoUrl = profilePhoto;
      }
    } else {
      user = new User({
        name,
        email: email || undefined,
        phone: phone || undefined,
        role: role || 'Customer',
        photoUrl: profilePhoto || undefined,
        isActive: true
      });
    }

    await user.save();

    // Generate JWT token so user is immediately logged in
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      token,
      data: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl
      },
      message: 'Account created successfully!'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to create account' });
  }
};

exports.riderApply = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      riderDetails, 
      profilePhoto, 
      drivingLicenseUrl, 
      aadhaarCardUrl,
      vehicleType,
      vehicleNumber,
      vehicleRegistration,
      vehicleImageUrl
    } = req.body;
    
    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, error: 'Name and Phone/Email are required' });
    }

    let user = await User.findOne({ $or: [{ email }, { phone }], role: 'Rider' });
    
    const vehReg = vehicleNumber || vehicleRegistration || riderDetails?.vehicleRegistration || '';
    const vehType = vehicleType || riderDetails?.vehicleType || 'Bike';
    const vehImg = vehicleImageUrl || riderDetails?.vehicleImageUrl || riderDetails?.documents?.vehiclePicUrl || '';

    const docs = {
      drivingLicenseUrl: drivingLicenseUrl || riderDetails?.documents?.drivingLicenseUrl || '',
      aadhaarUrl: aadhaarCardUrl || riderDetails?.documents?.aadhaarUrl || '',
      vehiclePicUrl: vehImg || riderDetails?.documents?.vehiclePicUrl || ''
    };

    if (user) {
      user.name = name;
      if (email) user.email = email;
      if (phone) user.phone = phone;
      if (profilePhoto) user.photoUrl = profilePhoto;
      user.riderDetails = {
        ...(user.riderDetails || {}),
        ...(riderDetails || {}),
        vehicleType: vehType,
        vehicleRegistration: vehReg,
        vehicleImageUrl: vehImg,
        documents: { ...(user.riderDetails?.documents || {}), ...docs },
        approvalStatus: 'Approved',
        isOnline: true
      };
    } else {
      user = new User({
        name,
        email: email || undefined,
        phone: phone || undefined,
        role: 'Rider',
        photoUrl: profilePhoto || undefined,
        isActive: true,
        riderDetails: {
          ...(riderDetails || {}),
          vehicleType: vehType,
          vehicleRegistration: vehReg,
          vehicleImageUrl: vehImg,
          documents: docs,
          approvalStatus: 'Approved', // Auto-approved immediately!
          isOnline: true,
          isOnShift: false
        }
      });
    }

    await user.save();

    // Generate JWT so newly registered rider is immediately logged in
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '7d' }
    );

    res.status(201).json({ 
      success: true, 
      token,
      data: {
        id: user._id,
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        photoUrl: user.photoUrl,
        riderDetails: user.riderDetails
      },
      message: 'Rider account created and approved!' 
    });
  } catch (error) {
    console.error('Rider apply error:', error);
    res.status(500).json({ success: false, error: 'Failed to create Rider account' });
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
    const { token, accessToken, role, isSignup } = req.body;
    let email, name, picture;
    
    if (!token && !accessToken) {
      return res.status(400).json({ success: false, error: 'Google token is required' });
    }

    const webClientId = process.env.GOOGLE_CLIENT_ID || '435325462650-2ormagrttrufcs8o7d87qqhcdub4n81t.apps.googleusercontent.com';
    const allowedAudiences = [
      webClientId,
      process.env.GOOGLE_ANDROID_CUSTOMER_CLIENT_ID || '435325462650-s8j2monrem33ggstba7cgmtr7j5vdp0l.apps.googleusercontent.com',
      process.env.GOOGLE_ANDROID_RIDER_CLIENT_ID || '435325462650-4ltvrrdbl4uf7t9k9hh1u04vu7quhkuk.apps.googleusercontent.com'
    ];

    if (token) {
      // Verify the Google token (id_token flow)
      const client = new OAuth2Client(webClientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: allowedAudiences,
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
      return res.status(400).json({ success: false, error: 'Google account did not return an email.' });
    }

    // Check if user exists in the database
    let user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    
    if (!user) {
      // When attempting to log in, if not registered, prompt to sign up!
      if (!isSignup) {
        return res.status(404).json({ 
          success: false, 
          notRegistered: true,
          email,
          name,
          error: `No registered account found with Google email "${email}". Please sign up first.` 
        });
      }

      // If explicitly signing up:
      user = new User({
        email,
        name: name || 'Google User',
        role: role || 'Customer',
        photoUrl: picture,
        isActive: true,
        ...(role === 'Rider' ? {
          riderDetails: {
            approvalStatus: 'Approved',
            isOnline: true,
            isOnShift: false
          }
        } : {})
      });
      await user.save();
    } else {
      // User exists! Validate role authorization
      if (role && user.role !== role) {
        if (user.role !== 'SuperAdmin') {
          return res.status(403).json({ 
            success: false, 
            error: `This email is already registered as ${user.role}. You cannot log into the ${role} portal.` 
          });
        }
      }
      
      // Check if account is active
      if (user.isActive === false) {
        return res.status(403).json({ success: false, error: 'Account is suspended or inactive.' });
      }

      // Sync photo if not set
      if (!user.photoUrl && picture) {
        user.photoUrl = picture;
        await user.save();
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
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl || picture,
        riderDetails: user.riderDetails
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, error: 'Invalid Google token or authentication failed' });
  }
};
