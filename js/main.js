import { checkAndRefreshToken } from './auth.js';
import { createPlaylistNavigation } from './playlist.js';
import { SessionManager } from './session.js';

// Variables globales
let player;
let deviceId;
let imageRevealed = false;
let currentSong = {
    title: '',
    artist: '',
    year: ''
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
    const maxAttempts = tracks.length; // Évite une boucle infinie
    
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
                    albumUrl: trackData.album.images[0].url // Ajout de l'URL de l'artwork
                };

                console.log('Informations extraites:', songInfo);
                updateCurrentSong(songInfo);

                // Ajouter l'URI à la session active
                if (window.sessionManager) {
                    window.sessionManager.addTrackUriToSession(track.uri);
                }

            } catch (error) {
                console.error('Erreur lors de la récupération des détails:', error);
                // Fallback sur les informations de base
                const songInfo = {
                    title: track.name,
                    artist: track.artists.map((artist) => artist.name).join(', '),
                    year: track.album.release_date
                        ? track.album.release_date.substring(0, 4)
                        : '',
                    albumUrl: track.album.images[0].url // Fallback pour l'artwork
                };
                updateCurrentSong(songInfo);
            }
        }
    }
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
                    };

                    console.log('Informations extraites:', songInfo);
                    updateCurrentSong(songInfo);

                    // Ajouter l'URI à la session active
                    if (window.sessionManager) {
                        window.sessionManager.addTrackUriToSession(track.uri);
                    }
                } catch (error) {
                    console.error('Erreur lors de la récupération des détails:', error);
                    // Fallback sur les informations de base
                    const songInfo = {
                        title: track.name,
                        artist: track.artists.map((artist) => artist.name).join(', '),
                        year: track.album.release_date
                            ? track.album.release_date.substring(0, 4)
                            : '',
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
    
    if (!songInfo || !songInfo.title) {
        console.error('Informations de chanson invalides');
        return;
    }

    currentSong = {
        title: songInfo.title,
        artist: songInfo.artist,
        year: songInfo.year
    };

    updateSongElements();
    resetSongInfo();
}

function updateSongElements() {
    const titleElement = document.querySelector('.song-title');
    const artistElement = document.querySelector('.song-artist');
    const yearElement = document.querySelector('.song-year');
    const artworkThumbnail = document.getElementById('artwork-thumbnail');
    
    if (titleElement && artistElement && yearElement) {
        titleElement.textContent = currentSong.title;
        artistElement.textContent = currentSong.artist;
        yearElement.textContent = currentSong.year ? ` (${currentSong.year})` : '';
        
        // Mettre à jour la miniature
        if (artworkThumbnail && currentSong.albumUrl) {
            artworkThumbnail.src = currentSong.albumUrl;
        }
    }
}

function toggleSongInfo() {
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('.card');
    
    if (!currentSong.title) {
        console.error('Aucune information de chanson disponible');
        return;
    }

    if (!card.classList.contains('revealed')) {
        card.classList.add('revealed');
    } else {
        card.classList.remove('revealed');
    }
}


function resetSongInfo() {
    const albumImage = document.getElementById('album-image');
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('.card');
    
    if (songInfo && card) {
        imageRevealed = false;
        songInfo.style.display = 'none';
        
        if (card.classList.contains('revealed')) {
            card.classList.remove('revealed');
        }
        
        if (albumImage) {
            albumImage.style.filter = 'blur(20px)';
        }
    }
}

export function toggleImage() {
    console.log('Toggle image appelé, état actuel:', { imageRevealed, currentSong });
    
    const albumImage = document.getElementById('album-image');
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('.card');
    
    if (!albumImage || !songInfo || !card) {
        console.error('Éléments requis non trouvés pour toggleImage');
        return;
    }

    if (!currentSong.title) {
        console.error('Aucune information de chanson disponible');
        return;
    }

    if (!imageRevealed) {
        // Révéler
        albumImage.style.filter = 'none';
        songInfo.style.display = 'flex';
        updateSongElements();
        
        requestAnimationFrame(() => {
            card.classList.add('revealed');
            imageRevealed = true;
        });
    } else {
        // Masquer
        albumImage.style.filter = 'blur(20px)';
        card.classList.remove('revealed');
        
        setTimeout(() => {
            songInfo.style.display = 'none';
            imageRevealed = false;
        }, 300);
    }
}

// Initialisation des écouteurs d'événements
function initializeEventListeners() {
    const songInfo = document.getElementById('song-info');
    if (songInfo) {
        songInfo.addEventListener('click', toggleSongInfo);
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
