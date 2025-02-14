// main.js
import { getAuthURL, getAccessToken } from './auth.js';
import { createPlaylist, addTracksToPlaylist } from './playlist.js';

async function main() {
    // Étape 1: Obtenir l'URL d'authentification
    const authURL = getAuthURL();
    console.log('Authenticate here:', authURL);

    // Étape 2: Récupérer le code d'autorisation (à faire manuellement pour l'instant)
    const authCode = prompt('Enter the code from the URL:');

    // Étape 3: Obtenir le token d'accès
    const accessToken = await getAccessToken(authCode);
    console.log('Access Token:', accessToken);

    // Étape 4: Créer une playlist
    const userId = 'votre_user_id'; // Remplacez par votre user ID Spotify
    const playlistName = 'Ma Super Playlist';
    const playlist = await createPlaylist(accessToken, userId, playlistName);
    console.log('Playlist créée:', playlist);

    // Étape 5: Ajouter des tracks à la playlist
    const trackUris = ['spotify:track:4iV5W9uYEdYUVa79Axb7Rh', 'spotify:track:1301WleyT98MSxVHPZCA6M'];
    const result = await addTracksToPlaylist(accessToken, playlist.id, trackUris);
    console.log('Tracks ajoutés:', result);
}

main().catch(console.error);
