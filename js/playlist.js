// playlist.js
import { makeRequest } from './spotifyApi.js';

async function createPlaylist(accessToken, userId, playlistName) {
    const response = await makeRequest('POST', `https://api.spotify.com/v1/users/${userId}/playlists`, accessToken, {
        name: playlistName
    });
    return response;
}

async function addTracksToPlaylist(accessToken, playlistId, trackUris) {
    const response = await makeRequest('POST', `https://api.spotify.com/v1/playlists/${playlistId}/tracks`, accessToken, {
        uris: trackUris
    });
    return response;
}

export { createPlaylist, addTracksToPlaylist };
