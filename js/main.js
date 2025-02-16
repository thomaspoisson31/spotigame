import { checkAndRefreshToken } from './auth.js';
import { createPlaylistNavigation } from './playlist.js';

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
    currentSong = songInfo;
    resetSongInfo();
}

// Fonction pour réinitialiser l'affichage des informations
function resetSongInfo() {
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('#songCard .card');
    
    if (songInfo && card) {
        imageRevealed = false;
        songInfo.style.display = 'none';
        card.classList.remove('revealed');
    }
}

// Fonction pour révéler l'image et les informations
export function toggleImage() {
    const albumImage = document.getElementById('album-image');
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('#songCard .card');
    
    if (!imageRevealed) {
        albumImage.style.filter = 'none';
        imageRevealed = true;
        songInfo.style.display = 'flex';
        
        document.querySelector('.song-title').textContent = currentSong.title;
        document.querySelector('.song-artist').textContent = currentSong.artist;
        document.querySelector('.song-year').textContent = `(${currentSong.year})`;
        
        card.classList.add('revealed');
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

// Fonctions de debug pour le token
window.invalidateToken = function() {
    localStorage.setItem('spotify_token', 'invalid_token');
    console.log('Token invalidé');
};

window.expireToken = function() {
    const expiredToken = {
        value: localStorage.getItem('spotify_token'),
        timestamp: Date.now() - 3600001 // Expire le token
    };
    localStorage.setItem('spotify_token_data', JSON.stringify(expiredToken));
    console.log('Token expiré');
};

window.removeToken = function() {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_token_data');
    console.log('Token supprimé');
};

// Initialisation au chargement de la page
window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('SDK Spotify prêt');
    if (await checkAndRefreshToken()) {
        console.log('Token vérifié, initialisation du player...');
        initializePlayer(localStorage.getItem('spotify_token'));
        await createPlaylistNavigation();
        initializeEventListeners();
        console.log('Initialisation terminée');
    }
};

// Export des fonctions nécessaires
export { initializePlayer };
