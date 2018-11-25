const express = require('express');
const router = express.Router();

const AuthService = require('../services/auth');
const checkAuth = require('../middleware/check-auth');

// Direct Check Auth
router.get('/', checkAuth, (req, res) => {
  res.status(200).json({message: 'Authorized', userDetails: req.userData})
});

router.post('/signup', AuthService.signup);

router.post('/login', AuthService.login);

router.delete('/:userId', checkAuth, AuthService.delete);

module.exports = router;
