const express = require('express');
const router = express.Router();
const pc = require('../controllers/pricingController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { logAction } = require('../middleware/auditMiddleware');

// Public route for Customer App (unprotected)
router.get('/public-vehicles', pc.getVehiclePricingPublic);

router.use(protect);

const ADMIN_ROLES = ['SuperAdmin', 'OperationsAdmin', 'FinanceManager'];

// Dynamic Vehicle Per-KM Pricing management
router.get('/vehicles', authorize(...ADMIN_ROLES), pc.getVehiclePricing);
router.put('/vehicles/:id', authorize(...ADMIN_ROLES), logAction('VehicleConfig'), pc.updateVehiclePricing);

// Rules
router.get('/rules', authorize(...ADMIN_ROLES), pc.getRules);
router.post('/rules', authorize(...ADMIN_ROLES), logAction('PricingRule'), pc.createRule);
router.put('/rules/:id', authorize(...ADMIN_ROLES), logAction('PricingRule'), pc.updateRule);
router.delete('/rules/:id', authorize(...ADMIN_ROLES), logAction('PricingRule'), pc.deleteRule);

// Calculation / Simulation engine
router.post('/calculate', authorize(...ADMIN_ROLES, 'HubManager', 'DispatchManager'), pc.calculatePrice);
router.post('/preview', authorize(...ADMIN_ROLES), pc.calculatePrice); // Same logic, used by Simulator

module.exports = router;
