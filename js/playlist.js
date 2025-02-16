export let playlists = [];
let currentPlaylistIndex = 0;

// Fonction pour vérifier le token
async function checkToken() {
    const token = localStorage.getItem('spotify_token');
    if (!token) {
        console.log('Token absent');
        return false;
    }

    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Erreur vérification token:', error);
        return false;
    }
}

export async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        
        // Charger la configuration locale d'abord
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

    volumeButton.addEventListener('click', () => {
        if (window.player) {
            window.player.getVolume().then(volume => {
                const newVolume = volume === 0 ? 0.5 : 0;
                window.player.setVolume(newVolume);
                volumeButton.textContent = newVolume === 0 ? '🔈' : '🔊';
            });
        }
    });
}

export function updateCurrentPlaylist(index) {
    if (playlists[index]) {
        const playlistNameElement = document.querySelector('.playlist-name');
        if (playlistNameElement) {
            playlistNameElement.textContent = playlists[index].name;
        }
        
        if (typeof window.loadRandomSong === 'function') {
            window.loadRandomSong(index);
        }
    }
}

export async function createPlaylistNavigation() {
    try {
        // Vérifier le token d'abord
        const isTokenValid = await checkToken();
        if (!isTokenValid) {
            console.log('Token invalide lors de la création de la navigation');
            return;
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

        container.innerHTML = `
            <div class="playlist-navigation">
                <button class="nav-button prev-button">&#9664;</button>
                <div id="current-playlist" class="current-playlist">
                    <span class="playlist-name"></span>
                    <button class="volume-button">🔊</button>
                </div>
                <button class="nav-button next-button">&#9654;</button>
            </div>
        `;

        initializePlaylistNavigation();
        
        if (playlists.length > 0) {
            updateCurrentPlaylist(0);
        }

    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
    }
}
