const express = require('express');
const router = express.Router();

const EventService = require('../services/event');

router.get('/populate', EventService.populateEvents);


module.exports = router;
