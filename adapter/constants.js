exports.urls = {
    spotify: {
        requestToken: 'https://accounts.spotify.com/api/token',
    }
}
exports.translatedRefactorBy = {
    year: {
        path: 'track.year',
        isRange: false
    },
    key: {
        path: 'features.key',
        isRange: false
    },
    popularity: {
        path: 'track.popularity',
        isRange: true
    },
    energy: {
        path: 'features.energy',
        isRange: true
    },
    mood: {
        path: 'features.valence',
        isRange: true
    },
    acousticness: {
        path: 'features.acousticness',
        isRange: true
    },
    instrumentalness: {
        path: 'features.instrumentalness',
        isRange: true
    },
    tempo: {
        path: 'features.tempo',
        isRange: true
    },
    time_signature: {
        path: 'features.time_signature',
        isRange: false
    },
    danceability: {
        path: 'features.danceability',
        isRange: true
    }
}