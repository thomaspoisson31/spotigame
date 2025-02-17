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
    player.addListener('player_state_changed', state => {
        if (state) {
            console.log('État du player mis à jour:', state);
            
            // Extraire les informations de la piste courante
            if (state.track_window && state.track_window.current_track) {
                const track = state.track_window.current_track;
                console.log('Piste courante:', track);
                
                // Créer l'objet songInfo
                const songInfo = {
                    title: track.name,
                    artist: track.artists.map(artist => artist.name).join(', '),
                    year: track.album.release_date ? track.album.release_date.slice(0, 4) : ''
                };
                
                console.log('Informations extraites:', songInfo);
                updateCurrentSong(songInfo);
            }
        }
    });

    // Player prêt
    player.addListener('ready', ({ device_id }) => {
        console.log('Player prêt avec deviceId:', device_id);
        deviceId = device_id;
        window.deviceId = device_id;
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
export function updateCurrentSong(songInfo) {
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
    console.log('Mise à jour des éléments avec currentSong:', currentSong);
    
    const titleElement = document.querySelector('.song-title');
    const artistElement = document.querySelector('.song-artist');
    const yearElement = document.querySelector('.song-year');
    
    if (titleElement && artistElement && yearElement) {
        titleElement.textContent = currentSong.title;
        artistElement.textContent = currentSong.artist;
        yearElement.textContent = currentSong.year ? `(${currentSong.year})` : '';
        console.log('Éléments mis à jour avec succès');
    } else {
        console.error('Éléments non trouvés dans le DOM:', {
            titleElement,
            artistElement,
            yearElement
        });
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
    const albumImage = document.getElementById('album-image');
    if (albumImage) {
        albumImage.addEventListener('click', toggleImage);
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
        await createPlaylistNavigation();
        
        // Initialiser le gestionnaire de session
        const sessionManager = new SessionManager();
        window.sessionManager = sessionManager;
        
        // Définir showSession comme une fonction simple qui n'appelle debugSession qu'une seule fois
        window.showSession = function() {
            sessionManager.debugSession();
        };
        
        initializeEventListeners();
        console.log('Initialisation terminée');
    }
};


// Fonctions de debug pour le token
window.invalidateToken = function() {
    localStorage.setItem('spotify_token', 'invalid_token');
    console.log('Token invalidé');
};

window.expireToken = function() {
    const expiredToken = {
        value: localStorage.getItem('spotify_token'),
        timestamp: Date.now() - 3600001
    };
    localStorage.setItem('spotify_token_data', JSON.stringify(expiredToken));
    console.log('Token expiré');
};

window.removeToken = function() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_token_data');
    console.log('Token supprimé');
};

// Export des fonctions nécessaires
export { initializePlayer };
