const express = require('express'),
  app = express(),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  mongoose = require('mongoose'),
  authRoutes = require('./adapter/controllers/auth'),
  chartRoutes = require('./adapter/controllers/chart'),
  spotifyRoutes = require('./adapter/controllers/spotify'),
  dotenvresult = require('dotenv').config(),
  url = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${
    process.env.DB_HOST
  }`;
  localUrl = `mongodb://${process.env.DB_HOST_LOCAL}`;

if (dotenvresult.error) {
  throw dotenvresult.error;
} else {
  // console.log(dotenvresult.parsed)
}

// REMOTE CONNECTION
// mongoose.connect(url);
// LOCAL CONNECTION
mongoose.connect(localUrl);
mongoose.Promise = global.Promise;
console.log('DB Connection Established at ' + localUrl)

app.use(morgan('dev'));
app.use('/uploads', express.static('uploads'));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
    return res.status(200).json({});
  }
  next();
});
// Routes
app.use('/auth', authRoutes);
app.use('/chart', chartRoutes);
app.use('/spotify', spotifyRoutes);

app.use((req, res, next) => {
  const error = new Error('Not found');
  error.status = 404;
  next(error);
});

app.use((error, req, res, next) => {
  res.status(error.status || 500);
  res.json({
    error: {
      message: error.message
    }
  });
});

module.exports = app;
