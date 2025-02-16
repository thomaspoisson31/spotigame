import { checkAndRefreshToken } from './auth.js';

// Variables globales
export let playlists = [];
let currentPlaylistIndex = 0;

// Fonction de chargement des playlists
export async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        const token = localStorage.getItem('spotify_token');
        
        if (!token) {
            throw new Error('Token non trouvé');
        }

        // Vérifions d'abord que le token est valide
        const tokenCheck = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!tokenCheck.ok) {
            throw new Error('Token invalide');
        }

        const configResponse = await fetch('playlist_config.json');
        if (!configResponse.ok) {
            throw new Error('Impossible de charger le fichier de configuration');
        }
        
        const config = await configResponse.json();
        const files = config.playlist_files;

        const loadedPlaylists = await Promise.all(
            files.map(async (file) => {
                try {
                    const fileResponse = await fetch(file);
                    if (!fileResponse.ok) {
                        return null;
                    }
                    const data = await fileResponse.json();
                    return {
                        name: data.playlist_name,
                        songs: data.songs
                    };
                } catch (error) {
                    console.error(`Erreur pour ${file}:`, error);
                    return null;
                }
            })
        );

        const validPlaylists = loadedPlaylists.filter(playlist => playlist !== null);
        if (validPlaylists.length === 0) {
            throw new Error('Aucune playlist valide chargée');
        }
        console.log('Playlists valides chargées:', validPlaylists.length);
        return validPlaylists;

    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        return null;
    }
}

// Fonction d'initialisation de la navigation
export function initializePlaylistNavigation() {
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const volumeButton = document.querySelector('.volume-button');

    if (!prevButton || !nextButton || !volumeButton) {
        console.error('Éléments de navigation non trouvés');
        return;
    }

    prevButton.addEventListener('click', () => {
        currentPlaylistIndex = (currentPlaylistIndex - 1 + playlists.length) % playlists.length;
        updateCurrentPlaylist(currentPlaylistIndex);
    });

    nextButton.addEventListener('click', () => {
        currentPlaylistIndex = (currentPlaylistIndex + 1) % playlists.length;
        updateCurrentPlaylist(currentPlaylistIndex);
    });

    // Nouvelle logique pour le bouton volume
    volumeButton.addEventListener('click', async () => {
        if (!window.player) {
            console.error('Player Spotify non initialisé');
            return;
        }

        try {
            const state = await window.player.getCurrentState();
            if (!state) {
                // Aucun morceau en cours, sélection et lecture aléatoire
                await playRandomSong();
                volumeButton.textContent = '🔊';
            } else {
                // Toggle du volume (muet/non-muet)
                const volume = await window.player.getVolume();
                const newVolume = volume === 0 ? 0.5 : 0;
                await window.player.setVolume(newVolume);
                volumeButton.textContent = newVolume === 0 ? '🔈' : '🔊';
            }
        } catch (error) {
            console.error('Erreur lors de la gestion du volume:', error);
        }
    });
}

// Fonction de mise à jour de la playlist courante
export function updateCurrentPlaylist(index) {
    console.log('Mise à jour playlist:', index, playlists[index]);
    
    if (playlists[index]) {
        const playlistNameElement = document.getElementById('playlist-name-display');
        if (playlistNameElement) {
            playlistNameElement.textContent = playlists[index].name;
            console.log('Nom de playlist mis à jour:', playlists[index].name);
        } else {
            console.error('Élément playlist-name-display non trouvé');
        }
    } else {
        console.error('Index de playlist invalide:', index);
    }
}

// Fonction pour jouer un morceau aléatoire
async function playRandomSong() {
    if (!playlists || playlists.length === 0) {
        console.error('Aucune playlist disponible');
        return;
    }

    try {
        // Sélectionner une playlist aléatoire si aucune n'est sélectionnée
        const playlistIndex = currentPlaylistIndex >= 0 ? 
            currentPlaylistIndex : 
            Math.floor(Math.random() * playlists.length);
            
        const selectedPlaylist = playlists[playlistIndex];
        
        if (!selectedPlaylist || !selectedPlaylist.songs || selectedPlaylist.songs.length === 0) {
            console.error('Playlist invalide ou vide');
            return;
        }

        // Sélectionner un morceau aléatoire
        const randomSongIndex = Math.floor(Math.random() * selectedPlaylist.songs.length);
        const selectedSong = selectedPlaylist.songs[randomSongIndex];

        // Afficher la pochette et les informations
        const albumArt = document.getElementById('album-art');
        if (albumArt) {
            albumArt.style.display = 'block';
        }

        // Lancer la lecture
        if (window.player) {
            await window.player.play(selectedSong.uri);
            // Mettre à jour les informations du morceau courant
            if (typeof window.updateCurrentSong === 'function') {
                window.updateCurrentSong({
                    title: selectedSong.title,
                    artist: selectedSong.artist,
                    year: selectedSong.year
                });
            }
        }

    } catch (error) {
        console.error('Erreur lors de la lecture aléatoire:', error);
    }
}

// Fonction principale de création de la navigation
export async function createPlaylistNavigation() {
    try {
        const isTokenValid = await checkAndRefreshToken();
        if (!isTokenValid) {
            console.log('Token invalide lors de la création de la navigation');
            console.warn('Tentative de continuer malgré un token invalide...');
        }

        const loadedPlaylists = await loadPlaylists();
        if (!loadedPlaylists) {
            console.error('Échec du chargement des playlists');
            return;
        }

        playlists = loadedPlaylists;
        console.log('Playlists chargées:', playlists);

        // Vérifier et créer le conteneur si nécessaire
        let container = document.getElementById('playlist-buttons');
        if (!container) {
            console.log('Création du conteneur playlist-buttons');
            container = document.createElement('div');
            container.id = 'playlist-buttons';
            document.body.appendChild(container);
        }

        // Mise à jour du HTML
        container.innerHTML = `
            <div class="playlist-navigation">
                <button class="nav-button prev-button" id="prev-playlist">&#9664;</button>
                <div id="current-playlist" class="current-playlist">
                    <span class="playlist-name" id="playlist-name-display"></span>
                    <button class="volume-button" id="volume-control">🔊</button>
                </div>
                <button class="nav-button next-button" id="next-playlist">&#9654;</button>
            </div>
        `;

        // Ajout des styles CSS
        addPlaylistStyles();

        // Initialisation des contrôles
        initializePlaylistNavigation();
        
        // Afficher la première playlist
        if (playlists.length > 0) {
            console.log('Affichage de la première playlist');
            updateCurrentPlaylist(0);
        } else {
            console.warn('Aucune playlist à afficher');
        }

    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
        return null;
    }
}

// Fonction d'ajout des styles CSS
function addPlaylistStyles() {
    if (!document.getElementById('playlist-styles')) {
        const styles = document.createElement('style');
        styles.id = 'playlist-styles';
        styles.textContent = `
            .playlist-navigation {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                margin: 1rem 0;
            }
            
            .current-playlist {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.5rem 1rem;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 20px;
                min-width: 200px;
                justify-content: center;
            }
            
            .nav-button {
                background: none;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0.5rem;
                transition: transform 0.2s;
            }
            
            .nav-button:hover {
                transform: scale(1.2);
            }
            
            .playlist-name {
                color: white;
                font-size: 1.2rem;
                margin: 0;
            }
            
            .volume-button {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0.5rem;
            }
        `;
        document.head.appendChild(styles);
    }
}
