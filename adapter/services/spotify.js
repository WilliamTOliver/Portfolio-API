const SpotifyWebApi = require('spotify-web-api-node');
const _ = require('lodash');

const constants = require('./../constants');

// PUBLIC

// AUTH
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

// USER
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
    .getUserPlaylists({
      limit: 50
    })
    .then(function (data) {
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

// PLAYLIST
exports.createPlaylist = async (body, token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  try {
    const user = await spotifyApi.getMe();
    const createdPlaylist = await spotifyApi.createPlaylist(user.body.id, body.name);
    return await addTracksToPlaylist(spotifyApi, body.tracks, createdPlaylist.body.id);
  } catch (e) {
    console.log('error occurred in creating a playlist -> ', e);
  }
};

exports.unfollowPlaylist = (id, token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return spotifyApi.unfollowPlaylist(id);
}

exports.unfollowPlaylists = (ids, token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return Promise.all(ids.map(id => spotifyApi.unfollowPlaylist(id)));
}

exports.followPlaylists = (ids, token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return Promise.all(ids.map(id => spotifyApi.followPlaylist(id)));
}

exports.getPlaylistTracks = async (id, token) => {
  const spotifyApi = createSpotifyApi();
  spotifyApi.setAccessToken(token);
  return await getTracksForPlaylist(id, spotifyApi);
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
    const user = await spotifyApi.getMe();
    switch (body.method) {
      case 'split':
        /**
         * Creates A Set of New Playlists grouped by body.by
         * (if year, playlist will be split into new playlists based on year added ->
         * MyPlaylist gets cloned into MyPlaylist 2018, MyPlaylist 2019...)
         * More fine tuned 'isRange' values will be cloned into two playlists with higher and lower values ex: dandability
         */
        playlistNameRoot = body.playlistName + ' Split-By ' + body.by;
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
        const resolved = [];
        trackURISets.map((groupedPlaylist, index) => {
          const newPlaylistName = playlistNameRoot + ' ' + uniqueGroupByKeys[index];
          resolved.push(
            spotifyApi
            .createPlaylist(user.body.id, newPlaylistName)
            .then(async (playlist) => {
              try {
                return await addTracksToPlaylist(spotifyApi, groupedPlaylist, playlist.body.id);
              } catch (e) {
                console.log('error occurred in refactor-split -> e', e);
              }
            })
            .catch(console.log)
          );
        });
        return Promise.all(resolved);
        break;
      case 'reorder':
        /**
         * Creates A New Playlist Reordered by body.by
         */
        playlistNameRoot = body.playlistName + ' Reordered-By ' + body.by;
        const sortBy = constants.translatedRefactorBy[body.by].path;
        const sortedTrackUris = _.sortBy(tracksWithFeatures, value => {
          return _.get(value, sortBy);
        }).map((obj) => obj.track.uri);
        try {
          const playlist = await spotifyApi.createPlaylist(user.body.id, playlistNameRoot);
          return addTracksToPlaylist(spotifyApi, sortedTrackUris, playlist.body.id);
        } catch (e) {
          console.log('error occurred in refactor-reorder -> e ', e);
        }
        break;
      default:
        // Simple Split
        playlistNameRoot = body.playlistName + ' Simple Split';
        const simpleSplitTrackSets = {};
        let i,
          j,
          chunkOTracks,
          chunkSize = Math.ceil(tracksWithFeatures.length / 2);
        for (i = 0, j = tracksWithFeatures.length; i < j; i += chunkSize) {
          chunkOTracks = tracksWithFeatures.slice(i, i + chunkSize);
          const trackSetKey = i === 0 ? 'A' : 'B';
          simpleSplitTrackSets[trackSetKey] = chunkOTracks;
        }
        const uniqueGroupByKeys = Object.keys(simpleSplitTrackSets);
        const trackURISets = uniqueGroupByKeys.map((key) => simpleSplitTrackSets[key].map((obj) => obj.track.uri));
        const resolved = [];
        trackURISets.map((groupedPlaylist, index) => {
          const newPlaylistName = playlistNameRoot + ' ' + uniqueGroupByKeys[index];
          resolved.push(
            spotifyApi
            .createPlaylist(user.body.id, newPlaylistName)
            .then(async (playlist) => {
              try {
                return await addTracksToPlaylist(spotifyApi, groupedPlaylist, playlist.body.id);
              } catch (e) {
                console.log('error occurred in refactor-split -> e', e);
              }
            })
            .catch(console.log)
          );
        });
        return Promise.all(resolved);
        break;
    }
  } catch (e) {
    console.log(e);
  }
};



// PRIVATE
/**
 * @description creates spotify api instance based on environment variables
 * @returns {SpotifyApi} SpotifyApi instance
 */
function createSpotifyApi() {
  // https://github.com/thelinmichael/spotify-web-api-node
  return new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENT,
    clientSecret: process.env.SPOTIFY_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT
  });
}

// FORMATTING
/**
 * @description Strips larger track objects to only values required by UI/other API use cases.
 * @param {*[]} items
 * @returns {{id: string, uri: string, name: string, album: string, artist: string, added_at: string, popularity: number}}
 */
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

// REUSED SPOTIFYAPI CALL USECASES
/**
 * @description fetches all tracks for given playlistid
 * @param {string} id playlist id
 * @param {SpotifyApi} spotifyApi
 * @returns {*[]} tracks array
 */
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
      // bump offset and keep fetching tracks
      // (next value is just the uri created by getPlaylistTracks with the adjusted offset listed below)
      offset = offset + 100;
    } else {
      done = true;
      return alltracks;
    }
  }
}
/**
 * @description gets aduio features for each track in trackIds array,
 * chunks calls if called with more than 100 trackIds
 * @param {string[]} trackIds
 * @param {SpotifyApi} spotifyApi
 * @returns {*[]} audio_features array in matching order to trackIds
 */
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
/**
 * @description assuming an already existing playlist, adds tracks to said playlist,
 * chunking out the requests to a max trackarray size of 100 if passed more than 100 tracks
 * @param {SpotifyApi} spotifyApi
 * @param {string[]} tracks array of track URIs
 * @param {string} playlistId
 * @returns {Promise<*>} add track response
 */
async function addTracksToPlaylist(spotifyApi, tracks, playlistId) {
  if (tracks.length <= 100) {
    return spotifyApi.addTracksToPlaylist(playlistId, tracks);
  } else {
    let i,
      j,
      chunkOTracks,
      chunkSize = 100,
      allResolved = [];
    for (i = 0, j = tracks.length; i < j; i += chunkSize) {
      chunkOTracks = tracks.slice(i, i + chunkSize);
      allResolved.push(spotifyApi.addTracksToPlaylist(playlistId, chunkOTracks));
      if (allResolved.length === Math.ceil(tracks / chunkSize)) {
        return Promise.all(allResolved);
      }
    }
  }
}