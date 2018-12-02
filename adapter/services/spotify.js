const fetch = require('node-fetch'),
  constants = require('./../constants');
function hasData(data) {
  // null check
  console.log(
    '​hasData -> process.env.SPOTIFY_CLIENT',
    process.env.SPOTIFY_CLIENT
  );
  console.log(
    '​hasData -> process.env.SPOTIFY_SECRET',
    process.env.SPOTIFY_SECRET
  );
  return (
    data.redirect_uri &&
    data.code &&
    process.env.SPOTIFY_CLIENT &&
    process.env.SPOTIFY_SECRET
  );
}

exports.requestToken = data => {
  if (hasData(data)) {
    const body = data,
      method = 'POST';
    body.grant_type = 'authorization_code';
    const BasicAuth = `${process.env.SPOTIFY_CLIENT}:${
        process.env.SPOTIFY_SECRET
      }`,
      buff = new Buffer(BasicAuth),
      Authorization = `Basic ${buff.toString('base64')}`,
      headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization
      };
    console.log({ body, method, headers });
    return fetch(constants.urls.spotify.requestToken, {
      body,
      method,
      headers,
    }).then(data => {
      console.log('​data', data);
    });
  }
};
