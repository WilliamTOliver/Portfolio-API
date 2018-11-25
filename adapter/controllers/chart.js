const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');

const ChartService = require('../services/chart');

router.get('/build', checkAuth, ChartService.buildCharts);
router.get('/', checkAuth, ChartService.getCharts);


module.exports = router;
