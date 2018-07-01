const express = require('express');
const router = express.Router();

const ConfigService = require('../services/config');

router.get('/', ConfigService.getConfig);


module.exports = router;
