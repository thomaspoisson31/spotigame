export let player = null;
export let deviceId = null;

// Fonction pour vérifier le token
async function checkToken(token) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return response.ok;
    } catch (error) {
        console.error('Erreur de vérification du token:', error);
        return false;
    }
}

export async function fetchAlbumArtwork(trackUri, token) {
    try {
        if (!await checkToken(token)) {
            throw new Error('Token invalide');
        }

        const trackId = trackUri.split(':')[2];
        const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.album && data.album.images && data.album.images.length > 0) {
            const albumArt = document.getElementById('album-art');
            const albumImage = document.getElementById('album-image');
            
            if (albumArt && albumImage) {
                albumImage.src = data.album.images[0].url;
                albumImage.style.filter = 'blur(20px)';
                albumArt.style.display = 'flex';
            }
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artwork:', error);
        if (error.message.includes('Token invalide')) {
            return null;
        }
    }
}

export function initializePlayer(token) {
    if (!token) {
        console.error('Token manquant pour l\'initialisation du player');
        return;
    }

    player = new Spotify.Player({
        name: 'Quiz Musical Player',
        getOAuthToken: cb => { 
            checkToken(token).then(isValid => {
                if (isValid) {
                    cb(token);
                } else {
                    console.error('Token invalide lors de la récupération');
                    window.location.href = 'auth.html';
                }
            });
        },
        volume: 0.5
    });

    player.addListener('initialization_error', ({ message }) => {
        console.error('Erreur d\'initialisation:', message);
        // Ne pas rediriger immédiatement en cas d'erreur d'initialisation
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error('Erreur d\'authentification:', message);
        checkToken(token).then(isValid => {
            if (!isValid) {
                window.location.href = 'auth.html';
            }
        });
    });

    player.addListener('account_error', ({ message }) => {
        console.error('Erreur de compte Spotify:', message);
    });

    player.addListener('playback_error', ({ message }) => {
        console.error('Erreur de lecture:', message);
    });

    player.addListener('ready', ({ device_id }) => {
        console.log('Player prêt avec l\'ID:', device_id);
        deviceId = device_id;
    });

    player.addListener('not_ready', ({ device_id }) => {
        console.log('Player non prêt:', device_id);
    });

    connectPlayer();
}

let retryCount = 0;
const maxRetries = 3;
const retryDelay = 1000;

export const connectPlayer = async () => {
    try {
        if (!player) {
            throw new Error('Player non initialisé');
        }

        const connected = await player.connect();
        if (connected) {
            console.log('Connecté avec succès à Spotify');
            retryCount = 0; // Réinitialiser le compteur après une connexion réussie
        } else {
            throw new Error('Échec de la connexion');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        
        if (retryCount < maxRetries) {
            retryCount++;
            console.log(`Nouvelle tentative de connexion (${retryCount}/${maxRetries})...`);
            setTimeout(connectPlayer, retryDelay);
        } else {
            console.error('Nombre maximum de tentatives atteint');
            window.location.
