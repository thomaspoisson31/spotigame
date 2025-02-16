import { player, deviceId, fetchAlbumArtwork, initializePlayer } from './spotifyApi.js';
import { playlists, loadPlaylists, createPlaylistNavigation } from './playlist.js';
import { checkAndRefreshToken } from './auth.js';

let currentSong = null;
let imageRevealed = false;

// Fonction de debug du token
function debugTokenInfo() {
    const token = localStorage.getItem('spotify_token');
    const timestamp = localStorage.getItem('token_timestamp');
    const expiresIn = localStorage.getItem('token_expires_in');
    
    console.log('=== Debug Token Info ===');
    console.log({
        token: token ? token.substring(0, 10) + '...' : null,
        timestamp: timestamp ? new Date(parseInt(timestamp)) : null,
        expiresIn: expiresIn ? expiresIn + ' secondes' : null,
        now: new Date()
    });
}

// Fonctions de l'interface utilisateur
export function resetSongInfo() {
    const songInfo = document.getElementById('song-info');
    const card = document.querySelector('#songCard .card');
    
    if (card) {
        card.classList.remove('revealed');
    }
    
    const titleElement = document.querySelector('.song-title');
    const artistElement = document.querySelector('.song-artist');
    const yearElement = document.querySelector('.song-year');
    
    if (titleElement) titleElement.textContent = '';
    if (artistElement) artistElement.textContent = '';
    if (yearElement) yearElement.textContent = '';
}

export function resetImage() {
    const albumArt = document.getElementById('album-art');
    const albumImage = document.getElementById('album-image');
    albumImage.style.filter = 'blur(20px)';
    imageRevealed = false;
    albumArt.style.display = 'none';
}

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

// Initialisation des événements DOM
document.addEventListener('DOMContentLoaded', () => {
    console.log('=== Chargement DOM ===');
    debugTokenInfo();

    const token = localStorage.getItem('spotify_token');
    if (!token) {
        console.log('❌ Pas de token - Redirection vers auth');
        window.location.href = 'auth.html';
        return;
    }

    const songCard = document.getElementById('songCard');
    if (songCard) {
        songCard.addEventListener('click', toggleImage);
    }

    const debugButton = document.querySelector('.collapsible-debug');
    if (debugButton) {
        debugButton.addEventListener("click", function() {
            this.classList.toggle("active");
            const content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    document.getElementById('togglePlay')?.addEventListener('click', () => {
        if (window.player) {
            window.player.togglePlay();
        }
    });
});

// Initialisation du SDK Spotify
window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('=== SDK Spotify prêt ===');
    debugTokenInfo();
    
    const justAuthenticated = localStorage.getItem('just_authenticated');
    if (justAuthenticated) {
        localStorage.removeItem('just_authenticated');
        console.log('✅ Premier chargement après authentification');
    }

    const token = localStorage.getItem('spotify_token');
    if (!token) {
        console.log('❌ Aucun token trouvé - Redirection vers auth');
        window.location.href = 'auth.html';
        return;
    }

    try {
        const isTokenValid = await checkAndRefreshToken();
        console.log('Résultat vérification token:', isTokenValid);

        if (!isTokenValid && !justAuthenticated) {
            console.log('❌ Token invalide - Redirection vers auth');
            window.location.href = 'auth.html';
            return;
        }

        console.log('Initialisation du player Spotify...');
        const player = new Spotify.Player({
            name: 'Quiz Musical Player',
            getOAuthToken: cb => { 
                const currentToken = localStorage.getItem('spotify_token');
                console.log('Token fourni au player:', currentToken ? 'présent' : 'absent');
                cb(currentToken); 
            },
            volume: 0.5
        });

        // Gestionnaires d'événements du player
        player.addListener('authentication_error', ({ message }) => {
            console.error('Erreur auth Spotify:', message);
            if (!justAuthenticated) {
                window.location.href = 'auth.html';
            }
        });

        player.addListener('initialization_error', ({ message }) => {
            console.error('Erreur initialisation:', message);
        });

        player.addListener('account_error', ({ message }) => {
            console.error('Erreur compte:', message);
        });

        player.addListener('playback_error', ({ message }) => {
            console.error('Erreur lecture:', message);
        });

        player.addListener('ready', ({ device_id }) => {
            console.log('✅ Player prêt avec ID:', device_id);
            window.deviceId = device_id;
        });

        player.addListener('not_ready', ({ device_id }) => {
            console.log('❌ Player non prêt:', device_id);
        });

        // Connexion du player
        console.log('Tentative de connexion du player...');
        const connected = await player.connect();
        
        if (connected) {
            console.log('✅ Player connecté avec succès');
            window.player = player;
            await createPlaylistNavigation();
        } else {
            console.error('❌ Échec de la connexion du player');
        }

    } catch (error) {
        console.error('Erreur critique:', error);
    }
};

// Fonctions de debug pour le panel
window.invalidateToken = () => {
    localStorage.setItem('spotify_token', 'invalid_token');
    console.log('Token invalidé');
    checkAndRefreshToken();
};

window.expireToken = () => {
    localStorage.setItem('token_timestamp', '0');
    localStorage.setItem('token_expires_in', '0');
    console.log('Token expiré');
    checkAndRefreshToken();
};

window.removeToken = () => {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('token_timestamp');
    localStorage.removeItem('token_expires_in');
    console.log('Token supprimé');
    checkAndRefreshToken();
};
