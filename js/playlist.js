import { checkAndRefreshToken } from './auth.js';

// Variables globales et constantes
export let playlists = [];
let currentPlaylistIndex = 0;

const ELEMENTS = {
    albumArt: null,
    albumImage: null,
    volumeButton: null,
    playlistNameDisplay: null
};

const VOLUME = {
    DEFAULT: 0.5,
    MUTED: 0,
    ICONS: {
        MUTED: '🔈',
        UNMUTED: '🔊'
    }
};

// Fonction de chargement des playlists
export async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        const token = localStorage.getItem('spotify_token');
        
        if (!token) {
            throw new Error('Token non trouvé');
        }

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
// Fonction d'initialisation de la navigation
export function initializePlaylistNavigation() {
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    ELEMENTS.volumeButton = document.querySelector('.volume-button');
    let isPlaying = false; // Nouvel état pour suivre la lecture

    if (!prevButton || !nextButton || !ELEMENTS.volumeButton) {
        console.error('Éléments de navigation non trouvés');
        return;
    }

    async function handleNavigation(newIndex) {
        try {
            if (window.player) {
                // Arrêter la lecture en cours
                await window.player.pause();
                isPlaying = false; // Réinitialiser l'état de lecture
                
                // Réinitialiser l'état du player
                window.player.getCurrentState().then(state => {
                    if (state) {
                        window.player.seek(0);
                    }
                });
                
                if (ELEMENTS.albumArt) {
                    ELEMENTS.albumArt.style.display = 'none';
                }
                
                if (ELEMENTS.volumeButton) {
                    ELEMENTS.volumeButton.textContent = VOLUME.ICONS.UNMUTED;
                }
            }
            currentPlaylistIndex = newIndex;
            updateCurrentPlaylist(currentPlaylistIndex);
        } catch (error) {
            console.error('Erreur lors de la navigation:', error);
        }
    }

    ELEMENTS.volumeButton.addEventListener('click', async () => {
        if (!window.player) {
            console.error('Player Spotify non initialisé');
            return;
        }

        try {
            const state = await window.player.getCurrentState();
            
            if (!state || !state.track_window?.current_track || !isPlaying) {
                // Si pas de lecture en cours, lancer une nouvelle chanson
                await playRandomSong();
                isPlaying = true;
                ELEMENTS.volumeButton.textContent = VOLUME.ICONS.UNMUTED;
            } else {
                // Si une lecture est en cours, gérer le volume
                const volume = await window.player.getVolume();
                if (volume === VOLUME.MUTED) {
                    // Remettre le son
                    await window.player.setVolume(VOLUME.DEFAULT);
                    await window.player.resume();
                    ELEMENTS.volumeButton.textContent = VOLUME.ICONS.UNMUTED;
                } else {
                    // Couper le son
                    await window.player.setVolume(VOLUME.MUTED);
                    await window.player.pause();
                    ELEMENTS.volumeButton.textContent = VOLUME.ICONS.MUTED;
                }
            }
        } catch (error) {
            console.error('Erreur lors de la gestion du volume:', error);
            // En cas d'erreur, réinitialiser l'état
            isPlaying = false;
            ELEMENTS.volumeButton.textContent = VOLUME.ICONS.UNMUTED;
        }
    });

    prevButton.addEventListener('click', () => {
        const newIndex = (currentPlaylistIndex - 1 + playlists.length) % playlists.length;
        handleNavigation(newIndex);
    });

    nextButton.addEventListener('click', () => {
        const newIndex = (currentPlaylistIndex + 1) % playlists.length;
        handleNavigation(newIndex);
    });
}

export function updateCurrentPlaylist(index) {
    if (playlists[index]) {
        const playlistNameElement = document.getElementById('playlist-name-display');
        if (playlistNameElement) {
            playlistNameElement.textContent = playlists[index].name;
            console.log('Playlist mise à jour:', playlists[index].name);
        } else {
            console.error('Élément playlist-name-display non trouvé');
        }
    } else {
        console.error('Index de playlist invalide:', index);
    }
}

async function playRandomSong() {
    if (!playlists || playlists.length === 0) {
        console.error('Aucune playlist disponible');
        return;
    }

    try {
        const selectedPlaylist = playlists[currentPlaylistIndex];
        
        if (!selectedPlaylist?.songs?.length) {
            console.error('Playlist invalide ou vide');
            return;
        }

        const randomSongIndex = Math.floor(Math.random() * selectedPlaylist.songs.length);
        const selectedSong = selectedPlaylist.songs[randomSongIndex];

        if (!selectedSong?.uri) {
            throw new Error('URI de chanson manquant');
        }

        const deviceId = window.deviceId;
        const token = localStorage.getItem('spotify_token');

        if (!deviceId || !token) {
            throw new Error('DeviceId ou token manquant');
        }

        const trackId = selectedSong.uri.split(':')[2];
        const trackResponse = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!trackResponse.ok) {
            throw new Error(`Erreur récupération track: ${trackResponse.status}`);
        }

        const trackData = await trackResponse.json();

        const playResponse = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [selectedSong.uri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        if (!playResponse.ok && playResponse.status !== 204) {
            throw new Error(`Erreur lecture: ${playResponse.status}`);
        }

        if (trackData?.album?.images?.length > 0) {
            ELEMENTS.albumArt = document.getElementById('album-art');
            ELEMENTS.albumImage = document.getElementById('album-image');
            
            if (ELEMENTS.albumArt && ELEMENTS.albumImage) {
                ELEMENTS.albumImage.src = trackData.album.images[0].url;
                ELEMENTS.albumImage.style.filter = 'blur(20px)';
                ELEMENTS.albumArt.style.display = 'flex';
            }
        }

        if (typeof window.updateCurrentSong === 'function') {
            window.updateCurrentSong({
                title: selectedSong.title,
                artist: selectedSong.artist,
                year: selectedSong.year
            });
        }

        console.log('Lecture démarrée:', selectedSong.title);

    } catch (error) {
        console.error('Erreur lors de la lecture aléatoire:', error);
    }
}

export async function createPlaylistNavigation() {
    try {
        if (!await checkAndRefreshToken()) {
            console.warn('Token invalide lors de la création de la navigation');
        }

        const loadedPlaylists = await loadPlaylists();
        if (!loadedPlaylists) {
            throw new Error('Échec du chargement des playlists');
        }

        playlists = loadedPlaylists;
        
        const container = document.getElementById('playlist-buttons') || 
            (() => {
                const newContainer = document.createElement('div');
                newContainer.id = 'playlist-buttons';
                document.body.appendChild(newContainer);
                return newContainer;
            })();

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

        initializePlaylistNavigation();
        
        if (playlists.length > 0) {
            updateCurrentPlaylist(0);
        }

    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
        return null;
    }
}

