const bcrypt = require('bcrypt'),
  jwt = require('jsonwebtoken'),
  userService = require('./user'),
  responseHelper = require('./helpers/responseHelper');

exports.signup = (req, res) => {
  userService.findByEmail(req.body.email)
    .then(matchingUsers => {
      if (matchingUsers.length >= 1) {
        responseHelper.error(res, 409, 'That Email is Already Taken');
      } else {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          if (err) {
            responseHelper.error(res);
          } else {
            userService.create(req.body, hash)
              .then(result => {
                responseHelper.success(res, 201);
              })
              .catch(err => {
                responseHelper.error(res, message = 'That Email is Already Taken');
              });
          }
        });
      }
    }).catch((err) => {
      responseHelper.error(res);
    });
};

exports.login = (req, res) => {
  userService.findByEmail(req.body.email)
    .then(matchingUsers => {
      if (matchingUsers.length !== 1) {
        responseHelper.error(res, 401);
      }
      bcrypt.compare(req.body.password, matchingUsers[0].password, (err, result) => {
        if (err) {
          responseHelper.error(res, 401);
        }
        if (result) {
          const token = jwt.sign(
            {
              email: matchingUsers[0].email,
              userId: matchingUsers[0]._id
            },
            process.env.JWT_KEY,
            {
              expiresIn: '1h'
            }
          );
          responseHelper.success(res, 200, { message: 'Authentication Successful', token });
        }
        responseHelper.error(res, 401);
      });
    })
    .catch(err => {
      responseHelper.error(res);
    });
};

exports.delete = (req, res) => {
  userService.delete(req.params.userId)
    .then(result => {
      responseHelper.success(res, 200);
    })
    .catch(err => {
      responseHelper.success(res, 200);
    });
};
