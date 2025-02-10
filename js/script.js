
        let currentSong = null;
        let player = null;
        let deviceId = null;
        const token = localStorage.getItem('spotify_token');
        let playlists = []; // Variable globale pour stocker les playlists

        // Fonction pour réinitialiser l'affichage des informations
        function resetSongInfo() {
            const songInfo = document.getElementById('song-info');
            const card = document.querySelector('#songCard .card');
            
            if (card) {
                card.classList.remove('revealed');
            }
            
            // Réinitialiser le contenu
            const titleElement = document.querySelector('.song-title');
            const artistElement = document.querySelector('.song-artist');
            const yearElement = document.querySelector('.song-year');
            
            if (titleElement) titleElement.textContent = '';
            if (artistElement) artistElement.textContent = '';
            if (yearElement) yearElement.textContent = ''; // Correction ici
        }





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
                
                const playlists = await Promise.all(
                    files.map(async (file) => {
                        try {
                            console.log('Chargement du fichier:', file);
                            const fileResponse = await fetch(file);
                            if (!fileResponse.ok) {
                                console.log(`Fichier ${file} non trouvé, ignoré`);
                                return null;
                            }
                            const data = await fileResponse.json();
                            
                            if (!data.playlist_name || !Array.isArray(data.songs)) {
                                console.log(`Format invalide pour ${file}, ignoré`);
                                return null;
                            }
                            
                            return {
                                filename: file,
                                name: data.playlist_name,
                                songs: data.songs
                            };
                        } catch (error) {
                            console.log(`Erreur pour ${file}, ignoré:`, error);
                            return null;
                        }
                    })
                );
                
                const validPlaylists = playlists.filter(playlist => playlist !== null);
                console.log('Playlists valides chargées:', validPlaylists);
                return validPlaylists;
                
            } catch (error) {
                console.error('Erreur chargement playlists:', error);
                return [];
            }
        }

        // Fonction pour créer les boutons avec gestion des états actifs
        async function createPlaylistButtons() {
            try {
                console.log('Début création des boutons...');
                playlists = await loadPlaylists();
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
                    
                    // Gestion du clic avec état actif
                    button.addEventListener('click', () => {
                        // Désactive tous les autres boutons
                        const buttons = document.querySelectorAll('.playlist-button');
                        buttons.forEach(btn => btn.classList.remove('active'));
                        
                        // Active le bouton cliqué
                        button.classList.add('active');
                        
                        // Charge une chanson aléatoire
                        loadRandomSong(index);
                    });
                    
                    container.appendChild(button);
                    console.log('Bouton créé pour:', playlist.name);
                });
            } catch (error) {
                console.error('Erreur lors de la création des boutons:', error);
            }
        }

        // Fonction pour charger une chanson aléatoire
        async function loadRandomSong(playlistIndex) {
            if (playlists[playlistIndex] && playlists[playlistIndex].songs.length > 0) {
                resetSongInfo();
                resetImage();
                
                const songs = playlists[playlistIndex].songs;
                const randomIndex = Math.floor(Math.random() * songs.length);
                currentSong = songs[randomIndex];

                await fetchAlbumArtwork(currentSong.uri);

                if (deviceId) {
                    fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                        method: 'PUT',
                        body: JSON.stringify({ uris: [currentSong.uri] }),
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        }
                    });
                }
            }
        }

        // Initialisation Spotify SDK
        window.onSpotifyWebPlaybackSDKReady = async () => {
            console.log('SDK Spotify prêt');
            if (await checkAndRefreshToken()) {
                console.log('Token vérifié, initialisation du player...');
                initializePlayer();
                await createPlaylistButtons();
                console.log('Initialisation terminée');
            }
        };

        // Vérification et rafraîchissement du token
        async function checkAndRefreshToken() {
            console.log('Vérification du token...');
            
            const justAuthenticated = localStorage.getItem('just_authenticated');
            if (justAuthenticated === 'true') {
                localStorage.removeItem('just_authenticated');
                return true;
            }
            
            const token = localStorage.getItem('spotify_token');
            const timestamp = localStorage.getItem('token_timestamp');
            const expiresIn = localStorage.getItem('token_expires_in');
            
            if (!token) {
                console.log('Aucun token trouvé');
                window.location.href = 'auth.html';
                return false;
            }

            const now = Date.now();
            const tokenAge = now - parseInt(timestamp);
            if (tokenAge >= parseInt(expiresIn) * 1000) {
                console.log('Token expiré');
                window.location.href = 'auth.html';
                return false;
            }

            try {
                const response = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    console.log('Token invalide');
                    window.location.href = 'auth.html';
                    return false;
                }
                
                console.log('Token valide');
                return true;
            } catch (error) {
                console.error('Erreur lors de la vérification du token:', error);
                return false;
            }
        }


        // Ajouter l'écouteur d'événement une fois le DOM chargé
        document.addEventListener('DOMContentLoaded', function() {
            const songCard = document.getElementById('songCard');
            if (songCard) {
                songCard.addEventListener('click', revealInfo);
            }
        });






        // Initialisation du player Spotify
        function initializePlayer() {
            player = new Spotify.Player({
                name: 'Quiz Musical Player',
                getOAuthToken: cb => { 
                    cb(localStorage.getItem('spotify_token')); 
                },
                volume: 0.5
            });

            // Listeners d'erreur
            player.addListener('initialization_error', ({ message }) => {
                console.error('Failed to initialize:', message);
                window.location.href = 'auth.html';
            });

            player.addListener('authentication_error', ({ message }) => {
                console.error('Failed to authenticate:', message);
                window.location.href = 'auth.html';
            });

            player.addListener('account_error', ({ message }) => {
                console.error('Failed to validate Spotify account:', message);
            });

            player.addListener('playback_error', ({ message }) => {
                console.error('Failed to perform playback:', message);
            });

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                deviceId = device_id;
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            connectPlayer();
        }

        // Gestion de la connexion avec retry
        let retryCount = 0;
        const maxRetries = 3;

        const connectPlayer = async () => {
            try {
                const connected = await player.connect();
                if (connected) {
                    console.log('Successfully connected to Spotify');
                } else {
                    throw new Error('Connection failed');
                }
            } catch (error) {
                console.error('Connection error:', error);
                if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(`Retrying connection (${retryCount}/${maxRetries})...`);
                    setTimeout(connectPlayer, 1000);
                } else {
                    console.error('Max retries reached, redirecting to auth');
                    window.location.href = 'auth.html';
                }
            }
        };

        // Gestion de la barre de progression
        function updateProgressBar(state) {
            if (state.duration && state.position) {
                const progress = (state.position / state.duration) * 100;
                document.getElementById('progress').style.width = `${progress}%`;
            }
        }

        // Gestion du bouton play/pause
        document.getElementById('togglePlay').addEventListener('click', () => {
            player.togglePlay();
        });

        // Gestion de l'image
        let imageRevealed = false;

        function resetImage() {
            const albumArt = document.getElementById('album-art');
            const albumImage = document.getElementById('album-image');
            albumImage.style.filter = 'blur(20px)';
            imageRevealed = false;
            albumArt.style.display = 'none';
        }

        function toggleImage() {
            const albumImage = document.getElementById('album-image');
            const songInfo = document.getElementById('song-info');
            const card = document.querySelector('#songCard .card');
            
            if (!imageRevealed) {
                // Révéler l'artwork
                albumImage.style.filter = 'none';
                imageRevealed = true;
                
                // Afficher et mettre à jour la carte d'information
                songInfo.style.display = 'block';
                
                // Mettre à jour et révéler les informations
                document.querySelector('.song-title').textContent = currentSong.title;
                document.querySelector('.song-artist').textContent = currentSong.artist;
                document.querySelector('.song-year').textContent = `(${currentSong.year})`;
                
                // Déclencher l'animation de rotation
                card.classList.add('revealed');
            }
        }
        // Récupération de l'artwork
        async function fetchAlbumArtwork(trackUri) {
            try {
                const trackId = trackUri.split(':')[2];
                
                const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                const data = await response.json();
                
                if (data.album && data.album.images && data.album.images.length > 0) {
                    const albumArt = document.getElementById('album-art');
                    const albumImage = document.getElementById('album-image');
                    albumImage.src = data.album.images[0].url;
                    albumImage.style.filter = 'blur(20px)';
                    albumArt.style.display = 'block';
                }
            } catch (error) {
                console.error('Erreur lors de la récupération de l\'artwork:', error);
            }
        }

        // Gestion du panel de debug
        document.addEventListener('DOMContentLoaded', function() {
            var debugButton = document.querySelector('.collapsible-debug');
            debugButton.addEventListener("click", function() {
                this.classList.toggle("active");
                var content = this.nextElementSibling;
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + "px";
                }
            });
        });

        // Fonctions de gestion du token
        function invalidateToken() {
            localStorage.setItem('spotify_token', 'invalid_token');
            console.log('Token invalidé');
            checkAndRefreshToken();
        }

        function expireToken() {
            localStorage.setItem('token_timestamp', '0');
            localStorage.setItem('token_expires_in', '0');
            console.log('Token expiré');
            checkAndRefreshToken();
        }

        function removeToken() {
            localStorage.removeItem('spotify_token');
            localStorage.removeItem('token_timestamp');
            localStorage.removeItem('token_expires_in');
            console.log('Token supprimé');
            checkAndRefreshToken();
        }

        // Vérification initiale du token
        if (!token) {
            window.location.href = 'auth.html';
        }
 