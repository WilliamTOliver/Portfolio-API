const express = require('express');
const router = express.Router();

const ChartService = require('../services/chart');
const checkAuth = require('../middleware/check-auth');

router.get('/build', ChartService.buildCharts);


module.exports = router;
