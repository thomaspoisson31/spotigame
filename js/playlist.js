import { checkAndRefreshToken } from './auth.js';

export let playlists = [];
let currentPlaylistIndex = 0;

// Configuration
const CONFIG = {
    CONFIG_FILE: 'playlist_config.json',
    DEFAULT_VOLUME: 0.5,
    VOLUME_ICONS: {
        MUTED: '🔈',
        UNMUTED: '🔊'
    }
};

// Gestionnaire de playlists
class PlaylistManager {
    static async loadPlaylistConfig() {
        try {
            const response = await fetch(CONFIG.CONFIG_FILE);
            if (!response.ok) {
                throw new Error(`Erreur chargement configuration (${response.status})`);
            }
            return await response.json();
        } catch (error) {
            console.error('Erreur chargement configuration:', error);
            throw error;
        }
    }

    static async loadPlaylistFile(file) {
        try {
            const response = await fetch(file);
            if (!response.ok) {
                throw new Error(`Erreur chargement playlist ${file}`);
            }
            const data = await response.json();
            return {
                name: data.playlist_name,
                songs: data.songs
            };
        } catch (error) {
            console.error(`Erreur chargement ${file}:`, error);
            return null;
        }
    }

    static validatePlaylist(playlist) {
        return playlist && 
               playlist.name && 
               Array.isArray(playlist.songs) && 
               playlist.songs.length > 0;
    }
}

// Interface utilisateur
class PlaylistUI {
    static getElements() {
        return {
            container: document.getElementById('playlist-buttons'),
            playlistName: document.querySelector('.playlist-name'),
            prevButton: document.querySelector('.prev-button'),
            nextButton: document.querySelector('.next-button'),
            volumeButton: document.querySelector('.volume-button')
        };
    }

    static createNavigationHTML() {
        return `
            <div class="playlist-navigation">
                <button class="nav-button prev-button">&#9664;</button>
                <div id="current-playlist" class="current-playlist">
                    <span class="playlist-name"></span>
                    <button class="volume-button">${CONFIG.VOLUME_ICONS.UNMUTED}</button>
                </div>
                <button class="nav-button next-button">&#9654;</button>
            </div>
        `;
    }

    static updatePlaylistDisplay(playlist) {
        const { playlistName } = this.getElements();
        if (playlistName && playlist) {
            playlistName.textContent = playlist.name;
        }
    }
}

// Fonctions exportées
export async function loadPlaylists() {
    try {
        if (!await checkAndRefreshToken()) {
            throw new Error('Token invalide');
        }

        const config = await PlaylistManager.loadPlaylistConfig();
        const loadedPlaylists = await Promise.all(
            config.playlist_files.map(PlaylistManager.loadPlaylistFile)
        );

        const validPlaylists = loadedPlaylists
            .filter(playlist => PlaylistManager.validatePlaylist(playlist));

        if (validPlaylists.length === 0) {
            throw new Error('Aucune playlist valide chargée');
        }

        console.log(`${validPlaylists.length} playlists chargées avec succès`);
        return validPlaylists;

    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        return null;
    }
}

export function updateCurrentPlaylist(index) {
    if (!playlists[index]) {
        console.error('Index de playlist invalide:', index);
        return;
    }

    PlaylistUI.updatePlaylistDisplay(playlists[index]);
    
    if (typeof window.loadRandomSong === 'function') {
        window.loadRandomSong(index);
    }
}

export function initializePlaylistNavigation() {
    const elements = PlaylistUI.getElements();
    
    if (!elements.prevButton || !elements.nextButton || !elements.volumeButton) {
        console.error('Éléments de navigation manquants');
        return;
    }

    // Navigation
    elements.prevButton.addEventListener('click', () => {
        currentPlaylistIndex = (currentPlaylistIndex - 1 + playlists.length) % playlists.length;
        updateCurrentPlaylist(currentPlaylistIndex);
    });

    elements.nextButton.addEventListener('click', () => {
        currentPlaylistIndex = (currentPlaylistIndex + 1) % playlists.length;
        updateCurrentPlaylist(currentPlaylistIndex);
    });

    // Contrôle du volume
    elements.volumeButton.addEventListener('click', async () => {
        if (!window.player) return;

        try {
            const volume = await window.player.getVolume();
            const newVolume = volume === 0 ? CONFIG.DEFAULT_VOLUME : 0;
            await window.player.setVolume(newVolume);
            elements.volumeButton.textContent = newVolume === 0 ? 
                CONFIG.VOLUME_ICONS.MUTED : CONFIG.VOLUME_ICONS.UNMUTED;
        } catch (error) {
            console.error('Erreur contrôle volume:', error);
        }
    });
}

export async function createPlaylistNavigation() {
    try {
        // Vérifier le token d'abord
        const isTokenValid = await checkAndRefreshToken();
        if (!isTokenValid) {
            console.log('Token invalide lors de la création de la navigation');
            // Au lieu de throw, on continue avec un avertissement
            console.warn('Tentative de continuer malgré un token invalide...');
        }

        const loadedPlaylists = await loadPlaylists();
        if (!loadedPlaylists) {
            console.error('Échec du chargement des playlists');
            return;
        }

        playlists = loadedPlaylists;
        
        const container = document.getElementById('playlist-buttons');
        if (!container) {
            console.error('Container playlist-buttons non trouvé');
            return;
        }

        // Reste du code...
    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
        // Ne pas propager l'erreur
        return null;
    }
}

