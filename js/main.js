import { player, deviceId, fetchAlbumArtwork, initializePlayer } from './spotifyApi.js';
import { playlists, loadPlaylists } from './playlist.js';
import { checkAndRefreshToken } from './auth.js';
import { createPlaylistNavigation } from './playlist.js';


let currentSong = null;
let imageRevealed = false;

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

export async function createPlaylistButtons() {
    try {
        console.log('Début création des boutons...');
        await loadPlaylists();
        const container = document.getElementById('playlist-buttons');
        
        if (!container) {
            console.error('Container playlist-buttons non trouvé dans le DOM');
            return;
        }
        
        console.log('Création des boutons pour', playlists.length, 'playlists');
        playlists.forEach((playlist, index) => {
            const button = document.createElement('button');
            button.className = 'playlist-button';
            button.textContent = playlist.name;
            
            button.addEventListener('click', () => {
                const buttons = document.querySelectorAll('.playlist-button');
                buttons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                loadRandomSong(index);
            });
            
            container.appendChild(button);
            console.log('Bouton créé pour:', playlist.name);
        });
    } catch (error) {
        console.error('Erreur lors de la création des boutons:', error);
    }
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

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('spotify_token');
    if (!token) {
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
            var content = this.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    }

    document.getElementById('togglePlay')?.addEventListener('click', () => {
        player.togglePlay();
    });
});


window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('SDK Spotify prêt');
    try {
        const isTokenValid = await checkAndRefreshToken();
        if (!isTokenValid) {
            console.log('Token invalide, redirection vers auth.html');
            window.location.href = 'auth.html';
            return;
        }

        console.log('Token vérifié, initialisation du player...');
        await initializePlayer();
        await createPlaylistNavigation();
        console.log('Initialisation terminée');
    } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        window.location.href = 'auth.html';
    }
};
