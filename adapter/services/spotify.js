const SpotifyWebApi = require('spotify-web-api-node');
const _ = require('lodash');

const constants = require('./../constants')

// Public Methods
exports.requestToken = reqbody => {
  const spotifyApi = createSpotifyApi();
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
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  // Use the access token to retrieve information about the user connected to it
  return spotifyApi
    .getMe()
    .then(function (data) {
      return data.body;
    })
    .catch(function (err) {
      console.log('Something went wrong', err.message);
    });
};

exports.getUserPlaylists = token => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return spotifyApi
    .getUserPlaylists()
    .then(function (data) {
      console.log(data.body.items);
      return data.body.items.map(playlist => {
        return {
          id: playlist.id,
          image: playlist.images &&
            playlist.images.length > 0 &&
            playlist.images[0].url,
          name: playlist.name,
          numTracks: playlist.tracks.total
        };
      });
    })
    .catch(function (err) {
      console.log('Something went wrong', err.message);
    });
};
exports.refactorBy = async (id, token, body) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  try {
    const tracks = await getTracksForPlaylist(id, spotifyApi);
    const trackIds = tracks.map(track => track.id);
    const features = await getTracksFeatures(trackIds, spotifyApi);
    const tracksWithFeatures = tracks.map((track, i) => {
      track.year = track.added_at ? track.added_at.slice(0, 4) : '';
      return {
        track,
        features: features.audio_features[i]
      };
    });
    let playlistNameRoot;
    switch (body.method) {
      case 'split':
        const user = await spotifyApi.getMe()
        playlistNameRoot = body.playlistName + ' ~ Split-By ' + body.by;
        const resolved = [];
        const groupBy = constants.translatedGroupByPaths[body.by];
        const groupedTrackSets = _.groupBy(tracksWithFeatures, (value) => {
          return _.get(value, groupBy);
        });
        const uniqueGroupByValues = Object.keys(groupedTrackSets);
        const trackURISets = uniqueGroupByValues
          .map(key => groupedTrackSets[key]
            .map(obj => obj.track.uri));
        trackURISets
          .map((groupedPlaylist, index) => {
            const newPlaylistName = playlistNameRoot + index;
            resolved.push(spotifyApi.createPlaylist(user.body.id, newPlaylistName).then(async (playlist) => {
              try {
                console.log(groupedPlaylist.length)
                return await spotifyApi.addTracksToPlaylist(playlist.body.id, groupedPlaylist);
              } catch (e) {
                console.log("catch -> e", e)
                return e;
              }
            }));
          });
        return await Promise.all(resolved);
        break;
      case 'reorder':
        playlistNameRoot = body.playlistName + ' ~ Reordered-By ' + body.by;
        const sortedTrackIds = _.sortBy(tracksWithFeatures, body.by)
          .map(track => track.id);
        return spotifyApi.createPlaylist(body.userId, playlistNameRoot).then(playlist => {
          return spotifyApi.addTracksToPlaylist(playlist.id, sortedTrackIds).then(response => {
            return response;
          });
        });
        break;
      default:
        // No passed in method, only options are opinionated(smart) or simple numerical split;
        switch (body.by) {
          case 'smart':
            console.log('wip')
            break;
          case 'simple':
            console.log('wip')
            break;
        }
        break;
    }
  } catch (e) {
    console.log(e);
  }


};
exports.getPlaylistTracks = async (id, token, offset) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return await getTracksForPlaylist(id, spotifyApi);
};

// PRIVATE FUNCTIONS
function createSpotifyApi() {
  // https://github.com/thelinmichael/spotify-web-api-node
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  });
}

function formatTracks(items) {
  return items.map(item => {
    const artistsNames = item.track.artists.map(artist => artist.name);
    return {
      id: item.track.id,
      uri: item.track.uri,
      name: item.track.name,
      album: item.track.album.name,
      artist: artistsNames.length > 1 ? artistsNames.join(', ') : artistsNames[0],
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