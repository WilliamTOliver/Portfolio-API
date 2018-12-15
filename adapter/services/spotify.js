var SpotifyWebApi = require('spotify-web-api-node');

function createSpotifyApi() {
  // https://github.com/thelinmichael/spotify-web-api-node
  return spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  });
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
				console.log("​err", err)
				console.log("​reqbody.spotifyAuth", reqbody.spotifyAuth)
        if (reqbody.spotifyAuth) {
        // If request sent by valid user whose session has simply expired
        spotifyApi.setAccessToken(reqbody.spotifyAuth['access_token']);
        spotifyApi.setRefreshToken(reqbody.spotifyAuth['refresh_token']);
        spotifyApi.refreshAccessToken().then(
          function (data) {
            tokenExpirationEpoch =
              new Date().getTime() / 1000 + data['expires_in'];
            console.log(
              'Refreshed token. It now expires in ' +
              Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) +
              ' seconds!'
            );
            return data.body;
          },
          function (err) {
            console.log('Could not refresh the token!', err.message);
            return err;

          });

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
  return spotifyApi
  .authorizationCodeGrant(token)
  .then(function(data) {
    console.log('Retrieved access token', data.body['access_token']);

    // Set the access token
    spotifyApi.setAccessToken(data.body['access_token']);

    // Use the access token to retrieve information about the user connected to it
    return spotifyApi.getMe();
  })
  .then(function(data) {
    // "Retrieved data for Faruk Sahin"
    console.log('Retrieved data for ' + data.body['display_name']);

    // "Email is farukemresahin@gmail.com"
    console.log('Email is ' + data.body.email);

    // "Image URL is http://media.giphy.com/media/Aab07O5PYOmQ/giphy.gif"
    console.log('Image URL is ' + data.body.images[0].url);

    // "This user has a premium account"
    console.log('This user has a ' + data.body.product + ' account');
  })
  .catch(function(err) {
    console.log('Something went wrong', err.message);
  });

}

exports.getUserPlaylists = token => {
  var spotifyApi = createSpotifyApi();
  spotifyApi.getUserPlaylists()

}

exports.search = reqbody => {
  var spotifyApi = createSpotifyApi();

}