const User = require('../models/User');

const VALID_HELPER_WORK_TYPES = ['Load Only', 'Unload Only', 'Load & Unload'];

function normalizeWorkType(val) {
  return VALID_HELPER_WORK_TYPES.includes(val) ? val : 'Load & Unload';
}

function normalizePhone10(phone) {
  return phone ? String(phone).replace(/\D/g, '').slice(-10) : '';
}

function buildPhoneSearchClauses(cleanPhone, email) {
  const clauses = [];
  if (cleanPhone) {
    clauses.push(
      { phone: cleanPhone },
      { phone: '+91' + cleanPhone },
      { phone: '91' + cleanPhone }
    );
  }
  if (email && String(email).trim()) {
    clauses.push({ email: new RegExp('^' + String(email).trim() + '$', 'i') });
  }
  return clauses;
}

/**
 * Finds a Captain user by mobile number when a Helper links to an existing Captain.
 */
async function findCaptainByPhone(captainPhone) {
  const cleanCapPhone = normalizePhone10(captainPhone);
  if (cleanCapPhone.length !== 10) return null;
  return User.findOne({
    role: 'Rider',
    'riderDetails.partnerMode': { $ne: 'Helper' },
    $or: buildPhoneSearchClauses(cleanCapPhone)
  });
}

/**
 * Creates or updates a Helper account (role: Rider, partnerMode: Helper).
 * Used both during Captain/Helper registration and when a Captain adds Helpers later.
 */
async function upsertHelperAccount({ name, phone, email, helperWorkType, profilePhoto, aadhaarCardUrl, captain }) {
  const cleanPhone = normalizePhone10(phone);
  if (cleanPhone.length !== 10) {
    throw new Error(`Valid 10-digit phone number is required for helper ${name || ''}.`.trim());
  }

  const workType = normalizeWorkType(helperWorkType);
  const clauses = buildPhoneSearchClauses(cleanPhone, email);
  let helperUser = clauses.length ? await User.findOne({ $or: clauses }) : null;

  if (helperUser && helperUser.role === 'Rider' && helperUser.riderDetails?.partnerMode !== 'Helper') {
    throw new Error(`Phone ${cleanPhone} is already registered as a Captain account.`);
  }

  const resolvedPhoto = profilePhoto || helperUser?.photoUrl || helperUser?.riderDetails?.documents?.profileImageUrl || '';
  const docsPatch = {
    ...(helperUser?.riderDetails?.documents || {}),
    ...(resolvedPhoto ? { profileImageUrl: resolvedPhoto } : {}),
    ...(aadhaarCardUrl ? { aadhaarUrl: aadhaarCardUrl } : {})
  };

  const captainLinkPatch = captain
    ? {
        assignedCaptain: captain._id,
        captainName: captain.name,
        captainPhone: captain.phone
      }
    : {};

  if (helperUser) {
    helperUser.name = String(name || helperUser.name || 'ZyperGo Helper').trim();
    helperUser.phone = cleanPhone;
    if (email && String(email).trim()) helperUser.email = String(email).trim();
    if (resolvedPhoto) helperUser.photoUrl = resolvedPhoto;
    helperUser.role = 'Rider';
    helperUser.isActive = true;
    helperUser.riderDetails = {
      ...(helperUser.riderDetails || {}),
      partnerMode: 'Helper',
      helperWorkType: workType,
      ...captainLinkPatch,
      approvalStatus: 'Approved',
      isOnline: true,
      documents: docsPatch
    };
  } else {
    helperUser = new User({
      name: String(name || 'ZyperGo Helper').trim(),
      phone: cleanPhone,
      email: email && String(email).trim() ? String(email).trim() : undefined,
      role: 'Rider',
      photoUrl: resolvedPhoto || undefined,
      isActive: true,
      riderDetails: {
        partnerMode: 'Helper',
        helperWorkType: workType,
        ...captainLinkPatch,
        approvalStatus: 'Approved',
        isOnline: true,
        isOnShift: false,
        documents: docsPatch
      }
    });
  }

  await helperUser.save();
  return helperUser;
}

module.exports = {
  VALID_HELPER_WORK_TYPES,
  normalizeWorkType,
  normalizePhone10,
  findCaptainByPhone,
  upsertHelperAccount
};

