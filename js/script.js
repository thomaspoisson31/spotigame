let currentSong = null;
let player = null;
let deviceId = null;
let currentPlaylistIndex = 0;
const token = localStorage.getItem('spotify_token');
let playlists = [];

// Fonction pour charger les playlists
async function loadPlaylists() {
    try {
        console.log('Début du chargement des playlists...');
        const configResponse = await fetch('playlist_config.json');
        if (!configResponse.ok) {
            throw new Error('Impossible de charger le fichier de configuration');
        }
        const config = await configResponse.json();
        const files = config.playlist_files;

        console.log('Fichiers à charger depuis la configuration:', files);

        const loadedPlaylists = await Promise.all(
            files.map(async (file) => {
                try {
                    console.log('Chargement du fichier:', file);
                    const fileResponse = await fetch(file);
                    if (!fileResponse.ok) {
                        console.log(`Fichier ${file} non trouvé, ignoré`);
                        return null;
                    }
                    const data = await fileResponse.json();
                    return data;
                } catch (error) {
                    console.error(`Erreur lors du chargement du fichier ${file}:`, error);
                    return null;
                }
            })
        );

        return loadedPlaylists.filter(playlist => playlist !== null);
    } catch (error) {
        console.error('Erreur lors du chargement des playlists:', error);
        return [];
    }
}

// Nouvelle fonction pour créer la navigation des playlists
async function createPlaylistNavigation() {
    try {
        playlists = await loadPlaylists();
        const prevButton = document.querySelector('.prev-button');
        const nextButton = document.querySelector('.next-button');
        const playlistNameElement = document.querySelector('.playlist-name');

        async function updateCurrentPlaylist() {
            playlistNameElement.textContent = playlists[currentPlaylistIndex].name;
            await loadRandomSong(currentPlaylistIndex);
        }

        prevButton.addEventListener('click', () => {
            currentPlaylistIndex = (currentPlaylistIndex - 1 + playlists.length) % playlists.length;
            updateCurrentPlaylist();
        });

        nextButton.addEventListener('click', () => {
            currentPlaylistIndex = (currentPlaylistIndex + 1) % playlists.length;
            updateCurrentPlaylist();
        });

        // Initialisation avec la première playlist
        updateCurrentPlaylist();

    } catch (error) {
        console.error('Erreur lors de la création de la navigation:', error);
    }
}

// Fonction pour charger une chanson aléatoire
async function loadRandomSong(playlistIndex) {
    if (playlists[playlistIndex] && playlists[playlistIndex].songs.length > 0) {
        resetSongInfo();
        resetImage();
        
        const playlist = playlists[playlistIndex];
        const randomIndex = Math.floor(Math.random() * playlist.songs.length);
        currentSong = playlist.songs[randomIndex];

        if (deviceId) {
            try {
                await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                    method: 'PUT',
                    body: JSON.stringify({ uris: [currentSong.uri] }),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // Mettre à jour et révéler les informations
                document.querySelector('.song-title').textContent = currentSong.title;
                document.querySelector('.song-artist').textContent = currentSong.artist;
                document.querySelector('.song-year').textContent = `(${currentSong.year})`;
            } catch (error) {
                console.error('Erreur lors de la lecture:', error);
            }
        }
    }
}

// Fonction pour réinitialiser les informations de la chanson
function resetSongInfo() {
    document.querySelector('.song-title').textContent = '';
    document.querySelector('.song-artist').textContent = '';
    document.querySelector('.song-year').textContent = '';
}

// Fonction pour réinitialiser l'image
function resetImage() {
    const albumImage = document.getElementById('album-image');
    if (albumImage) {
        albumImage.src = '';
        albumImage.style.display = 'none';
    }
}

// Fonctions de gestion du token
function invalidateToken() {
    localStorage.setItem('spotify_token', 'invalid_token');
    console.log('Token invalidé');
    checkAndRefreshToken();
}

async function checkAndRefreshToken() {
    const token = localStorage.getItem('spotify_token');
    if (!token || token === 'invalid_token') {
        window.location.href = 'auth.html';
        return false;
    }
    return true;
}

// Initialisation du player Spotify
function initializePlayer() {
    player = new Spotify.Player({
        name: 'Quiz Musical Player',
        getOAuthToken: cb => {
            cb(localStorage.getItem('spotify_token'));
        },
        volume: 0.5
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Player prêt avec Device ID:', device_id);
        deviceId = device_id;
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID non prêt:', device_id);
    });

    player.addListener('player_state_changed', state => {
        if (state) {
            console.log('État du lecteur changé:', state);
        }
    });

    player.connect();
}

// Initialisation Spotify SDK
window.onSpotifyWebPlaybackSDKReady = async () => {
    console.log('SDK Spotify prêt');
    if (await checkAndRefreshToken()) {
        console.log('Token vérifié, initialisation du player...');
        initializePlayer();
        await createPlaylistNavigation();
        console.log('Initialisation terminée');
    }
};

// Gestion du volume
document.querySelector('.volume-button').addEventListener('click', () => {
    if (player) {
        player.getVolume().then(volume => {
            const newVolume = volume === 0 ? 0.5 : 0;
            player.setVolume(newVolume);
            document.querySelector('.volume-button').textContent = newVolume === 0 ? '🔈' : '🔊';
        });
    }
});