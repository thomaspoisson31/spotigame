import { checkAndRefreshToken } from './auth.js';
import { createPlaylistNavigation } from './playlist.js';
import { SessionManager } from './session.js';

// Variables globales
let player;
let deviceId;
let currentSong = {
    title: '',
    artist: '',
    year: '',
    albumUrl: ''
};
let currentPlaylist = null;

// Fonction pour vérifier la structure DOM
function checkDOMStructure() {
    console.log('Vérification de la structure DOM :');
    console.log('song-info:', document.getElementById('song-info'));
    console.log('songCard:', document.getElementById('songCard'));
    console.log('song-title:', document.querySelector('.song-title'));
    console.log('song-artist:', document.querySelector('.song-artist'));
    console.log('song-year:', document.querySelector('.song-year'));
}

async function selectRandomTrack(playlist) {
    if (!playlist || !playlist.tracks || !playlist.tracks.items) {
        console.error('Playlist invalide');
        return null;
    }

    const tracks = playlist.tracks.items;
    let attempts = 0;
    const maxAttempts = tracks.length;
    
    while (attempts < maxAttempts) {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        const track = tracks[randomIndex].track;
        
        if (!window.sessionManager.hasTrackUri(track.uri)) {
            console.log('Nouveau morceau trouvé, URI non présente dans la session :', track.uri);
            return track;
        } else {
            console.log('URI déjà présente dans la session, nouvelle tentative :', track.uri);
            attempts++;
        }
    }
    
    console.warn('Tous les morceaux de la playlist ont déjà été joués dans cette session');
    return null;
}


// Initialisation du player Spotify
function initializePlayer(token) {
    player = new Spotify.Player({
        name: 'SpotiGame Web Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    // Gestion des erreurs
    player.addListener('initialization_error', ({ message }) => {
        console.error('Erreur initialisation:', message);
    });

    player.addListener('authentication_error', async ({ message }) => {
        console.error('Erreur authentification:', message);
        if (await checkAndRefreshToken()) {
            console.log('Token rafraîchi avec succès');
        }
    });

    player.addListener('account_error', ({ message }) => {
        console.error('Erreur compte:', message);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Erreur lecture:', message);
    });

    // État du player
    player.addListener('player_state_changed', async (state) => {
        if (state) {
            console.log('État du player mis à jour:', state);
            
            if (state.track_window && state.track_window.current_track) {
                const track = state.track_window.current_track;
                console.log('Piste courante:', track);
                
                try {
                    // Récupérer les détails de la piste via l'API
                    const trackId = track.uri.split(':')[2];
                    const response = await fetch(
                        `https://api.spotify.com/v1/tracks/${trackId}`,
                        {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
                            },
                        }
                    );

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const trackData = await response.json();
                    
                    // Récupérer les détails de l'album
                    const albumResponse = await fetch(trackData.album.href, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('spotify_token')}`,
                        },
                    });

                    if (!albumResponse.ok) {
                        throw new Error(`HTTP error! status: ${albumResponse.status}`);
                    }

                    const albumData = await albumResponse.json();
                    
                    const songInfo = {
                        title: track.name,
                        artist: track.artists.map((artist) => artist.name).join(', '),
                        year: albumData.release_date
                            ? albumData.release_date.substring(0, 4)
                            : '',
                        albumUrl: trackData.album.images[0].url
                    };

                    console.log('Informations extraites:', songInfo);
                    updateCurrentSong(songInfo);

                    // Ajouter l'URI à la session active
                    if (window.sessionManager) {
                        window.sessionManager.addTrackUriToSession(track.uri);
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération des détails:', error);
                    const songInfo = {
                        title: track.name,
                        artist: track.artists.map((artist) => artist.name).join(', '),
                        year: track.album.release_date
                            ? track.album.release_date.substring(0, 4)
                            : '',
                        albumUrl: track.album.images[0].url
                    };
                    updateCurrentSong(songInfo);
                }
            }
        }
    });

    // Player prêt
    player.addListener('ready', ({ device_id }) => {
        console.log('Player prêt avec deviceId:', device_id);
        deviceId = device_id;
        window.deviceId = device_id;
        
        // Initialiser le bouton volume une fois que le player est prêt
        const volumeButton = document.querySelector('.volume-button');
        if (volumeButton) {
            volumeButton.addEventListener('click', async () => {
                if (!currentPlaylist) {
                    console.error('Aucune playlist sélectionnée');
                    return;
                }
                const track = await selectRandomTrack(currentPlaylist);
                
                if (track) {
                    // Jouer le morceau
                    const play = async ({ spotify_uri, playerInstance: { _options: { getOAuthToken } } }) => {
                        try {
                            const token = await new Promise(resolve => getOAuthToken(resolve));
                            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                                method: 'PUT',
                                body: JSON.stringify({ uris: [spotify_uri] }),
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                            });
                        } catch (error) {
                            console.error('Erreur lors de la lecture :', error);
                        }
                    };
                    await play({
                        playerInstance: player,
                        spotify_uri: track.uri
                    });
                } else {
                    alert('Tous les morceaux de la playlist ont déjà été joués dans cette session');
                }
            });
        }
    });

    // Player déconnecté
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID non prêt:', device_id);
    });

    // Connexion au player
    player.connect().then(success => {
        if (success) {
            console.log('Player connecté!');
        }
    });

    window.player = player;
}

// Gestion de l'affichage des informations de la chanson
function updateCurrentSong(songInfo) {
    console.log('Mise à jour des informations du morceau:', songInfo);
    
    const songInfoContainer = document.getElementById('song-info');
    if (songInfoContainer) {
        songInfoContainer.addEventListener('click', toggleSongInfo);
    }

    const defaultText = document.querySelector('.default-text');
    const songDetails = document.querySelector('.song-details');
    const titleElement = document.querySelector('.song-title');
    const artistElement = document.querySelector('.song-artist');
    const yearElement = document.querySelector('.song-year');
    const artworkThumbnail = document.getElementById('artwork-thumbnail');
    const card = document.querySelector('.card');
    const targetYearElement = document.querySelector('.target-year');
    if (targetYearElement) {
        targetYearElement.textContent = window.sessionManager.targetYear;
    }
    


    if (!songInfo || !songInfo.title) {
        console.error('Informations de chanson invalides');
        return;
    }

    // Mettre à jour les informations
    currentSong = songInfo;
    
    // Mettre à jour les éléments DOM
    titleElement.textContent = songInfo.title;
    artistElement.textContent = songInfo.artist;
    yearElement.textContent = songInfo.year ? ` (${songInfo.year})` : '';
    
    if (artworkThumbnail && songInfo.albumUrl) {
        artworkThumbnail.src = songInfo.albumUrl;
    }

    // Gérer l'affichage initial
    if (songInfoContainer) {
        songInfoContainer.style.display = 'block';
        
        // Réinitialiser l'état de la carte pour chaque nouveau morceau
        if (card) {
            card.classList.remove('revealed');
            defaultText.style.display = 'flex';
            songDetails.style.display = 'none';
        }
    }
}


function toggleSongInfo() {
    const defaultText = document.querySelector('.default-text');
    const songDetails = document.querySelector('.song-details');
    const card = document.querySelector('.card');

    if (!card) {
        console.error('Carte non trouvée.');
        return;
    }

    if (!card.classList.contains('revealed')) {
        // Révéler les informations
        card.classList.add('revealed');
        defaultText.style.display = 'none';
        songDetails.style.display = 'grid';
    } else {
        // Masquer les informations
        card.classList.remove('revealed');
        songDetails.style.display = 'none';
        defaultText.style.display = 'flex';
    }
}

function resetSongInfo() {
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('.card');
    const defaultText = document.querySelector('.default-text');
    const songDetails = document.querySelector('.song-details');
    
    if (songInfo && card) {
        // Masquer le conteneur principal
        songInfo.style.display = 'none';
        
        // Réinitialiser l'état
        card.classList.remove('revealed');
        defaultText.style.display = 'flex';
        songDetails.style.display = 'none';
    }
}

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    const songInfoContainer = document.getElementById('song-info');
    if (songInfoContainer) {
        songInfoContainer.addEventListener('click', toggleSongInfo);
    }



    // Panel de debug
    const collapsible = document.querySelector('.collapsible-debug');
    if (collapsible) {
        collapsible.addEventListener('click', function() {
            this.classList.toggle('active');
            const content = this.nextElementSibling;
            if (content.style.display === 'block') {
                content.style.display = 'none';
            } else {
                content.style.display = 'block';
            }
        });
    }
}

// Initialisation au chargement de la page
window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('SDK Spotify prêt');
    if (await checkAndRefreshToken()) {
        console.log('Token vérifié, initialisation du player...');
        initializePlayer(localStorage.getItem('spotify_token'));
        const playlistData = await createPlaylistNavigation();
        if (playlistData) {
            currentPlaylist = playlistData;
        }
        
        // Initialiser le gestionnaire de session
        window.sessionManager = new SessionManager();
        
        initializeEventListeners();
        console.log('Initialisation terminée');
    }
};

// Export des fonctions nécessaires
export { initializePlayer, currentPlaylist };
