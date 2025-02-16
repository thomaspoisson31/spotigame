import { player, deviceId, fetchAlbumArtwork, initializePlayer } from './spotifyApi.js';
import { playlists, loadPlaylists, createPlaylistNavigation } from './playlist.js';
import { checkAndRefreshToken, getCurrentToken } from './auth.js';

let currentSong = null;
let imageRevealed = false;

// Gestion de l'interface utilisateur
const UI = {
    resetSongInfo() {
        const elements = {
            card: document.querySelector('#songCard .card'),
            title: document.querySelector('.song-title'),
            artist: document.querySelector('.song-artist'),
            year: document.querySelector('.song-year')
        };

        if (elements.card) {
            elements.card.classList.remove('revealed');
        }

        Object.entries(elements).forEach(([key, element]) => {
            if (element && key !== 'card') {
                element.textContent = '';
            }
        });
    },

    async createPlaylistButtons() {
        try {
            console.log('Début création des boutons...');
            await loadPlaylists();
            
            const container = document.getElementById('playlist-buttons');
            if (!container) {
                throw new Error('Container playlist-buttons non trouvé');
            }

            console.log(`Création des boutons pour ${playlists.length} playlists`);
            
            playlists.forEach((playlist, index) => {
                const button = document.createElement('button');
                button.className = 'playlist-button';
                button.textContent = playlist.name;
                
                button.addEventListener('click', () => {
                    document.querySelectorAll('.playlist-button')
                        .forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    this.loadRandomSong(index);
                });
                
                container.appendChild(button);
                console.log('Bouton créé pour:', playlist.name);
            });
        } catch (error) {
            console.error('Erreur lors de la création des boutons:', error);
            this.handleError(error);
        }
    },

    resetImage() {
        const albumArt = document.getElementById('album-art');
        const albumImage = document.getElementById('album-image');
        
        if (albumImage && albumArt) {
            albumImage.style.filter = 'blur(20px)';
            imageRevealed = false;
            albumArt.style.display = 'none';
        }
    },

    toggleImage() {
        if (imageRevealed || !currentSong) return;

        const elements = {
            albumImage: document.getElementById('album-image'),
            songInfo: document.getElementById('song-info'),
            card: document.querySelector('#songCard .card'),
            title: document.querySelector('.song-title'),
            artist: document.querySelector('.song-artist'),
            year: document.querySelector('.song-year')
        };

        if (Object.values(elements).some(el => !el)) {
            console.error('Éléments manquants dans le DOM');
            return;
        }

        elements.albumImage.style.filter = 'none';
        elements.songInfo.style.display = 'flex';
        elements.title.textContent = currentSong.title;
        elements.artist.textContent = currentSong.artist;
        elements.year.textContent = `(${currentSong.year})`;
        elements.card.classList.add('revealed');
        
        imageRevealed = true;
    },

    handleError(error) {
        console.error('Erreur:', error);
        // Implémenter une UI pour afficher les erreurs à l'utilisateur
    }
};

// Initialisation de l'application
async function initializeApp() {
    const token = getCurrentToken();
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }

    try {
        await initializePlayer(token);
        await UI.createPlaylistButtons();
        
        // Event Listeners
        document.getElementById('songCard')?.addEventListener('click', UI.toggleImage);
        
        const debugButton = document.querySelector('.collapsible-debug');
        if (debugButton) {
            debugButton.addEventListener('click', function() {
                this.classList.toggle('active');
                const content = this.nextElementSibling;
                content.style.maxHeight = content.style.maxHeight ? null : `${content.scrollHeight}px`;
            });
        }

        document.getElementById('togglePlay')?.addEventListener('click', () => {
            if (player) player.togglePlay();
        });

    } catch (error) {
        UI.handleError(error);
    }
}

// Initialisation du SDK Spotify
window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('SDK Spotify prêt');
    
    if (await checkAndRefreshToken()) {
        await initializeApp();
    } else {
        window.location.href = 'auth.html';
    }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', initializeApp);

// Export des fonctions nécessaires
export { UI as default };
