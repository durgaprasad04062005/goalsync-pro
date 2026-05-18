const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { generateCSVReport, generateExcelReport, getAnalyticsDashboard } = require('../controllers/reportController');

const router = express.Router();

router.use(authenticate);

router.get('/csv', generateCSVReport);
router.get('/excel', generateExcelReport);
router.get('/analytics', authorize('manager', 'admin'), getAnalyticsDashboard);

module.exports = router;
