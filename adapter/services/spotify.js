const SpotifyWebApi = require('spotify-web-api-node');
const _ = require('lodash');

const constants = require('./../constants');

// Public Methods
exports.requestToken = (reqbody) => {
  const spotifyApi = createSpotifyApi();
  return spotifyApi.authorizationCodeGrant(reqbody.code).then(
    (data) => {
      // Set the access token and refresh token
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
      // Save the amount of seconds until the access token expired
      tokenExpirationEpoch = new Date().getTime() / 1000 + data.body['expires_in'];
      console.log(
        'Retrieved token. It expires in ' + Math.floor(tokenExpirationEpoch - new Date().getTime() / 1000) + ' seconds!'
      );
      return data.body;
    },
    (err) => {
      console.log('​reqbody.spotifyAuth', reqbody.spotifyAuth);
      if (reqbody.spotifyAuth) {
        // If request sent by valid user whose session has simply expired
        spotifyApi.setAccessToken(reqbody.spotifyAuth['access_token']);
        spotifyApi.setRefreshToken(reqbody.spotifyAuth['refresh_token']);
        spotifyApi.refreshAccessToken().then(
          function (data) {
            tokenExpirationEpoch = new Date().getTime() / 1000 + data['expires_in'];
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

exports.getUserInfo = (token) => {
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

exports.getUserPlaylists = (token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return spotifyApi
    .getUserPlaylists()
    .then(function (data) {
      console.log(data.body.items);
      return data.body.items.map((playlist) => {
        return {
          id: playlist.id,
          image: playlist.images && playlist.images.length > 0 && playlist.images[0].url,
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
    const trackIds = tracks.map((track) => track.id);
    const features = await getTracksFeatures(trackIds, spotifyApi);
    const tracksWithFeatures = tracks.map((track, i) => {
      track.year = track.added_at ? track.added_at.slice(0, 4) : '';
      return {
        track,
        features: features[i]
      };
    });
    let playlistNameRoot;
    switch (body.method) {
      case 'split':
        const user = await spotifyApi.getMe();
        playlistNameRoot = body.playlistName + ' Split-By ' + body.by;
        const resolved = [];
        const groupBy = constants.translatedRefactorBy[body.by].path;
        const isRange = constants.translatedRefactorBy[body.by].isRange;
        let groupedTrackSets;
        if (isRange) {
          groupedTrackSets = {};
          const sortedTracks = _.sortBy(tracksWithFeatures, function (value) {
            return _.get(value, groupBy);
          });
          let i,
            j,
            chunkOTracks,
            chunkSize = Math.ceil(sortedTracks.length / 2);
          for (i = 0, j = sortedTracks.length; i < j; i += chunkSize) {
            chunkOTracks = sortedTracks.slice(i, i + chunkSize);
            const trackSetKey = i === 0 ? 'lower' : 'higher';
            groupedTrackSets[trackSetKey] = chunkOTracks;
          }

        } else {
          groupedTrackSets = _.groupBy(tracksWithFeatures, (value) => {
            return _.get(value, groupBy);
          });
        }

        const uniqueGroupByKeys = Object.keys(groupedTrackSets);
        const trackURISets = uniqueGroupByKeys.map((key) => groupedTrackSets[key].map((obj) => obj.track.uri));
        trackURISets.map((groupedPlaylist, index) => {
          const newPlaylistName = playlistNameRoot + ' ' + uniqueGroupByKeys[index];
          resolved.push(
            spotifyApi
            .createPlaylist(user.body.id, newPlaylistName)
            .then(async (playlist) => {
              try {
                if (groupedPlaylist.length <= 100) {
                  return spotifyApi.addTracksToPlaylist(playlist.body.id, groupedPlaylist);
                } else {
                  let i,
                    j,
                    chunkOTracks,
                    chunkSize = 100,
                    allResolved = [];
                  for (i = 0, j = groupedPlaylist.length; i < j; i += chunkSize) {
                    chunkOTracks = groupedPlaylist.slice(i, i + chunkSize);
                    allResolved.push(spotifyApi.addTracksToPlaylist(playlist.body.id, chunkOTracks));
                    if (allResolved.length === Math.ceil(groupedPlaylist / chunkSize)) {
                      return Promise.all(allResolved);
                    }
                  }
                }
              } catch (e) {
                console.log('When either creating playlist or adding tracks to said playlist -> e', e);
              }
            })
            .catch(console.log)
          );
        });
        return Promise.all(resolved);
        break;
      case 'reorder':
        playlistNameRoot = body.playlistName + ' Reordered-By ' + body.by;
        const sortBy = constants.translatedRefactorBy[body.by].path;
        const sortedTrackUris = _.sortBy(tracksWithFeatures, value => {
          return _.get(value, sortBy);
        }).map((obj) => obj.track.uri);
        return spotifyApi.createPlaylist(body.userId, playlistNameRoot).then((playlist) => {
          if (sortedTrackUris.length <= 100) {
            return spotifyApi.addTracksToPlaylist(playlist.body.id, sortedTrackUris);
          } else {
            let i,
              j,
              chunkOTracks,
              chunkSize = 100,
              allResolved = [];
            for (i = 0, j = sortedTrackUris.length; i < j; i += chunkSize) {
              chunkOTracks = sortedTrackUris.slice(i, i + chunkSize);
              allResolved.push(spotifyApi.addTracksToPlaylist(playlist.body.id, chunkOTracks));
              if (allResolved.length === Math.ceil(sortedTrackUris / chunkSize)) {
                return Promise.all(allResolved);
              }
            }
          }
        });
        break;
      default:
        // No passed in method, only options are opinionated(smart) or simple numerical split;
        switch (body.by) {
          case 'smart':
            console.log('wip');
            break;
          case 'simple':
            console.log('wip');
            break;
        }
        break;
    }
  } catch (e) {
    console.log(e);
  }
};
exports.getPlaylistTracks = async (id, token) => {
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
  return items.map((item) => {
    const artistsNames = item.track.artists.map((artist) => artist.name);
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
  if (trackIds.length <= 100) {
    const response = await spotifyApi.getAudioFeaturesForTracks(trackIds);
    return response.body.audio_features;
  } else {
    let i,
      j,
      chunkOTracks,
      chunkSize = 100,
      allTracksWithFeatures = [];
    for (i = 0, j = trackIds.length; i < j; i += chunkSize) {
      chunkOTracks = trackIds.slice(i, i + chunkSize);
      try {
        const response = await spotifyApi.getAudioFeaturesForTracks(chunkOTracks);
        allTracksWithFeatures = allTracksWithFeatures.concat(response.body.audio_features);
        if (allTracksWithFeatures.length === trackIds.length) {
          return allTracksWithFeatures;
        }
      } catch (e) {
        console.log('Error occurred in getTracksFeatures', e);
      }
    }
  }
}