var SpotifyWebApi = require('spotify-web-api-node');



exports.requestToken = reqbody => {
  // credentials are optional
  var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  });
  return spotifyApi.authorizationCodeGrant(reqbody.code).then(
    data => {
      // Set the access token and refresh token
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);

      // Save the amount of seconds until the access token expired
      tokenExpirationEpoch =
        new Date().getTime() / 1000 + data.body['expires_in'];
      console.log(
        'Retrieved token. It expires in ' +
        Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
        ' seconds!'
      );
      return data.body;
    },
    err => {
      console.log(
        'Something went wrong when retrieving the access token!',
        err.message
      );
      return err;
    }
  );
};
