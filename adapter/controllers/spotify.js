const express = require('express');
const router = express.Router();

const SpotifyService = require('../services/spotify');
const checkAuth = require('../middleware/check-auth');
const responseHelper = require('./../services/helpers/responseHelper');
const SpotifyAuthHeader = 'X-Spotify-Auth';
router.post('/token', checkAuth, (req, res) => {
  SpotifyService.requestToken(req.body)
    .then(data => responseHelper.success(res, 200, data))
    .catch(err => responseHelper.error());
});
router.get('/user', checkAuth, (req, res) => {
  SpotifyService.getUserInfo(req.get(SpotifyAuthHeader))
    .then(data => responseHelper.success(res, 200, data))
    .catch(err => responseHelper.error());
});
router.get('/user/playlists', checkAuth, (req, res) => {
  SpotifyService.getUserPlaylists(req.get(SpotifyAuthHeader))
    .then(data => responseHelper.success(res, 200, data))
    .catch(err => responseHelper.error());
});
router.get('/playlist/:id/tracks', checkAuth, (req, res) => {
  SpotifyService.getPlaylistTracks(req.params.id, req.get(SpotifyAuthHeader))
    .then(data => responseHelper.success(res, 200, data))
    .catch(err => responseHelper.error());
});

module.exports = router;
