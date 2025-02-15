export let playlists = [];
let currentPlaylistIndex = 0;

// Exporter la fonction d'initialisation
export function initializePlaylistNavigation() {
    const prevButton = document.querySelector('.prev-button');
    const nextButton = document.querySelector('.next-button');
    const volumeButton = document.querySelector('.volume-button');

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

// Exporter également la fonction de mise à jour
export function updateCurrentPlaylist(index) {
    if (playlists[index]) {
        const playlistNameElement = document.querySelector('.playlist-name');
        playlistNameElement.textContent = playlists[index].name;
        
        // Charger une chanson de la playlist
        if (typeof window.loadRandomSong === 'function') {
            window.loadRandomSong(index);
        }
    }
}

export async function createPlaylistNavigation() {
    try {
        const loadedPlaylists = await loadPlaylists();
        if (!loadedPlaylists) {
            console.error('Échec du chargement des playlists');
            window.location.href = 'auth.html';
            return;
        }

        playlists = loadedPlaylists;
        
        // Récupérer le container
        const container = document.getElementById('playlist-buttons'); // Ajout de cette ligne
        if (!container) { // Ajout d'une vérification
            console.error('Container playlist-buttons non trouvé');
            return;
        }

        // Vider le container existant
        container.innerHTML = '';
        
        // Créer la nouvelle structure de navigation
        const navigationHTML = `
            <div class="playlist-navigation">
                <button class="nav-button prev-button">&#9664;</button>
                <div id="current-playlist" class="current-playlist">
                    <span class="playlist-name"></span>
                    <button class="volume-button">🔊</button>
                </div>
                <button class="nav-button next-button">&#9654;</button>
            </div>
        `;
        
        container.innerHTML = navigationHTML;

        // Initialiser les événements
        initializePlaylistNavigation();
        
        // Afficher la première playlist
        if (playlists.length > 0) {
            updateCurrentPlaylist(0);
        }

    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
        window.location.href = 'auth.html';
    }
}



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

        console.log('Playlists valides chargées:', validPlaylists);
        return validPlaylists;

    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        // Si l'erreur est liée à l'authentification, on retourne null plutôt que de rediriger
        return null;
    }
}






