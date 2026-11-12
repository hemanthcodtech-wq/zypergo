const express = require('express');
const router = express.Router();
const riderController = require('../controllers/riderController');

router.get('/nearby', riderController.getNearbyCaptains);
router.get('/jobs', riderController.getAvailableJobs);
router.post('/jobs/:id/accept', riderController.acceptJob);
router.post('/jobs/:id/update-status', riderController.updateJobStatus);
router.post('/jobs/:id/transhipment', riderController.handleTranshipment);
router.post('/jobs/:id/accept-handover', riderController.acceptHandover);

router.post('/jobs/:id/verify-otp', riderController.verifyOtp);
router.post('/shift', riderController.updateShift);
router.post('/location', riderController.updateLocation);
router.post('/onboard', riderController.onboardRider);
router.post('/withdraw', riderController.withdrawEarnings);
router.get('/helpers', riderController.getMyHelpers);
router.post('/helpers', riderController.addHelper);
router.get('/me', riderController.getMe);
router.get('/history', riderController.getHistory);

module.exports = router;
