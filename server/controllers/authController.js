const jwt = require('jsonwebtoken');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { OAuth2Client } = require('google-auth-library');
const { ensureUserPickupOtp } = require('../utils/pickupOtpHelper');
const { findCaptainByPhone, upsertHelperAccount, normalizeWorkType } = require('../utils/partnerHelper');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

function checkRiderLoginMode(user, role, loginMode) {
  if (role !== 'Rider' || !loginMode || !user || user.role !== 'Rider') {
    return null;
  }
  const normalizedMode = String(loginMode).toLowerCase();
  const accountMode = user.riderDetails?.partnerMode === 'Helper' ? 'helper' : 'captain';
  if (normalizedMode === 'helper' && accountMode !== 'helper') {
    return 'This account is registered as a Captain. Please use "Login as Captain".';
  }
  if (normalizedMode === 'captain' && accountMode === 'helper') {
    return 'This account is registered as a Helper. Please use "Login as Helper".';
  }
  return null;
}

exports.sendOtp = async (req, res) => {
  try {
    const { email, phone, role, name, password, riderDetails, loginMode } = req.body;
    
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
      const modeMismatchError = checkRiderLoginMode(user, role, loginMode);
      if (modeMismatchError) {
        return res.status(403).json({ success: false, error: modeMismatchError });
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
      if (!user.riderDetails) user.riderDetails = {};
      if (riderDetails.vehicleType) user.riderDetails.vehicleType = riderDetails.vehicleType;
      if (riderDetails.partnerMode) user.riderDetails.partnerMode = riderDetails.partnerMode;
      user.riderDetails.approvalStatus = 'Pending';
      user.riderDetails.isOnline = false;
      user.riderDetails.isOnShift = false;
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
    const { email, phone, role, otp, loginMode } = req.body;

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
    const user = await User.findOne(query).populate('riderDetails.assignedCaptain', 'name phone photoUrl');
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (role) {
      const adminRoles = ['SuperAdmin', 'OperationsAdmin', 'OperationsStaff', 'HubManager', 'HubOperator', 'DispatchManager', 'FinanceManager'];
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
      const modeMismatchError = checkRiderLoginMode(user, role, loginMode);
      if (modeMismatchError) {
        return res.status(403).json({ success: false, error: modeMismatchError });
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
    await ensureUserPickupOtp(user);

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
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl,
        vehicleImageUrl: user.vehicleImageUrl || user.riderDetails?.vehicleImageUrl,
        pickupOtp: user.pickupOtp,
        riderDetails: user.riderDetails
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to verify OTP' });
  }
};

exports.loginWithPassword = async (req, res) => {
  try {
    const { identifier, password, role, loginMode } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ success: false, error: 'Email/Phone and password are required' });
    }

    const isEmail = identifier.includes('@');
    const query = {};
    if (isEmail) query.email = { $regex: new RegExp(`^${identifier}$`, 'i') };
    else query.phone = identifier.replace(/\D/g, '').slice(-10);

    const user = await User.findOne(query).populate('riderDetails.assignedCaptain', 'name phone photoUrl');
    
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
      const modeMismatchError = checkRiderLoginMode(user, role, loginMode);
      if (modeMismatchError) {
        return res.status(403).json({ success: false, error: modeMismatchError });
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

    await ensureUserPickupOtp(user);

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
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        photoUrl: user.photoUrl,
        vehicleImageUrl: user.vehicleImageUrl || user.riderDetails?.vehicleImageUrl,
        pickupOtp: user.pickupOtp,
        riderDetails: user.riderDetails
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
    await ensureUserPickupOtp(user);

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
        photoUrl: user.photoUrl,
        pickupOtp: user.pickupOtp
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
      vehicleImageUrl,
      partnerMode = 'Captain',
      helperWorkType = 'Load & Unload',
      captainPhone,
      helpers = []
    } = req.body;
    
    if (!name || (!email && !phone)) {
      return res.status(400).json({ success: false, error: 'Name and Phone/Email are required' });
    }

    const normalizedMode = partnerMode === 'Helper' ? 'Helper' : 'Captain';
    const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : undefined;
    const orClauses = [];
    if (email) orClauses.push({ email: new RegExp('^' + email.trim() + '$', 'i') });
    if (cleanPhone) orClauses.push({ phone: cleanPhone }, { phone: '+91' + cleanPhone }, { phone: '91' + cleanPhone });

    let user = orClauses.length ? await User.findOne({ $or: orClauses, role: 'Rider' }) : null;

    if (normalizedMode === 'Helper') {
      const linkedCaptain = captainPhone ? await findCaptainByPhone(captainPhone) : null;
      const resolvedWorkType = normalizeWorkType(helperWorkType || riderDetails?.helperWorkType);
      const docs = {
        aadhaarUrl: aadhaarCardUrl || riderDetails?.documents?.aadhaarUrl || '',
        profileImageUrl: profilePhoto || riderDetails?.documents?.profileImageUrl || ''
      };

      if (user) {
        user.name = name;
        if (email) user.email = email;
        if (cleanPhone) user.phone = cleanPhone;
        if (profilePhoto) user.photoUrl = profilePhoto;
        if (!user.riderDetails) user.riderDetails = {};
        user.riderDetails.partnerMode = 'Helper';
        user.riderDetails.helperWorkType = resolvedWorkType;
        if (linkedCaptain) {
          user.riderDetails.assignedCaptain = linkedCaptain._id;
          user.riderDetails.captainName = linkedCaptain.name;
          user.riderDetails.captainPhone = linkedCaptain.phone;
        }
        if (!user.riderDetails.documents) user.riderDetails.documents = {};
        if (docs.aadhaarUrl) user.riderDetails.documents.aadhaarUrl = docs.aadhaarUrl;
        if (docs.profileImageUrl) user.riderDetails.documents.profileImageUrl = docs.profileImageUrl;
        user.riderDetails.approvalStatus = 'Approved';
        user.riderDetails.isOnline = true;
      } else {
        user = new User({
          name,
          email: email || undefined,
          phone: cleanPhone || phone || undefined,
          role: 'Rider',
          photoUrl: profilePhoto || undefined,
          isActive: true,
          riderDetails: {
            partnerMode: 'Helper',
            helperWorkType: resolvedWorkType,
            ...(linkedCaptain ? {
              assignedCaptain: linkedCaptain._id,
              captainName: linkedCaptain.name,
              captainPhone: linkedCaptain.phone
            } : {}),
            documents: docs,
            approvalStatus: 'Approved',
            isOnline: true,
            isOnShift: false
          }
        });
      }

      await user.save();
      if (user.riderDetails?.assignedCaptain) {
        await user.populate('riderDetails.assignedCaptain', 'name phone photoUrl');
      }

      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET || 'fallback_secret',
        { expiresIn: '7d' }
      );

      return res.status(201).json({
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
        message: 'Helper account created and approved!'
      });
    }

    // Captain onboarding branch
    const vehReg = vehicleNumber || vehicleRegistration || riderDetails?.vehicleRegistration || '';
    const vehType = vehicleType || riderDetails?.vehicleType || 'Bike';
    const vehImg = vehicleImageUrl || riderDetails?.vehicleImageUrl || riderDetails?.documents?.vehiclePicUrl || '';

    const docs = {
      drivingLicenseUrl: drivingLicenseUrl || riderDetails?.documents?.drivingLicenseUrl || '',
      aadhaarUrl: aadhaarCardUrl || riderDetails?.documents?.aadhaarUrl || '',
      vehiclePicUrl: vehImg || riderDetails?.documents?.vehiclePicUrl || '',
      profileImageUrl: profilePhoto || riderDetails?.documents?.profileImageUrl || ''
    };

    if (user) {
      user.name = name;
      if (email) user.email = email;
      if (cleanPhone) user.phone = cleanPhone;
      if (profilePhoto) user.photoUrl = profilePhoto;
      if (!user.riderDetails) user.riderDetails = {};
      user.riderDetails.partnerMode = 'Captain';
      user.riderDetails.vehicleType = vehType;
      user.riderDetails.vehicleRegistration = vehReg;
      user.riderDetails.vehicleImageUrl = vehImg;
      if (!user.riderDetails.documents) user.riderDetails.documents = {};
      if (docs.drivingLicenseUrl) user.riderDetails.documents.drivingLicenseUrl = docs.drivingLicenseUrl;
      if (docs.aadhaarUrl) user.riderDetails.documents.aadhaarUrl = docs.aadhaarUrl;
      if (docs.vehiclePicUrl) user.riderDetails.documents.vehiclePicUrl = docs.vehiclePicUrl;
      if (docs.profileImageUrl) user.riderDetails.documents.profileImageUrl = docs.profileImageUrl;
      user.riderDetails.approvalStatus = 'Approved';
      user.riderDetails.isOnline = true;
    } else {
      user = new User({
        name,
        email: email || undefined,
        phone: cleanPhone || phone || undefined,
        role: 'Rider',
        photoUrl: profilePhoto || undefined,
        isActive: true,
        riderDetails: {
          partnerMode: 'Captain',
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

    // Register any Helpers added by Captain under him
    const createdHelpers = [];
    if (Array.isArray(helpers) && helpers.length > 0) {
      for (const h of helpers) {
        if (h && h.name && h.phone) {
          const savedHelper = await upsertHelperAccount({
            name: h.name,
            phone: h.phone,
            email: h.email,
            helperWorkType: h.helperWorkType,
            profilePhoto: h.profilePhoto,
            captain: user
          });
          createdHelpers.push({
            id: savedHelper._id,
            name: savedHelper.name,
            phone: savedHelper.phone,
            helperWorkType: savedHelper.riderDetails?.helperWorkType
          });
        }
      }
    }

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
        riderDetails: user.riderDetails,
        createdHelpers
      },
      message: createdHelpers.length
        ? `Captain account & ${createdHelpers.length} helper(s) created and approved!`
        : 'Captain account created and approved!'
    });
  } catch (error) {
    console.error('Rider apply error:', error);
    const status = error.message?.includes('Valid 10-digit') || error.message?.includes('already registered') ? 400 : 500;
    res.status(status).json({ success: false, error: error.message || 'Failed to create Partner account' });
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
    await ensureUserPickupOtp(user);
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.googleLogin = async (req, res) => {
  try {
    const { token, accessToken, role, isSignup, loginMode } = req.body;
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

    const rawToken = token || accessToken;
    const isIdToken = rawToken && rawToken.split('.').length === 3;

    if (isIdToken) {
      try {
        const client = new OAuth2Client(webClientId);
        const ticket = await client.verifyIdToken({
          idToken: rawToken,
          audience: allowedAudiences,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        picture = payload.picture;
      } catch (jwtErr) {
        console.warn('ID token verification failed, trying userinfo endpoint:', jwtErr.message);
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${rawToken}` }
        });
        if (response.ok) {
          const payload = await response.json();
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
        } else {
          throw jwtErr;
        }
      }
    } else {
      // It is an OAuth2 access_token (e.g. ya29....)
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${rawToken}` }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch user info from Google with access token');
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
      const modeMismatchError = checkRiderLoginMode(user, role, loginMode);
      if (modeMismatchError) {
        return res.status(403).json({ success: false, error: modeMismatchError });
      }
      if (user.riderDetails?.assignedCaptain) {
        await user.populate('riderDetails.assignedCaptain', 'name phone photoUrl');
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

    await ensureUserPickupOtp(user);

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
        pickupOtp: user.pickupOtp,
        riderDetails: user.riderDetails
      }
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ success: false, error: 'Invalid Google token or authentication failed' });
  }
};
