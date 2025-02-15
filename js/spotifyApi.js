export let player = null;
export let deviceId = null;

export async function fetchAlbumArtwork(trackUri, token) {
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
            albumArt.style.display = 'flex';
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artwork:', error);
    }
}

export function initializePlayer(token) {
    player = new Spotify.Player({
        name: 'Quiz Musical Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

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

let retryCount = 0;
const maxRetries = 3;

export const connectPlayer = async () => {
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