const express = require('express');
const router = express.Router();

const SpotifyService = require('../services/spotify');
const checkAuth = require('../middleware/check-auth');
const responseHelper = require('./../services/helpers/responseHelper');

router.post('/token', checkAuth, (req, res) => {
  SpotifyService.requestToken(req.body)
    .then(data => responseHelper.success(res, 200, data))
    .catch(err => responseHelper.error());
});

module.exports = router;
