export let playlists = [];
let currentPlaylistIndex = 0;

export async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        const token = localStorage.getItem('spotify_token');
        
        // Vérifier si le token existe
        if (!token) {
            throw new Error('Token Spotify non trouvé');
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
                    console.log('Chargement du fichier:', file);
                    const fileResponse = await fetch(file, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    if (fileResponse.status === 401) {
                        // Rediriger vers la page d'authentification si le token est invalide
                        window.location.href = 'auth.html';
                        return null;
                    }
                    
                    if (!fileResponse.ok) {
                        console.log(`Fichier ${file} non trouvé, ignoré`);
                        return null;
                    }
                    
                    const data = await fileResponse.json();
                    return {
                        name: data.playlist_name,
                        songs: data.songs
                    };
                } catch (error) {
                    console.log(`Erreur pour ${file}, ignoré:`, error);
                    return null;
                }
            })
        );

        // Filtrer les playlists null
        const validPlaylists = loadedPlaylists.filter(playlist => playlist !== null);
        console.log('Playlists valides chargées:', validPlaylists);
        return validPlaylists;

    } catch (error) {
        console.error('Erreur chargement playlists:', error);
        
        // Si l'erreur est liée à l'authentification, rediriger vers auth.html
        if (error.message.includes('Token') || error.message.includes('401')) {
            window.location.href = 'auth.html';
        }
        return [];
    }
}

export async function createPlaylistNavigation() {
    try {
        console.log('Début création de la navigation...');
        playlists = await loadPlaylists();  // Mise à jour de la variable playlists
        
        const container = document.getElementById('playlist-buttons');
        if (!container) {
            console.error('Container playlist-buttons non trouvé dans le DOM');
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
    }
}
