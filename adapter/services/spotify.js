var SpotifyWebApi = require('spotify-web-api-node');

function createSpotifyApi() {
  // https://github.com/thelinmichael/spotify-web-api-node
  return (spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  }));
}

exports.requestToken = reqbody => {
  // credentials are optional
  var spotifyApi = createSpotifyApi();
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
      console.log('​reqbody.spotifyAuth', reqbody.spotifyAuth);
      if (reqbody.spotifyAuth) {
        // If request sent by valid user whose session has simply expired
        spotifyApi.setAccessToken(reqbody.spotifyAuth['access_token']);
        spotifyApi.setRefreshToken(reqbody.spotifyAuth['refresh_token']);
        spotifyApi.refreshAccessToken().then(
          function(data) {
            tokenExpirationEpoch =
              new Date().getTime() / 1000 + data['expires_in'];
            console.log(
              'Refreshed token. It now expires in ' +
                Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
                ' seconds!'
            );
            return data.body;
          },
          function(err) {
            console.log('Could not refresh the token!', err.message);
            return err;
          }
        );
      } else {
        // Possibly maliscious request ~ should never reach this in normal flow
        console.log(
          'Potentially Maliscious Request: Something went wrong when retrieving the access token!',
          err.message
        );
        return err;
      }
    }
  );
};

exports.getUserInfo = token => {
  var spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  // Use the access token to retrieve information about the user connected to it
  return spotifyApi
    .getMe()
    .then(function(data) {
      return data.body;
    })
    .catch(function(err) {
      console.log('Something went wrong', err.message);
    });
};

exports.getUserPlaylists = token => {
  var spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);

  return spotifyApi.getUserPlaylists()
  .then(function(data) {
    return data.body;
  })
  .catch(function(err) {
    console.log('Something went wrong', err.message);
  });
};

exports.search = reqbody => {
  var spotifyApi = createSpotifyApi();
};
