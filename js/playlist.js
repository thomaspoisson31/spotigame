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
