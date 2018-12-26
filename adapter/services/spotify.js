var SpotifyWebApi = require('spotify-web-api-node');

function createSpotifyApi() {
  // https://github.com/thelinmichael/spotify-web-api-node
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  });
}
createSpotifyApi();
exports.requestToken = reqbody => {
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
  return spotifyApi
    .getUserPlaylists()
    .then(function(data) {
      console.log(data.body.items);
      return data.body.items.map(playlist => {
        return {
          id: playlist.id,
          image:
            playlist.images &&
            playlist.images.length > 0 &&
            playlist.images[0].url,
          name: playlist.name,
          numTracks: playlist.tracks.total
        };
      });
    })
    .catch(function(err) {
      console.log('Something went wrong', err.message);
    });
};
exports.refactorBy = async (id, token, refactorby) => {
  var spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  try {
    const tracks = await getTracksForPlaylist(id, spotifyApi);
    const trackIds = tracks.map(track => track.id);
    const features = await getTracksFeatures(trackIds, spotifyApi);
		console.log("​exports.refactorBy -> features", features)
    const tracksWithFeatures = tracks.map((track, i) => {
      return { track, features: features.audio_features[i] };
    });
    console.log(
      '​exports.refactorBy -> tracksWithFeatures',
      tracksWithFeatures
    );
  } catch (e) {
    console.log(e);
  }

  switch (refactorby) {
    case 'year':
      console.log('refactoryby year');
      break;
    case 'popularity':
      break;
    default:
      break;
  }
};
exports.getPlaylistTracks = async (id, token, offset) => {
  var spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return await getTracksForPlaylist(id, spotifyApi);
};

function formatTracks(items) {
  return items.map(item => {
    const artistsNames = item.track.artists.map(artist => artist.name);
    return {
      id: item.track.id,
      name: item.track.name,
      album: item.track.album.name,
      artist:
        artistsNames.length > 1 ? artistsNames.join(', ') : artistsNames[0],
      added_at: item.added_at,
      popularity: item.track.popularity
    };
  });
}

async function getTracksForPlaylist(id, spotifyApi) {
  let done = false,
    offset = 0,
    alltracks = [];
  while (!done) {
    const response = await spotifyApi.getPlaylistTracks(id, {
      offset
    });

    alltracks = alltracks.concat(formatTracks(response.body.items));
    if (response.body.next !== null) {
      offset = offset + 100;
    } else {
      done = true;
      return alltracks;
    }
  }
}
async function getTracksFeatures(trackIds, spotifyApi) {
  const response = await spotifyApi.getAudioFeaturesForTracks(trackIds);
  return response.body;
}
