const PricingRule = require('../models/PricingRule');
const VehicleConfig = require('../models/VehicleConfig');

const DEFAULT_VEHICLES = [
  { vehicleType: 'Scooter', displayName: 'Scooter (Bike)', maxWeight: 20, baseFare: 50, baseKm: 3, perKm: 7, helperFee: 0, minimumCharge: 50, etaText: '10 mins', dimensions: '45 × 35 × 35 cm', bestFor: 'Documents, food boxes & small urgent parcels' },
  { vehicleType: 'Mini 3W', displayName: 'Mini 3W', maxWeight: 90, baseFare: 90, baseKm: 4, perKm: 9, helperFee: 100, minimumCharge: 90, etaText: '5 mins', dimensions: '110 × 90 × 90 cm', bestFor: 'Multiple cartons & medium home appliances' },
  { vehicleType: '3 Wheeler', displayName: '3 Wheeler (Auto)', maxWeight: 500, baseFare: 160, baseKm: 4, perKm: 14, helperFee: 150, minimumCharge: 160, etaText: '5 mins', dimensions: '170 × 125 × 125 cm', bestFor: 'Bulk retail stock & wholesale crates' },
  { vehicleType: 'Tata Ace', displayName: 'Tata Ace', maxWeight: 750, baseFare: 280, baseKm: 5, perKm: 18, helperFee: 250, minimumCharge: 280, etaText: '10 mins', dimensions: '215 × 145 × 140 cm', bestFor: 'Home shifting, furniture & commercial goods' },
  { vehicleType: 'Pickup 8ft', displayName: 'Pickup 8ft', maxWeight: 1200, baseFare: 420, baseKm: 5, perKm: 22, helperFee: 300, minimumCharge: 420, etaText: '10 mins', dimensions: '245 × 150 × 150 cm', bestFor: 'Hardware, machinery & distributor dispatches' },
  { vehicleType: 'Pickup 9ft', displayName: 'Pickup 9ft', maxWeight: 1700, baseFare: 520, baseKm: 5, perKm: 26, helperFee: 350, minimumCharge: 520, etaText: '10 mins', dimensions: '275 × 160 × 160 cm', bestFor: 'Heavy B2B cargo & warehouse transfers' },
  { vehicleType: '14ft', displayName: '14ft Truck', maxWeight: 3500, baseFare: 800, baseKm: 10, perKm: 32, helperFee: 400, minimumCharge: 800, etaText: '15 mins', dimensions: '425 × 200 × 200 cm', bestFor: 'Large industrial freight & full loads' },
  { vehicleType: '17ft', displayName: '17ft Truck', maxWeight: 6000, baseFare: 1200, baseKm: 10, perKm: 42, helperFee: 500, minimumCharge: 1200, etaText: '20 mins', dimensions: '520 × 215 × 215 cm', bestFor: 'Heavy intercity/intracity truckloads' }
];

async function ensureDefaultVehicles() {
  const existing = await VehicleConfig.find();
  if (!existing || existing.length === 0) {
    await VehicleConfig.insertMany(DEFAULT_VEHICLES);
    return await VehicleConfig.find().sort({ maxWeight: 1 });
  }
  for (const def of DEFAULT_VEHICLES) {
    const found = existing.find(e => e.vehicleType === def.vehicleType);
    if (!found) {
      await VehicleConfig.create(def);
    } else if (found.baseFare === undefined || found.perKm === undefined) {
      found.baseFare = def.baseFare;
      found.baseKm = def.baseKm || 3;
      found.perKm = def.perKm;
      found.helperFee = def.helperFee || 0;
      found.minimumCharge = def.minimumCharge || def.baseFare;
      found.displayName = found.displayName || def.displayName;
      found.etaText = found.etaText || def.etaText;
      found.dimensions = found.dimensions || def.dimensions;
      found.bestFor = found.bestFor || def.bestFor;
      await found.save();
    }
  }
  return await VehicleConfig.find().sort({ maxWeight: 1 });
}

// --- DYNAMIC VEHICLE PER-KM PRICING CONTROLLERS ---

// 1. GET ALL VEHICLE PRICING (Admin & Internal)
exports.getVehiclePricing = async (req, res) => {
  try {
    const configs = await ensureDefaultVehicles();
    res.status(200).json({ success: true, data: configs });
  } catch (err) {
    console.error('[Pricing getVehiclePricing]', err);
    res.status(500).json({ success: false, error: 'Failed to fetch vehicle pricing configs.' });
  }
};

// 2. GET PUBLIC VEHICLE PRICING (Customer App)
exports.getVehiclePricingPublic = async (req, res) => {
  try {
    const configs = await ensureDefaultVehicles();
    res.status(200).json({ success: true, data: configs });
  } catch (err) {
    console.error('[Pricing getVehiclePricingPublic]', err);
    res.status(200).json({ success: true, data: DEFAULT_VEHICLES });
  }
};

// 3. UPDATE VEHICLE PRICING (Admin)
exports.updateVehiclePricing = async (req, res) => {
  try {
    const { id } = req.params;
    const { baseFare, baseKm, perKm, helperFee, minimumCharge, maxWeight, isActive, displayName, etaText, bestFor } = req.body;

    let config = await VehicleConfig.findById(id);
    if (!config) {
      // Try searching by vehicleType
      config = await VehicleConfig.findOne({ vehicleType: id });
    }
    if (!config) {
      return res.status(404).json({ success: false, error: 'Vehicle config not found.' });
    }

    if (baseFare !== undefined) config.baseFare = Number(baseFare);
    if (baseKm !== undefined) config.baseKm = Number(baseKm);
    if (perKm !== undefined) config.perKm = Number(perKm);
    if (helperFee !== undefined) config.helperFee = Number(helperFee);
    if (minimumCharge !== undefined) config.minimumCharge = Number(minimumCharge);
    if (maxWeight !== undefined) config.maxWeight = Number(maxWeight);
    if (isActive !== undefined) config.isActive = Boolean(isActive);
    if (displayName) config.displayName = displayName;
    if (etaText) config.etaText = etaText;
    if (bestFor) config.bestFor = bestFor;
    config.configuredBy = req.user?.name || 'Super Admin';

    await config.save();
    res.status(200).json({ success: true, message: 'Vehicle pricing updated successfully.', data: config });
  } catch (err) {
    console.error('[Pricing updateVehiclePricing]', err);
    res.status(500).json({ success: false, error: 'Failed to update vehicle pricing.' });
  }
};

// --- GET ALL RULES ---
exports.getRules = async (req, res) => {
  try {
    const rules = await PricingRule.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: rules });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch pricing rules.' });
  }
};

// --- CREATE RULE ---
exports.createRule = async (req, res) => {
  try {
    const rule = await PricingRule.create({ ...req.body, createdBy: req.user?.id });
    res.status(201).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create pricing rule.' });
  }
};

// --- UPDATE RULE ---
exports.updateRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found.' });
    res.status(200).json({ success: true, data: rule });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update pricing rule.' });
  }
};

// --- DELETE RULE ---
exports.deleteRule = async (req, res) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, error: 'Rule not found.' });
    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete pricing rule.' });
  }
};

// --- PRICING ENGINE CALCULATION (Core & Preview) ---
exports.calculatePrice = async (req, res) => {
  try {
    const {
      originCity, destCity,
      originPincode, destPincode,
      distanceKm = 0,
      actualWeight = 1,
      length = 10, width = 10, height = 10,
      category = 'General Parcel',
      speed = 'Standard',
      parcelValue = 0,
      vehicle = 'GoFast'
    } = req.body;

    // Mock distance if not provided
    const calcDistance = distanceKm > 0 ? distanceKm : (originCity === destCity ? 15 : 350);

    const movementType = originCity === destCity ? 'Intracity' : 'Intercity';
    
    // 1. Calculate Volumetric Weight (L x W x H / 5000)
    const volWeight = (length * width * height) / 5000;
    const chargeableWeight = Math.max(actualWeight, volWeight);

    // 2. Fetch Active Rules
    const activeRules = await PricingRule.find({ isActive: true });

    // 3. Find the best Base/Slab rule
    let baseRule = null;
    let appliedRules = [];

    // Filter potential base rules
    const baseCandidates = activeRules.filter(r => !r.isSurcharge && (r.movementType === 'Any' || r.movementType === movementType));
    
    // Pick the most specific base rule based on weight, city, or pincode
    // For simplicity, we just pick the first matching base rule based on weight
    for (const rule of baseCandidates) {
      const wMatch = (!rule.conditions.minWeight || chargeableWeight >= rule.conditions.minWeight) &&
                     (!rule.conditions.maxWeight || chargeableWeight <= rule.conditions.maxWeight);
      const cMatch = (!rule.conditions.originCity || rule.conditions.originCity === originCity) &&
                     (!rule.conditions.destCity || rule.conditions.destCity === destCity);
      const pMatch = (!rule.conditions.originPincode || rule.conditions.originPincode === originPincode) &&
                     (!rule.conditions.destPincode || rule.conditions.destPincode === destPincode);
      
      if (wMatch && cMatch && pMatch) {
        baseRule = rule;
        appliedRules.push(rule.ruleName);
        break; // take first match (can be improved to sort by specificity)
      }
    }

    if (!baseRule) {
      // Dynamic fallback rules based on vehicle
      let vBase = 50; let vPerKm = 5; let vPerKg = 10;
      if (vehicle === 'Scooter') { vBase = 40; vPerKm = 8; vPerKg = 5; }
      else if (vehicle === 'Mini 3W' || vehicle === '3 Wheeler') { vBase = 60; vPerKm = 10; vPerKg = 12; }
      else if (vehicle === 'Tata Ace' || vehicle === 'Pickup 8ft') { vBase = 150; vPerKm = 15; vPerKg = 10; }
      else if (vehicle === 'Pickup 9ft' || vehicle === '14ft' || vehicle === '17ft') { vBase = 500; vPerKm = 25; vPerKg = 8; }

      baseRule = {
        rates: { basePrice: vBase, perKgRate: vPerKg, perKmRate: vPerKm, handlingCost: 0, minimumCharge: vBase, gstPercentage: 18, insurancePercentage: 0, discountPercentage: 0, partnerCost: vBase * 0.4, riderCost: vBase * 0.3, marginPercentage: 20 }
      };
      appliedRules.push(`Default ${vehicle} Rule`);
    }

    // 4. Calculate Base Costs & Customer Price
    let calculatedBase = baseRule.rates.basePrice + (chargeableWeight * baseRule.rates.perKgRate) + (calcDistance * baseRule.rates.perKmRate);
    let priceBase = Math.max(calculatedBase, baseRule.rates.minimumCharge || 0);
    
    let internalPartnerCost = baseRule.rates.partnerCost + (chargeableWeight * (baseRule.rates.partnerCost > 0 ? 2 : 0)); // mock scaling of partner cost
    let internalRiderCost = baseRule.rates.riderCost;
    let totalHandlingCost = baseRule.rates.handlingCost;

    let subtotal = priceBase + totalHandlingCost;

    // 5. Apply Surcharges
    const surchargeCandidates = activeRules.filter(r => r.isSurcharge);
    let totalSurcharges = 0;

    for (const rule of surchargeCandidates) {
      let apply = false;
      
      // Speed Surcharge (e.g. Express)
      if (rule.speed === speed && speed !== 'Any' && speed !== 'Standard') apply = true;
      
      // Category Surcharge (e.g. Fragile)
      if (rule.conditions.category === category) apply = true;

      if (apply) {
        appliedRules.push(rule.ruleName);
        let surchargeAmount = rule.rates.basePrice + (chargeableWeight * rule.rates.perKgRate);
        subtotal += surchargeAmount;
        totalSurcharges += surchargeAmount;
        
        internalPartnerCost += rule.rates.partnerCost || 0;
        internalRiderCost += rule.rates.riderCost || 0;
        totalHandlingCost += rule.rates.handlingCost || 0;
      }
    }

    // 6. Insurance & Discounts
    const insuranceCost = (parcelValue * (baseRule.rates.insurancePercentage / 100));
    const discountAmount = subtotal * (baseRule.rates.discountPercentage / 100);
    const taxableAmount = subtotal - discountAmount + insuranceCost;

    // 7. Margin / Internal Cost vs Selling Price
    const internalCost = internalPartnerCost + internalRiderCost + totalHandlingCost;
    const profitMargin = (subtotal - discountAmount) - internalCost;

    // 8. Tax (GST)
    const gstAmount = taxableAmount * (baseRule.rates.gstPercentage / 100);
    const totalCustomerPrice = taxableAmount + gstAmount;

    res.status(200).json({
      success: true,
      data: {
        movementType,
        chargeableWeight: parseFloat(chargeableWeight.toFixed(2)),
        actualWeight,
        distanceKm: calcDistance,
        volumetricWeight: parseFloat(volWeight.toFixed(2)),
        breakdown: {
          baseCost: parseFloat(priceBase.toFixed(2)),
          handlingFee: parseFloat(totalHandlingCost.toFixed(2)),
          surcharges: parseFloat(totalSurcharges.toFixed(2)),
          insurance: parseFloat(insuranceCost.toFixed(2)),
          discount: parseFloat(discountAmount.toFixed(2)),
          subtotal: parseFloat(taxableAmount.toFixed(2)),
          gst: parseFloat(gstAmount.toFixed(2)),
          totalCustomerPrice: Math.round(totalCustomerPrice),
        },
        profitability: {
          partnerCost: parseFloat(internalPartnerCost.toFixed(2)),
          riderCost: parseFloat(internalRiderCost.toFixed(2)),
          totalInternalCost: parseFloat(internalCost.toFixed(2)),
          grossMargin: parseFloat(profitMargin.toFixed(2)),
          marginPercentage: parseFloat(((profitMargin / (subtotal - discountAmount)) * 100).toFixed(1)) || 0,
          expectedMarginPercentage: baseRule.rates.marginPercentage
        },
        appliedRules
      }
    });

  } catch (err) {
    console.error('[Pricing Engine]', err.message);
    res.status(500).json({ success: false, error: 'Pricing calculation failed.' });
  }
};
