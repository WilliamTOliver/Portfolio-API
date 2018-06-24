const express = require('express');
const router = express.Router();

const ChartService = require('../services/chart');

router.post('/', ChartService.signup);
router.get('/:chartId', ChartService.signup);


module.exports = router;
