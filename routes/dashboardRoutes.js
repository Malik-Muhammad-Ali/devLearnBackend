const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');

// Protected dashboard routes
router.get('/stats', getDashboardStats);

module.exports = router;
